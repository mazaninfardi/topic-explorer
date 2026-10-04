import asyncio
import base64
import json
import os
import secrets
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.responses import RedirectResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .arxiv import IngestionError, arxiv_id, fetch_meta, fetch_pdf
from .figures import render_figures
from .auth import COOKIE, build_auth_url, current_user, exchange_code, set_session_cookie
from .config import settings
from .db import SessionLocal, get_session, init_db
from .gemini import GeminiExtractor
from .models import FamiliarTerm, PaperAnalysis, PaperFigures, Topic, User


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
    info = {"authenticated": not user.is_guest, "guest": user.is_guest, "email": user.email, "name": user.name}
    if user.is_guest:
        used = len(user.explored or [])
        info["papers_left"] = max(0, settings.guest_paper_limit - used)
        info["guest_limit"] = settings.guest_paper_limit
    return info


def _require_account(user: User) -> None:
    if user.is_guest:
        raise HTTPException(status_code=401, detail="sign-in required")


@app.get("/api/auth/me")
async def auth_me(user: User = Depends(current_user)) -> dict:
    return _user_public(user)


@app.get("/api/auth/login")
async def auth_login() -> RedirectResponse:
    state = secrets.token_urlsafe(16)
    resp = RedirectResponse(build_auth_url(state))
    resp.set_cookie("oauth_state", state, httponly=True, samesite="lax", max_age=600, path="/")
    return resp


@app.get("/api/auth/callback")
async def auth_callback(request: Request, code: str = "", state: str = "") -> RedirectResponse:
    if not code or not state or state != request.cookies.get("oauth_state"):
        return RedirectResponse(f"{settings.app_base_url}/?auth=failed")
    try:
        claims = await exchange_code(code)
    except Exception:  # noqa: BLE001
        return RedirectResponse(f"{settings.app_base_url}/?auth=failed")
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
        uid = account.id
    resp = RedirectResponse(f"{settings.app_base_url}/")
    set_session_cookie(resp, uid)
    resp.delete_cookie("oauth_state", path="/")
    return resp


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
    _require_account(user)  # guests don't persist topics
    t = await _find_topic(session, user.id, aid)
    if t is None:
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
    _require_account(user)  # guests don't persist familiar terms
    existing = await session.get(FamiliarTerm, {"user_id": user.id, "term": body.term})
    if existing is None:
        session.add(FamiliarTerm(user_id=user.id, term=body.term, definition=body.definition))
        await session.commit()
    return {"ok": True}


@app.delete("/api/familiar/{term}")
async def remove_familiar(term: str, user: User = Depends(current_user), session: AsyncSession = Depends(get_session)) -> dict:
    _require_account(user)
    await session.execute(delete(FamiliarTerm).where(FamiliarTerm.user_id == user.id, FamiliarTerm.term == term))
    await session.commit()
    return {"ok": True}


# ---------------------------------------------------------------- extract / define

def _strip_abstract_for_guest(what: dict | None, user: User) -> dict | None:
    """Withhold the (signed-in-only) abstract from a guest without re-caching."""
    if what is not None and user.is_guest and "abstract" in what:
        return {k: v for k, v in what.items() if k != "abstract"}
    return what


async def _record_guest_paper(user: User, paper_id: str) -> None:
    """Count a paper against a guest's free quota — only after a real result."""
    if not user.is_guest:
        return
    async with SessionLocal() as s:
        guser = await s.get(User, user.id)
        if guser is None:
            return
        explored = list(guser.explored or [])
        if paper_id not in explored:
            guser.explored = [*explored, paper_id]
            await s.commit()


@app.get("/api/extract")
async def extract(arxiv: str, user: User = Depends(current_user)) -> StreamingResponse:
    async def gen():
        try:
            paper_id = arxiv_id(arxiv)
        except IngestionError as exc:
            yield _sse("error", {"message": str(exc)})
            return
        url = f"https://arxiv.org/abs/{paper_id}"

        cached_what = cached_why = cached_how = None
        async with SessionLocal() as s:
            cached = await s.get(PaperAnalysis, paper_id)
            if cached is not None:
                cached_what, cached_why, cached_how = cached.what, cached.why, cached.how
            if user.is_guest:
                guser = await s.get(User, user.id)
                explored = list(guser.explored or []) if guser else []
                if paper_id not in explored and len(explored) >= settings.guest_paper_limit:
                    yield _sse("error", {"message": "guest-limit"})
                    return

        if cached_what is not None:
            # A cached hit is a guaranteed result — count the guest's paper now.
            await _record_guest_paper(user, paper_id)
            # The abstract rides along in the `what` payload (stashed under
            # "abstract") — a signed-in perk, so strip it for guests.
            yield _sse("what", _strip_abstract_for_guest(cached_what, user))
            yield _sse("why", cached_why)
            yield _sse("how", cached_how)
            return

        try:
            pdf = await fetch_pdf(paper_id)
        except IngestionError as exc:
            yield _sse("error", {"message": str(exc)})
            return
        meta_task = asyncio.create_task(fetch_meta(paper_id))
        try:
            what = await _get_extractor().extract_what(pdf)
            title, abstract = await meta_task
            # Keep the authors' verbatim abstract on the `what` payload so it is
            # cached and restored without a new column or a separate round-trip.
            # Always cache the abstract; only withhold it from guests on the wire.
            what = {**what, "title": title, "url": url, "abstract": abstract}
            yield _sse("what", _strip_abstract_for_guest(what, user))
            # Only count the guest's paper once we've actually produced a result.
            await _record_guest_paper(user, paper_id)
            why_how = await _get_extractor().extract_why_how(pdf)
            async with SessionLocal() as s:
                if await s.get(PaperAnalysis, paper_id) is None:
                    s.add(
                        PaperAnalysis(
                            arxiv_id=paper_id, title=title, url=url,
                            what=what, why=why_how["why"], how=why_how["how"],
                        )
                    )
                    await s.commit()
            yield _sse("why", why_how["why"])
            yield _sse("how", why_how["how"])
        except Exception:  # noqa: BLE001
            meta_task.cancel()
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


# ---------------------------------------------------------------- box enrichment

@app.get("/api/abstract")
async def abstract(arxiv: str, user: User = Depends(current_user)) -> dict:
    """The paper's verbatim abstract — cache first, else a fresh arXiv fetch.

    Fallback for a restored graph whose `pending.abstract` predates this feature.
    Signed-in only (an enrichment feature).
    """
    _require_account(user)
    try:
        paper_id = arxiv_id(arxiv)
    except IngestionError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    async with SessionLocal() as s:
        cached = await s.get(PaperAnalysis, paper_id)
        if cached is not None and (cached.what or {}).get("abstract"):
            return {"text": cached.what["abstract"], "terms": []}
    _, text = await fetch_meta(paper_id)
    if not text:
        raise HTTPException(status_code=404, detail="No abstract found for that paper.")
    return {"text": text, "terms": []}


class RephraseRequest(BaseModel):
    text: str
    level: str
    context: str | None = None


_LEVELS = {"simpler", "standard", "technical"}


@app.post("/api/rephrase")
async def rephrase(req: RephraseRequest, user: User = Depends(current_user)) -> dict:
    _require_account(user)  # signed-in only (a costly model call)
    if req.level not in _LEVELS:
        raise HTTPException(status_code=400, detail="invalid level")
    return await _get_extractor().rephrase(req.text, req.level, req.context)


class AskRequest(BaseModel):
    question: str
    box_text: str
    arxiv: str | None = None


@app.post("/api/ask")
async def ask(req: AskRequest, user: User = Depends(current_user)) -> dict:
    _require_account(user)  # custom questions are a signed-in feature
    pdf: bytes | None = None
    if req.arxiv:
        try:
            pdf = await fetch_pdf(req.arxiv)
        except IngestionError:
            pdf = None  # answer from the box text alone if the PDF won't load
    return await _get_extractor().answer(req.question, req.box_text, pdf)


# ---------------------------------------------------------------- figures

def _figures_manifest(paper_id: str, figures: list) -> list[dict]:
    """Public manifest: number + caption + a backend image URL (no bytes inline)."""
    return [
        {"number": f.get("number", str(i + 1)), "caption": f.get("caption", ""),
         "imageUrl": f"/api/figimg?arxiv={paper_id}&idx={i}"}
        for i, f in enumerate(figures)
    ]


async def _extract_figures(paper_id: str) -> list:
    """Locate + render a paper's figures and cache the row (idempotent)."""
    pdf = await fetch_pdf(paper_id)
    specs = await _get_extractor().locate_figures(pdf)
    figures = await asyncio.to_thread(render_figures, pdf, specs) if specs else []
    async with SessionLocal() as s:
        if await s.get(PaperFigures, paper_id) is None:
            s.add(PaperFigures(arxiv_id=paper_id, figures=figures))
            await s.commit()
    return figures


@app.get("/api/figures")
async def figures(arxiv: str, user: User = Depends(current_user)) -> dict:
    """The paper's figures, extracted on first request and cached thereafter.

    Signed-in only — extraction is a model call plus PDF rendering (costly).
    """
    _require_account(user)
    try:
        paper_id = arxiv_id(arxiv)
    except IngestionError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    async with SessionLocal() as s:
        cached = await s.get(PaperFigures, paper_id)
    figs = cached.figures if cached is not None else None
    if figs is None:
        try:
            figs = await _extract_figures(paper_id)
        except IngestionError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=500, detail="Could not extract figures.") from exc
    return {"figures": _figures_manifest(paper_id, figs)}


@app.get("/api/figimg")
async def figimg(arxiv: str, idx: int, user: User = Depends(current_user)) -> Response:
    """Serve one cached figure image by index (bytes decoded from the DB row)."""
    _require_account(user)  # figures are a signed-in feature
    try:
        paper_id = arxiv_id(arxiv)
    except IngestionError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    async with SessionLocal() as s:
        row = await s.get(PaperFigures, paper_id)
    figs = row.figures if row is not None else []
    if idx < 0 or idx >= len(figs):
        raise HTTPException(status_code=404, detail="no such figure")
    fig = figs[idx]
    try:
        data = base64.b64decode(fig["b64"])
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=404, detail="figure unavailable") from exc
    return Response(
        content=data,
        media_type=fig.get("content_type", "image/png"),
        headers={"Cache-Control": "public, max-age=86400"},
    )


# ---------------------------------------------------------------- static (container)

_DIST = (
    Path(os.environ["STATIC_DIR"])
    if os.getenv("STATIC_DIR")
    else Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
)
if _DIST.is_dir():
    app.mount("/", StaticFiles(directory=str(_DIST), html=True), name="static")
