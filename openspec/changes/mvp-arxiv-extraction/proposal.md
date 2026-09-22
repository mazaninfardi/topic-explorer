# Proposal

## Why

The Pre-MVP proved the exploration UX with mocked content. The MVP makes it real: a user pastes an **arXiv link** and gets a genuine, model-generated **What → Why → How** graph with expandable salient terms, served from a real backend and deployed to Cloud Run. The extraction spike (`spikes/FINDINGS.md`) validated that Gemini produces accurate, accessible extractions, so we build the backend around that proven contract.

## What Changes

- Add a **FastAPI backend (BFF)** that resolves an arXiv link, fetches the PDF, and calls **Gemini (`gemini-2.5-flash`) via Vertex AI** (auth via ADC; PDF sent as **inline bytes**, structured JSON output).
- **What-first, two-call** extraction: call 1 returns **What + its salient terms** (streamed first); call 2 returns **Why/How + their salient terms**. Delivered to the FE over **SSE**.
- Swap the FE's `MockContentSource` for a **`BackendContentSource`** (via TanStack Query / streaming) behind the existing `ContentSource` seam — no graph rework.
- The root **What node gains Why and How actions**; clicking them opens special nodes (one each).
- **Salient terms are constrained to appear verbatim** in their node's text so the graph can highlight them.
- **Term definitions** on click call the model with the term + its surrounding node-text snippet (a general definition + one paper-flavored line) — the BFF stays stateless and never re-sends the whole PDF per click.
- Nodes show a **loading state** while their content streams in.
- **Deploy a single Cloud Run service** (FastAPI serves the built React static assets + the API). Config via env (`.env`/`.env.local`); no secrets in code (Vertex uses ADC).

Still out of scope (later): accounts/OAuth and persistence (M1/M2), expand/collapse (M1), PDF upload / non-arXiv (M3).

## Capabilities

### New Capabilities
- `paper-ingestion`: accept an arXiv link/ID, fetch the paper PDF, and validate the input — the entry point that feeds content-extraction.

### Modified Capabilities
- `content-extraction`: replace the mocked paragraph-based derivation with real Gemini extraction — What-first from the paper, Why/How, salient terms constrained to verbatim substrings, and model-generated term definitions grounded in a node-text snippet.
- `topic-graph`: the root What node exposes **Why** and **How** actions that open special nodes (one each); nodes display a loading state while their content is being fetched.

## Impact

- New `backend/` (FastAPI, uv) — Vertex client, arXiv fetch, SSE `/extract` and REST `/define` endpoints; stateless.
- FE: new `BackendContentSource`, TanStack Query wiring, SSE consumption, Why/How special nodes, loading states.
- New deployment path: Dockerfile + Cloud Run (single service serving built FE + API); GCP project `topic-explorer-509403`, region `us-central1`, Vertex AI API (already enabled).
- Config/secrets via `.env`/`.env.local`; Vertex auth via ADC (no key).
