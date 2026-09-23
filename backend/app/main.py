import asyncio
import json
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .arxiv import IngestionError, arxiv_id, fetch_pdf, fetch_title
from .auth import COOKIE, current_user, set_session_cookie, verify_google_token
from .config import settings
from .db import SessionLocal, get_session, init_db
from .gemini import GeminiExtractor
from .models import FamiliarTerm, PaperAnalysis, Topic, User


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Topic Explorer BFF", lifespan=lifespan)

_extractor: GeminiExtractor | None = None


def _get_extractor() -> GeminiExtractor:
    global _extractor
    if _extractor is None:
        _extractor = GeminiExtractor()
    return _extractor


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}


# ---------------------------------------------------------------- auth

def _user_public(user: User) -> dict:
    return {"authenticated": not user.is_guest, "guest": user.is_guest, "email": user.email, "name": user.name}


class GoogleAuthRequest(BaseModel):
    credential: str


@app.get("/api/auth/me")
async def auth_me(user: User = Depends(current_user)) -> dict:
    return _user_public(user)


@app.post("/api/auth/google")
async def auth_google(req: GoogleAuthRequest, response: Response) -> dict:
    try:
        claims = verify_google_token(req.credential)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=401, detail="Invalid Google token") from exc
    async with SessionLocal() as s:
        account = (
            await s.execute(select(User).where(User.google_sub == claims["sub"]))
        ).scalar_one_or_none()
        if account is None:
            account = User(
                google_sub=claims["sub"], email=claims.get("email"), name=claims.get("name"), is_guest=False
            )
            s.add(account)
        else:
            account.email = claims.get("email")
            account.name = claims.get("name")
        await s.commit()
        await s.refresh(account)
        set_session_cookie(response, account.id)
        return _user_public(account)


@app.post("/api/auth/logout")
async def auth_logout(response: Response) -> dict:
    response.delete_cookie(COOKIE, path="/")
    return {"ok": True}


# ---------------------------------------------------------------- topics

class TopicIn(BaseModel):
    title: str = ""
    graph: dict


def _topic_public(t: Topic) -> dict:
    return {"arxiv_id": t.arxiv_id, "title": t.title, "graph": t.graph, "updated_at": t.updated_at.isoformat()}


async def _find_topic(session: AsyncSession, user_id: str, aid: str) -> Topic | None:
    return (
        await session.execute(select(Topic).where(Topic.user_id == user_id, Topic.arxiv_id == aid))
    ).scalar_one_or_none()


@app.get("/api/topics")
async def list_topics(user: User = Depends(current_user), session: AsyncSession = Depends(get_session)) -> list:
    res = await session.execute(
        select(Topic).where(Topic.user_id == user.id).order_by(Topic.updated_at.desc())
    )
    return [_topic_public(t) for t in res.scalars().all()]


@app.get("/api/topics/{aid}")
async def get_topic(aid: str, user: User = Depends(current_user), session: AsyncSession = Depends(get_session)) -> dict:
    t = await _find_topic(session, user.id, aid)
    if t is None:
        raise HTTPException(status_code=404, detail="not found")
    return _topic_public(t)


@app.put("/api/topics/{aid}")
async def put_topic(
    aid: str, body: TopicIn, user: User = Depends(current_user), session: AsyncSession = Depends(get_session)
) -> dict:
    t = await _find_topic(session, user.id, aid)
    if t is None:
        if user.is_guest:
            count = await session.scalar(select(func.count()).select_from(Topic).where(Topic.user_id == user.id))
            if (count or 0) >= settings.guest_paper_limit:
                raise HTTPException(status_code=403, detail="guest-limit")
        session.add(Topic(user_id=user.id, arxiv_id=aid, title=body.title, graph=body.graph))
    else:
        t.title = body.title
        t.graph = body.graph
    await session.commit()
    return {"ok": True}


# ---------------------------------------------------------------- familiar

class FamiliarIn(BaseModel):
    term: str
    definition: str = ""


@app.get("/api/familiar")
async def list_familiar(user: User = Depends(current_user), session: AsyncSession = Depends(get_session)) -> list:
    res = await session.execute(
        select(FamiliarTerm).where(FamiliarTerm.user_id == user.id).order_by(FamiliarTerm.added_at.desc())
    )
    return [{"term": f.term, "definition": f.definition} for f in res.scalars().all()]


@app.post("/api/familiar")
async def add_familiar(body: FamiliarIn, user: User = Depends(current_user), session: AsyncSession = Depends(get_session)) -> dict:
    existing = await session.get(FamiliarTerm, {"user_id": user.id, "term": body.term})
    if existing is None:
        session.add(FamiliarTerm(user_id=user.id, term=body.term, definition=body.definition))
        await session.commit()
    return {"ok": True}


@app.delete("/api/familiar/{term}")
async def remove_familiar(term: str, user: User = Depends(current_user), session: AsyncSession = Depends(get_session)) -> dict:
    await session.execute(delete(FamiliarTerm).where(FamiliarTerm.user_id == user.id, FamiliarTerm.term == term))
    await session.commit()
    return {"ok": True}


# ---------------------------------------------------------------- extract / define

@app.get("/api/extract")
async def extract(arxiv: str, user: User = Depends(current_user)) -> StreamingResponse:
    async def gen():
        try:
            paper_id = arxiv_id(arxiv)
        except IngestionError as exc:
            yield _sse("error", {"message": str(exc)})
            return
        url = f"https://arxiv.org/abs/{paper_id}"

        async with SessionLocal() as s:
            cached = await s.get(PaperAnalysis, paper_id)
            if user.is_guest:
                already = await s.scalar(
                    select(func.count()).select_from(Topic).where(Topic.user_id == user.id, Topic.arxiv_id == paper_id)
                )
                if not already:
                    count = await s.scalar(select(func.count()).select_from(Topic).where(Topic.user_id == user.id))
                    if (count or 0) >= settings.guest_paper_limit:
                        yield _sse("error", {"message": "guest-limit"})
                        return
            if cached is not None:
                yield _sse("what", cached.what)
                yield _sse("why", cached.why)
                yield _sse("how", cached.how)
                return

        try:
            pdf = await fetch_pdf(arxiv)
        except IngestionError as exc:
            yield _sse("error", {"message": str(exc)})
            return
        title_task = asyncio.create_task(fetch_title(arxiv))
        try:
            what = await _get_extractor().extract_what(pdf)
            what = {**what, "title": await title_task, "url": url}
            yield _sse("what", what)
            why_how = await _get_extractor().extract_why_how(pdf)
            async with SessionLocal() as s:
                if await s.get(PaperAnalysis, paper_id) is None:
                    s.add(
                        PaperAnalysis(
                            arxiv_id=paper_id, title=what.get("title"), url=url,
                            what=what, why=why_how["why"], how=why_how["how"],
                        )
                    )
                    await s.commit()
            yield _sse("why", why_how["why"])
            yield _sse("how", why_how["how"])
        except Exception:  # noqa: BLE001
            title_task.cancel()
            yield _sse("error", {"message": "Extraction failed. Please try again."})

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


class DefineRequest(BaseModel):
    term: str


@app.post("/api/define")
async def define(req: DefineRequest) -> dict:
    return await _get_extractor().define(req.term)


# ---------------------------------------------------------------- static (container)

_DIST = (
    Path(os.environ["STATIC_DIR"])
    if os.getenv("STATIC_DIR")
    else Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
)
if _DIST.is_dir():
    app.mount("/", StaticFiles(directory=str(_DIST), html=True), name="static")
