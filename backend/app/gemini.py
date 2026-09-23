"""Gemini (Vertex AI) extraction: What-first, Why/How, and term definitions."""

from __future__ import annotations

import json

from google import genai
from google.genai import types

from .config import settings

_WHAT_SCHEMA = {
    "type": "object",
    "properties": {
        "what": {"type": "string"},
        "salient_terms": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["what", "salient_terms"],
}

_WHY_HOW_SCHEMA = {
    "type": "object",
    "properties": {
        "why": {"type": "string"},
        "why_terms": {"type": "array", "items": {"type": "string"}},
        "how": {"type": "string"},
        "how_terms": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["why", "why_terms", "how", "how_terms"],
}

_DEFINE_SCHEMA = {
    "type": "object",
    "properties": {
        "text": {"type": "string"},
        "terms": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["text", "terms"],
}

_AUDIENCE = (
    "You are helping a curious, intelligent non-expert with no background in the "
    "field. Use plain, genuinely understandable language and avoid jargon."
)

# Shared rule for what counts as a salient term (quality bar).
_SALIENT_RULE = (
    "A salient term is a SPECIALIZED concept a curious non-expert could NOT understand "
    "from a general dictionary — domain jargon, named methods/architectures/algorithms, "
    "or ideas that need background (e.g. 'residual connection', 'attention mechanism', "
    "'positional encoding'). Do NOT include ordinary words or generally-known terms "
    "(e.g. 'training', 'accuracy', 'usefulness', 'performance', 'image', 'dataset'). "
    "Each term MUST appear verbatim (exact substring) in the text. Prefer 3-6, but "
    "return only the ones that truly qualify (fewer is fine, even zero)."
)

_WHAT_PROMPT = (
    f"{_AUDIENCE}\n\nFrom the attached paper, produce:\n"
    "- what: 2-3 plain sentences on what this paper is and what it found (its headline).\n"
    f"- salient_terms: {_SALIENT_RULE}"
)

_WHY_HOW_PROMPT = (
    f"{_AUDIENCE}\n\nFrom the attached paper, produce:\n"
    "- why: 2-4 sentences on the prior context and the gap that motivated this work.\n"
    "- how: 2-4 sentences on what the authors actually did (the method), in accessible terms.\n"
    f"- why_terms / how_terms: for each of `why` and `how`, salient terms from that text. {_SALIENT_RULE}"
)


def _verbatim(text: str, terms: list[str]) -> list[str]:
    """Keep only terms that appear verbatim (case-insensitively) in text."""
    lowered = text.lower()
    seen: set[str] = set()
    out: list[str] = []
    for term in terms:
        key = term.lower()
        if key in lowered and key not in seen:
            seen.add(key)
            out.append(term)
    return out


class GeminiExtractor:
    def __init__(self) -> None:
        self._client = genai.Client(
            vertexai=True,
            project=settings.gcp_project,
            location=settings.gcp_location,
        )
        self._model = settings.gemini_model

    async def _json(self, parts: list[object], schema: dict) -> dict:
        resp = await self._client.aio.models.generate_content(
            model=self._model,
            contents=parts,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=schema,
            ),
        )
        return json.loads(resp.text)

    async def extract_what(self, pdf: bytes) -> dict:
        data = await self._json(
            [types.Part.from_bytes(data=pdf, mime_type="application/pdf"), _WHAT_PROMPT],
            _WHAT_SCHEMA,
        )
        return {
            "text": data["what"],
            "terms": _verbatim(data["what"], data.get("salient_terms", [])),
        }

    async def extract_why_how(self, pdf: bytes) -> dict:
        data = await self._json(
            [types.Part.from_bytes(data=pdf, mime_type="application/pdf"), _WHY_HOW_PROMPT],
            _WHY_HOW_SCHEMA,
        )
        return {
            "why": {"text": data["why"], "terms": _verbatim(data["why"], data.get("why_terms", []))},
            "how": {"text": data["how"], "terms": _verbatim(data["how"], data.get("how_terms", []))},
        }

    async def define(self, term: str) -> dict:
        prompt = (
            f"{_AUDIENCE}\n\nDefine the term \"{term}\" in 1-2 plain sentences for a "
            f"newcomer.\n- text: the definition.\n- terms: 0-4 salient terms. {_SALIENT_RULE} "
            f"Do NOT include \"{term}\" itself (or a variant of it) in `terms` — a term "
            "must never be a salient term inside its own definition."
        )
        data = await self._json([prompt], _DEFINE_SCHEMA)
        terms = _verbatim(data["text"], data.get("terms", []))
        # Guard against a cyclic definition: drop terms overlapping the defined term.
        tl = term.lower()
        terms = [t for t in terms if tl not in t.lower() and t.lower() not in tl]
        return {"text": data["text"], "terms": terms}
