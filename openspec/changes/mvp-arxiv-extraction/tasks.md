# Tasks

## 1. Backend scaffold

- [x] 1.1 Create `backend/` (uv, FastAPI, uvicorn); `uv run uvicorn` serves a `/api/health` returning ok
- [x] 1.2 Add `backend/.env.example` (`GCP_PROJECT`, `GCP_LOCATION`, `GEMINI_MODEL`) and env loading; verify config loads with `.env` overriding defaults
- [x] 1.3 Ensure `.env*` is git-ignored at backend level (root .gitignore already covers it); verify `git status` shows no `.env`

## 2. arXiv ingestion (paper-ingestion)

- [x] 2.1 Implement arXiv reference normalization (URL/abs/pdf/bare ID → canonical PDF URL) with validation; unit-test valid and non-arXiv inputs
- [x] 2.2 Fetch the PDF (descriptive User-Agent, timeout); return a clear error on non-arXiv input or fetch failure; verify with one real ID and one bad input

## 3. Gemini extraction (Vertex)

- [x] 3.1 Add a `GeminiExtractor` using `google-genai` (`vertexai=True`, project/location/model from env), PDF as inline bytes, structured `response_schema`; verify a live call on one arXiv PDF returns valid What JSON
- [x] 3.2 Implement the two prompts/schemas: What (+terms) and Why/How (+terms), reusing the spike's contract; verify both against a real paper
- [x] 3.3 Filter salient terms to those appearing verbatim in their text; unit-test the filter drops non-substring terms
- [x] 3.4 Implement `define(term)` → general plain-language definition + verbatim salient terms (no paper context); verify a live call returns usable content

## 4. API endpoints

- [x] 4.1 `GET /api/extract?arxiv=<ref>` streams SSE: `what` event first, then `why`, then `how` (errors as an `error` event); verified via curl that `what` arrives before `why`/`how`
- [x] 4.2 `POST /api/define {term}` returns `{text, terms}`; verified via curl
- [x] 4.3 Serve the built frontend static assets from FastAPI (SPA fallback) so one service hosts FE + API (mounted when `frontend/dist` exists)

## 5. Frontend integration

- [x] 5.1 Add `BackendContentSource` implementing `ContentSource`: `explore` opens the SSE stream (seeds What, then streams Why/How), `defineTerm` calls `/api/define`; swapped in behind the seam
- [x] 5.2 Store: add Why/How special-node actions (single node each, dedupe) and a per-node loading state; unit-tested the dedupe + loading transitions
- [x] 5.3 WhatNode: render Why/How actions that open special nodes; SpecialNode component (carries salient terms); verified rendering
- [x] 5.4 Show a loading indicator on nodes whose content is streaming; verified it is replaced when content arrives
- [x] 5.5 Replace the paragraph input with an arXiv-link input; show ingestion/extraction errors clearly; verified the error path

## 6. Local end-to-end

- [x] 6.1 Ran FE (Vite) + BE (uvicorn) locally with a real arXiv link: What appears first, then Why/How special nodes, then term expansion — verified live in-browser, no console/server errors
- [x] 6.2 `pnpm test` (FE, 9) and backend unit tests (10) pass; `openspec validate mvp-arxiv-extraction --strict` passes

## 7. Deploy to Cloud Run

- [x] 7.1 Multi-stage Dockerfile (Node builds FE → uv/Python runs FastAPI serving `/app/static` + API); verified the image builds and runs locally end-to-end (FE + live Vertex extraction via mounted ADC)
- [x] 7.2 Deployed to Cloud Run (`topic-explorer-509403`, `us-central1`) with a least-privilege runtime SA `topic-explorer-run` (roles/aiplatform.user), public. Live URL verified end-to-end: https://topic-explorer-732083437898.us-central1.run.app
  - Custom domain (`topic-explorer.mazanin.com`) pending: requires domain-ownership verification, then a Cloud Run domain mapping (CNAME → ghs.googlehosted.com).
