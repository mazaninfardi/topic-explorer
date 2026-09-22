# Tasks

## 1. Backend scaffold

- [ ] 1.1 Create `backend/` (uv, FastAPI, uvicorn); `uv run uvicorn` serves a `/api/health` returning ok
- [ ] 1.2 Add `backend/.env.example` (`GCP_PROJECT`, `GCP_LOCATION`, `GEMINI_MODEL`) and env loading; verify config loads with `.env` overriding defaults
- [ ] 1.3 Ensure `.env*` is git-ignored at backend level (root .gitignore already covers it); verify `git status` shows no `.env`

## 2. arXiv ingestion (paper-ingestion)

- [ ] 2.1 Implement arXiv reference normalization (URL/abs/pdf/bare ID → canonical PDF URL) with validation; unit-test valid and non-arXiv inputs
- [ ] 2.2 Fetch the PDF (descriptive User-Agent, timeout); return a clear error on non-arXiv input or fetch failure; verify with one real ID and one bad input

## 3. Gemini extraction (Vertex)

- [ ] 3.1 Add a `GeminiExtractor` using `google-genai` (`vertexai=True`, project/location/model from env), PDF as inline bytes, structured `response_schema`; verify a live call on one arXiv PDF returns valid What JSON
- [ ] 3.2 Implement the two prompts/schemas: What (+terms) and Why/How (+terms), reusing the spike's contract; verify both against a real paper
- [ ] 3.3 Filter salient terms to those appearing verbatim in their text; unit-test the filter drops non-substring terms
- [ ] 3.4 Implement `define(term, snippet)` → general definition + one snippet-grounded line + verbatim terms; verify a live call returns usable content

## 4. API endpoints

- [ ] 4.1 `GET /api/extract?arxiv=<ref>` streams SSE: `what` event first, then `why`, then `how` (errors as an `error` event); verify with curl that `what` arrives before `why`/`how`
- [ ] 4.2 `POST /api/define {term, snippet}` returns `{text, terms}`; verify with curl
- [ ] 4.3 Serve the built frontend static assets from FastAPI (SPA fallback) so one service hosts FE + API; verify the root path serves the app

## 5. Frontend integration

- [ ] 5.1 Add `BackendContentSource` implementing `ContentSource`: `deriveWhat` opens the SSE stream (seeds What, then streams Why/How), `defineTerm` calls `/api/define`; wire TanStack Query; swap it in behind the seam (Mock retained for tests)
- [ ] 5.2 Store: add Why/How special-node actions (single node each, dedupe) and a per-node loading state; unit-test the dedupe + loading transitions
- [ ] 5.3 WhatNode: render Why/How actions that open special nodes; build a WhyHow/special node component (carries salient terms); verify rendering
- [ ] 5.4 Show a loading indicator on nodes whose content is streaming; verify it is replaced when content arrives
- [ ] 5.5 Replace the paragraph input with an arXiv-link input; show ingestion/extraction errors clearly; verify the error path

## 6. Local end-to-end

- [ ] 6.1 Run FE (Vite) + BE (uvicorn) locally, paste a real arXiv link, and confirm What appears first, then Why/How, then term/Why/How expansion works with no console/server errors; capture a short screen recording
- [ ] 6.2 `pnpm test` (FE) and backend unit tests pass; `openspec validate mvp-arxiv-extraction --strict` passes

## 7. Deploy to Cloud Run

- [ ] 7.1 Add a Dockerfile that builds the FE and runs FastAPI serving the static build + API; verify the image runs locally and serves the app end-to-end
- [ ] 7.2 Deploy to Cloud Run (`topic-explorer-509403`, `us-central1`); grant the runtime service account the Vertex AI User role; verify the live URL runs the full flow
