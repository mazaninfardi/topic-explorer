"""arXiv reference normalization and PDF retrieval (paper-ingestion)."""

from __future__ import annotations

import re

import httpx

_ARXIV_ID = re.compile(r"(\d{4}\.\d{4,5})(v\d+)?")


class IngestionError(Exception):
    """User-facing ingestion problem (bad input or fetch failure)."""


def arxiv_id(ref: str) -> str:
    """Extract the canonical arXiv id (with version, if any) from a reference.

    Raises IngestionError for anything that isn't a recognizable arXiv reference.
    """
    ref = ref.strip()
    if not ref:
        raise IngestionError("Please paste an arXiv link or ID.")

    match = _ARXIV_ID.search(ref)
    is_arxiv = "arxiv.org" in ref.lower() or (
        match is not None and _ARXIV_ID.fullmatch(ref) is not None
    )
    if match is None or not is_arxiv:
        raise IngestionError("Only arXiv links are supported at this stage.")

    return match.group(1) + (match.group(2) or "")


def to_pdf_url(ref: str) -> str:
    """Normalize an arXiv URL or bare ID to its canonical PDF URL."""
    return f"https://arxiv.org/pdf/{arxiv_id(ref)}"


async def fetch_pdf(ref: str) -> bytes:
    """Resolve an arXiv reference and download its PDF bytes."""
    url = to_pdf_url(ref)  # may raise IngestionError (invalid input)
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
            resp = await client.get(
                url, headers={"User-Agent": "topic-explorer/0.1 (arxiv fetch)"}
            )
            resp.raise_for_status()
            return resp.content
    except httpx.HTTPError as exc:
        raise IngestionError("Could not retrieve that arXiv paper.") from exc


def is_arxiv_ref(ref: str) -> bool:
    """True if `ref` looks like an arXiv link or bare id (vs. a free-text topic)."""
    try:
        arxiv_id(ref)
        return True
    except IngestionError:
        return False


_SEARCH_ID = re.compile(r"<entry>.*?<id>https?://arxiv\.org/abs/([^<]+?)</id>", re.DOTALL)


async def search_arxiv(query: str) -> str | None:
    """Resolve a free-text topic to the most relevant arXiv id, or None."""
    q = query.strip()
    if not q:
        return None
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                "https://export.arxiv.org/api/query",
                params={
                    "search_query": f"all:{q}",
                    "sortBy": "relevance",
                    "start": 0,
                    "max_results": 1,
                },
                headers={"User-Agent": "topic-explorer/0.1 (arxiv search)"},
            )
            resp.raise_for_status()
    except httpx.HTTPError:
        return None
    m = _SEARCH_ID.search(resp.text)
    if not m:
        return None
    # The <id> is like 1706.03762v5 — normalize to the canonical id.
    raw = m.group(1).strip()
    hit = _ARXIV_ID.search(raw)
    return (hit.group(1) + (hit.group(2) or "")) if hit else None


_ENTRY_TITLE = re.compile(r"<entry>.*?<title>(.*?)</title>", re.DOTALL)


async def fetch_title(ref: str) -> str | None:
    """Best-effort fetch of the paper's title from the arXiv API (None on failure)."""
    try:
        aid = arxiv_id(ref)
    except IngestionError:
        return None
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"https://export.arxiv.org/api/query?id_list={aid}",
                headers={"User-Agent": "topic-explorer/0.1 (arxiv fetch)"},
            )
            resp.raise_for_status()
            m = _ENTRY_TITLE.search(resp.text)
            return " ".join(m.group(1).split()) if m else None
    except httpx.HTTPError:
        return None
