"""arXiv reference normalization and PDF retrieval (paper-ingestion)."""

from __future__ import annotations

import re

import httpx

_ARXIV_ID = re.compile(r"(\d{4}\.\d{4,5})(v\d+)?")


class IngestionError(Exception):
    """User-facing ingestion problem (bad input or fetch failure)."""


def to_pdf_url(ref: str) -> str:
    """Normalize an arXiv URL or bare ID to its canonical PDF URL.

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

    arxiv_id = match.group(1) + (match.group(2) or "")
    return f"https://arxiv.org/pdf/{arxiv_id}"


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
