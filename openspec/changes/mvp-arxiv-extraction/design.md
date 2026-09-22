# Design

## Context

Pre-MVP shipped a frontend-only skeleton with a `ContentSource` seam (`MockContentSource`) and a Zustand graph store. The MVP adds the real backend behind that same seam. See `proposal.md` (Why) and `spikes/FINDINGS.md` (validated extraction contract: Vertex AI, `gemini-2.5-flash`, inline PDF bytes, structured JSON, verbatim salient terms, 12–83s latency → What-first).

## Goals / Non-Goals

**Goals:**
- Real arXiv → What/Why/How graph, What-first, streamed, deployed to Cloud Run.
- Keep the BFF **stateless**; reuse the FE graph model unchanged (swap only the `ContentSource` implementation).
- Config/secrets via `.env`/`.env.local`; Vertex via ADC (no key in code).

**Non-Goals:**
- Accounts/persistence (M1/M2), expand/collapse (M1), PDF upload / non-arXiv (M3), server-side caching of extractions (post-MVP). No exhaustive tests (project stance).

## Decisions

- **FastAPI BFF, stateless, single Cloud Run service.** FastAPI serves the built React static assets *and* the API (no CORS, one URL, one deploy). Local dev runs Vite (5173) proxying `/api` to FastAPI (8000). _Alternative:_ two services — rejected (CORS + second pipeline).
- **Gemini via Vertex (`google-genai`, `vertexai=True`), PDF as inline bytes.** Model/project/location from env. _Alternative:_ AI Studio File API — rejected (chose Vertex; File API unavailable there). Large-PDF fallback to GCS URI is deferred (arXiv PDFs are small).
- **What-first via two calls over SSE.** `GET /api/extract?arxiv=<ref>` streams SSE events: `what` (content + terms) first, then `why`, then `how`. Call 1 → What; call 2 → Why/How. The PDF is fetched once per request and passed to both calls (2× input tokens, negligible at demo scale). _Alternative:_ single streamed JSON — rejected (fiddly partial-parse, weaker What-timing guarantee).
- **Structured output with verbatim-term constraint.** `response_schema` for `{ what/why/how, *_terms[] }`; prompt instructs terms to be substrings of their text. The BFF defensively drops any term not found verbatim before returning.
- **Term definitions are general-only.** `POST /api/define { term }` → `{ text, terms }`: a general, plain-language definition whose own salient terms are verbatim substrings. No paper context — keeps the BFF trivially stateless and each click cheap/fast.
- **FE: `BackendContentSource` + TanStack Query.** Replaces `MockContentSource` behind the `ContentSource` seam. `deriveWhat` becomes an SSE subscription that seeds the What node then streams Why/How; `defineTerm` is a `POST /api/define`. The store gains Why/How special-node actions and a per-node loading state.
- **arXiv fetch.** Normalize URL/ID → canonical PDF URL (`https://arxiv.org/pdf/<id>`), fetch with a descriptive User-Agent and a timeout. Reject non-arXiv input before any model call.
- **Config.** `backend/.env`(.local): `GCP_PROJECT`, `GCP_LOCATION`, `GEMINI_MODEL`. `frontend/.env`: `VITE_API_BASE` (dev only). Commit `.env.example`; `.env*` git-ignored.

## Risks / Trade-offs

- **Extraction latency (up to ~80s)** → What-first streaming + per-node loading states; consider a client timeout with a retry affordance.
- **Model returns non-verbatim terms** → server-side filter to verbatim substrings; if none remain, the node simply has no expandable terms (still valid).
- **Vertex/ADC misconfig in Cloud Run** → Cloud Run runs as a service account with the Vertex AI User role (ADC on the instance); document setup, fail fast with a clear startup check.
- **Two calls double PDF input tokens** → accepted at demo scale; revisit with caching post-MVP.

## Migration Plan

- Branch `feat/mvp-arxiv-extraction`; merge to `main` at the working e2e demo, then tag `mvp`.
- First real deploy: build FE, build the container, deploy to Cloud Run in `topic-explorer-509403` / `us-central1`; grant the runtime service account Vertex AI access. No data migration.

## Open Questions

- Exact SSE event/error framing and client reconnect behavior — refine during implementation; does not change the capability contracts.
- Whether Why/How each need their own paper call or can share call 2's result — default: share call 2.
