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


_ENTRY_TITLE = re.compile(r"<entry>.*?<title>(.*?)</title>", re.DOTALL)
_ENTRY_SUMMARY = re.compile(r"<entry>.*?<summary>(.*?)</summary>", re.DOTALL)


def _clean(text: str) -> str:
    """Collapse the arXiv API's wrapped/indented text into clean prose."""
    return " ".join(text.split())


async def fetch_meta(ref: str) -> tuple[str | None, str | None]:
    """Best-effort fetch of (title, abstract) from the arXiv API in one call.

    Returns (None, None) on any failure; either field may be None individually.
    The abstract is the authors' verbatim ``<summary>`` — no model involved.
    """
    try:
        aid = arxiv_id(ref)
    except IngestionError:
        return None, None
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"https://export.arxiv.org/api/query?id_list={aid}",
                headers={"User-Agent": "topic-explorer/0.1 (arxiv fetch)"},
            )
            resp.raise_for_status()
            title_m = _ENTRY_TITLE.search(resp.text)
            summary_m = _ENTRY_SUMMARY.search(resp.text)
            title = _clean(title_m.group(1)) if title_m else None
            abstract = _clean(summary_m.group(1)) if summary_m else None
            return title, abstract
    except httpx.HTTPError:
        return None, None


async def fetch_title(ref: str) -> str | None:
    """Best-effort fetch of just the paper's title (None on failure)."""
    title, _ = await fetch_meta(ref)
    return title
