"""Throwaway spike: does Gemini (via Vertex AI) produce good What/Why/How +
salient terms from a real arXiv PDF? NOT part of the app. Run:

    export PATH="$HOME/.local/bin:$PATH"
    cd spikes && uv run extract_spike.py

Requires: Application Default Credentials (gcloud auth application-default
login) and the Vertex AI API enabled on the project.
"""

from __future__ import annotations

import json
import os
import pathlib
import time
import urllib.request

from google import genai
from google.genai import types

PROJECT = os.environ.get("GCP_PROJECT", "topic-explorer-509403")
LOCATION = os.environ.get("GCP_LOCATION", "us-central1")
MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

# A spread of well-known papers across subfields to gauge generality.
PAPERS = {
    "attention-is-all-you-need": "https://arxiv.org/pdf/1706.03762",
    "bert": "https://arxiv.org/pdf/1810.04805",
    "resnet": "https://arxiv.org/pdf/1512.03385",
    "alphafold2": "https://arxiv.org/pdf/2203.00555",
}

RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "what": {
            "type": "string",
            "description": "2-3 plain sentences: what this paper is and what it found (M1+M5).",
        },
        "why": {
            "type": "string",
            "description": "2-4 sentences: the prior context and the gap that motivates it (M2+M3).",
        },
        "how": {
            "type": "string",
            "description": "2-4 sentences: what the authors actually did / the method (M4).",
        },
        "salient_terms": {
            "type": "array",
            "items": {"type": "string"},
            "description": "4-8 key technical terms a curious newcomer would need defined.",
        },
    },
    "required": ["what", "why", "how", "salient_terms"],
}

PROMPT = (
    "You are helping a curious, intelligent non-expert understand this scientific "
    "paper. They have no background in the field. From the attached PDF, extract:\n"
    "- what: 2-3 plain-language sentences on what the paper is and what it found.\n"
    "- why: 2-4 sentences on the prior context and the gap that motivated it.\n"
    "- how: 2-4 sentences on what the authors actually did (the method), in accessible terms.\n"
    "- salient_terms: 4-8 key technical terms from the above that a newcomer would need defined.\n"
    "Avoid jargon in what/why/how; keep it genuinely understandable."
)


def fetch_pdf(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "topic-explorer-spike/0.1"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def main() -> None:
    client = genai.Client(vertexai=True, project=PROJECT, location=LOCATION)
    outdir = pathlib.Path(__file__).parent / "outputs"
    outdir.mkdir(exist_ok=True)
    print(f"model={MODEL} project={PROJECT} location={LOCATION}\n")

    for name, url in PAPERS.items():
        t0 = time.time()
        try:
            pdf = fetch_pdf(url)
            resp = client.models.generate_content(
                model=MODEL,
                contents=[
                    types.Part.from_bytes(data=pdf, mime_type="application/pdf"),
                    PROMPT,
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=RESPONSE_SCHEMA,
                ),
            )
            data = json.loads(resp.text)
            (outdir / f"{name}.json").write_text(json.dumps(data, indent=2))
            dt = time.time() - t0
            usage = getattr(resp, "usage_metadata", None)
            tokens = getattr(usage, "total_token_count", "?") if usage else "?"
            print(f"[ok]   {name:26} {dt:5.1f}s  pdf={len(pdf) // 1024}KB  tokens={tokens}")
            print(f"       terms: {', '.join(data.get('salient_terms', []))}\n")
        except Exception as e:  # noqa: BLE001 - spike: report and continue
            print(f"[FAIL] {name:26} {type(e).__name__}: {e}\n")


if __name__ == "__main__":
    main()
