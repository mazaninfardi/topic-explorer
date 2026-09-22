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

_WHAT_PROMPT = (
    f"{_AUDIENCE}\n\nFrom the attached paper, produce:\n"
    "- what: 2-3 plain sentences on what this paper is and what it found (its headline).\n"
    "- salient_terms: 3-6 key technical terms that a newcomer would need defined. "
    "Each term MUST appear verbatim (as an exact substring) in the `what` text."
)

_WHY_HOW_PROMPT = (
    f"{_AUDIENCE}\n\nFrom the attached paper, produce:\n"
    "- why: 2-4 sentences on the prior context and the gap that motivated this work.\n"
    "- why_terms: 3-6 key terms, each appearing verbatim in `why`.\n"
    "- how: 2-4 sentences on what the authors actually did (the method), in accessible terms.\n"
    "- how_terms: 3-6 key terms, each appearing verbatim in `how`."
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
            "newcomer.\n- text: the definition.\n- terms: 0-4 key words that appear "
            "verbatim in `text` and are themselves worth exploring."
        )
        data = await self._json([prompt], _DEFINE_SCHEMA)
        return {
            "text": data["text"],
            "terms": _verbatim(data["text"], data.get("terms", [])),
        }
