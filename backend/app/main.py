import json
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .arxiv import IngestionError, arxiv_id, fetch_pdf
from .gemini import GeminiExtractor

app = FastAPI(title="Topic Explorer BFF")

_extractor: GeminiExtractor | None = None
# In-memory extraction cache keyed by canonical arXiv id (per process).
_extract_cache: dict[str, dict] = {}


def _get_extractor() -> GeminiExtractor:
    # Lazy so /api/health works even before Vertex/ADC is reachable.
    global _extractor
    if _extractor is None:
        _extractor = GeminiExtractor()
    return _extractor


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}


@app.get("/api/extract")
async def extract(arxiv: str) -> StreamingResponse:
    async def gen():
        try:
            paper_id = arxiv_id(arxiv)
        except IngestionError as exc:
            yield _sse("error", {"message": str(exc)})
            return

        cached = _extract_cache.get(paper_id)
        if cached is not None:
            yield _sse("what", cached["what"])
            yield _sse("why", cached["why"])
            yield _sse("how", cached["how"])
            return

        try:
            pdf = await fetch_pdf(arxiv)
        except IngestionError as exc:
            yield _sse("error", {"message": str(exc)})
            return
        try:
            what = await _get_extractor().extract_what(pdf)
            yield _sse("what", what)
            why_how = await _get_extractor().extract_why_how(pdf)
            # Cache BEFORE the final yields: the client closes the stream on
            # receiving `how`, which cancels this generator — so a cache write
            # placed after those yields would never run.
            _extract_cache[paper_id] = {"what": what, "why": why_how["why"], "how": why_how["how"]}
            yield _sse("why", why_how["why"])
            yield _sse("how", why_how["how"])
        except Exception:  # noqa: BLE001 - surface a clean error to the client
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


# In the container, FastAPI also serves the built frontend (STATIC_DIR points
# at it). In local dev the frontend runs on Vite and proxies /api here, so this
# mount is simply absent.
_DIST = (
    Path(os.environ["STATIC_DIR"])
    if os.getenv("STATIC_DIR")
    else Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
)
if _DIST.is_dir():
    app.mount("/", StaticFiles(directory=str(_DIST), html=True), name="static")
