# Topic Explorer — Plan

> Living document. The frozen starting point is [`initial-proposal.md`](./initial-proposal.md) and [`initial-stack.md`](./initial-stack.md). This `plan.md` evolves; those two do not.

## tl;dr
A web app designed to make complex scientific research accessible to anyone with curiosity, regardless of their background.

## Vision
Meet the learner where they are and let curiosity drive depth. A user brings a topic (a paper, to start), and the app renders understanding as an explorable graph: a concise **What** first, then **Why** and **How** on demand, and any unfamiliar term expandable into its own simple explanation — recursively, as deep as the user wants to go.

---

## Core concept

### The M1–M5 lens on a paper
Papers roughly follow a five-move structure:

- **M1 — Context**: the broad problem and why it matters.
- **M2 — Background**: prior work and the foundational concepts a newcomer needs.
- **M3 — Gap**: what's unresolved or missing that motivates this paper.
- **M4 — Contribution / Approach**: what the paper actually does (method, idea, model).
- **M5 — Findings & Implications**: results and what they mean going forward.

### Mapping to how people learn
- **What** ← M1 + M5 — the headline: what this is and what it found.
- **Why** ← M2 + M3 — the motivation: prior context and the gap it fills.
- **How** ← M4 — the mechanism: what the authors did to achieve it.

A curious reader wants **What** first; if hooked, **Why**; if still hooked, **How**. The graph makes that progression physical.

### Node model
- **What node** (root, one per topic/paper): shows the What. Exposes two actions at the bottom: **Why** and **How**.
- **Why node** (special): explains motivation (M2 + M3). Contains salient terms.
- **How node** (special): explains the approach (M4). Contains salient terms.
- **Salient-term node**: a plain-language **What-only** definition of a term. May itself contain salient terms → more salient-term nodes. Salient-term nodes never have Why/How — depth continues only through "what does this mean?".

Edges connect parent → child. The result is one growing graph per topic, rooted at its What node.

### Extraction strategy (hybrid, What-first)
- **Eager, What-first**: on load, a quick first pass extracts **What** so the root node appears within a few seconds; **Why** and **How** are then produced and streamed in. This turns a 10–60s wait into a fast payoff followed by progressive fill-in.
- **Lazy**: salient-term definitions are generated only when a term is clicked.

### Salient-term definitions (hybrid)
Generated as a **plain-language general definition + one sentence on how *this paper* uses the term**. Keeps definitions beginner-friendly and broadly true, while grounding them enough to feel connected to the reading — the best trade-off for demo credibility at a small extra cost. The clicked term is sent with its immediate phrase (for disambiguation and the paper-usage line).

---

## Architecture & tech stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | React + Vite + Tailwind + **React Flow** | React Flow gives rich custom nodes (What node with Why/How buttons, salient-term boxes) and native expand/collapse. |
| FE state | **Zustand** (graph/UI) + **TanStack Query** (server) | Zustand pairs naturally with React Flow for graph/UI state; TanStack Query handles server calls, caching, and loading/error states. Lightweight. |
| Backend | **FastAPI** as a BFF | Thin backend-for-frontend orchestrating model calls and (later) persistence. |
| Model | **Gemini** (GCP), native PDF via **File API** | BE downloads the arXiv PDF, uploads it via the Gemini **File API**, and references it — no parsing layer; math/figures handled by the model; robust for larger PDFs and reuse across a paper's calls. Long context (~1M tokens) fits whole papers. Model access abstracted behind an interface to allow Claude/OpenAI later. |
| Ingestion | arXiv link → PDF → Gemini File API | MVP is arXiv-only. Non-arXiv / uploaded PDFs come at M3. |
| Response style | **Streaming (SSE)** | Full-PDF extraction is slow (10–60s); stream What → Why → How as each is ready so the What node appears fast. |
| Storage | **IndexedDB** (MVP/M1) → **Postgres + SQLAlchemy** (M2) | Client-side, zero-DB persistence to start; server DB when we add real accounts and cross-device data. Note: the FastAPI **server** exists from MVP (to hold the Gemini key); only the **database** waits until M2. |
| Auth | **Google OAuth** (M2) | Deferred to when it has real payoff — binding data to an account on the server DB. Before M2, the app is anonymous and data is device-local. GCP project + OAuth already scaffolded. |
| Protocol | **REST + SSE** | REST for request/response; SSE for the streaming extraction endpoint. gRPC/GraphQL deferred. |
| Deploy | **Cloud Run, single service** (from MVP) | One container: FastAPI serves the built React static assets *and* the API — no CORS, one URL, one pipeline. Deploy the stateless MVP early to de-risk the GCP path (secrets, build). DB + auth wiring added to the same pipeline at M2. |
| Repo | **Monorepo** — `frontend/` + `backend/` | One repo (this one), shared docs/specs at root, single pipeline. |
| Tooling | **uv** (Python) + **pnpm** (JS) | Fast, reproducible, modern lockfiles. |
| Secrets | **GCP Secret Manager** (deployed) / `.env` (local) | Gemini API key never ships to the client; injected into Cloud Run from Secret Manager. |

### Proposed repo layout
```
topic-explorer/
├── plan.md                # this file
├── initial-proposal.md    # frozen snapshot
├── initial-stack.md       # frozen snapshot
├── openspec/              # OpenSpec specs (added next)
├── frontend/              # React + Vite + Tailwind + React Flow
└── backend/               # FastAPI (BFF), model adapter, ingestion
```

### Data flow
1. FE sends an arXiv link to the BFF.
2. BFF resolves the PDF, uploads it via the Gemini **File API**, and runs extraction with **structured output** (JSON schema): **What first**, then **Why**/**How**.
3. BFF **streams** results back over SSE; FE renders the **What** node within seconds, then fills in **Why**/**How** as they arrive.
4. Clicking **Why**/**How** reveals the streamed-in content.
5. Clicking a **salient term** hits a separate REST endpoint returning a **general definition + one paper-usage line**; FE appends a salient-term node.
6. FE is the source of truth for the graph (nodes/edges in Zustand); the BFF is **stateless** per call. From M1 the graph is persisted to IndexedDB; from M2 it syncs to Postgres per account.

### Provisional API surface (REST + SSE)
- `POST /extract` (SSE) — body: arXiv URL → streams `what` first, then `why`, `how`, and `salientTerms[]`.
- `POST /define` — body: `{ term, phrase }` → `{ definition }` (general plain-language definition + one line on how the paper uses it).
- (M2) auth + topics/terms persistence endpoints.

---

## Milestones

Realistic target given available time is **~M1**; everything beyond is scoped so we can stop cleanly at any milestone. Each milestone is a shippable increment.

### Pre-MVP — functional skeleton, no model (e2e pre-demo)
Goal: prove the interaction and the look end-to-end with fake data.
- User pastes a plain paragraph.
- Take first + last sentences (stand-ins for M1 & M5), show as the **What** node.
- Highlight a few random words as salient terms.
- Clicking a salient term creates a **lorem ipsum** node linked to the What node, with more random words highlighted.
- Clicking a nested salient term spawns another lorem-ipsum node → nested definitions work.

**Acceptance:** the graph, node UI, clicking, and nesting all work with placeholder content.

> **Parallel spike (de-risk):** independently, feed 3–4 real arXiv PDFs to Gemini and eyeball extraction quality — can it reliably produce clean What/Why/How and genuinely useful salient terms as structured output? This validates the core premise *before* MVP builds on it. Throwaway code; findings feed the MVP extraction schema.

### MVP — fully functional single-session explorer
Everything in Pre-MVP, plus:
- Accept a real **arXiv link**.
- Fetch the PDF and extract via Gemini **What-first** (root node appears fast), then stream **Why / How**.
- Render **What**, with **Why** and **How** as buttons inside/around that node.
- Model identifies **salient terms** automatically.
- Clicking a salient term calls the model for a **general definition + one paper-usage line** and renders a salient-term node.
- **Deploy the stateless MVP to Cloud Run** (client-side IndexedDB, no DB) to de-risk the GCP path early and get a shareable URL.

**Acceptance:** paste an arXiv link → explore a real, model-generated What/Why/How graph with expandable terms, live on Cloud Run. No accounts, no persistence beyond the session.

### M1 — local persistence (still anonymous)
- Nodes become **expandable and collapsible**.
- Use **IndexedDB** as a temporary store for explorations.
- Persist explored topics in IndexedDB; browse them under **`/topics`**.
- Mark a topic/term as **"familiar"**; view all familiar terms under **`/terms/familiar`**.

**Acceptance:** a returning user (same device) finds their saved topics and familiar terms; graphs collapse/expand cleanly.

### M2 — accounts, real backend & cross-device data
- Add a **backend DB** (Postgres + SQLAlchemy) for user preferences (familiar terms) and topics.
- Enable **Google OAuth** — now meaningful: bind data to the account.
- Migrate the existing IndexedDB data model to server-side; extend the existing Cloud Run pipeline with DB + secrets + OAuth redirect URIs.

**Acceptance:** signed-in data survives across devices; app is live on Cloud Run behind Google OAuth.

### M3 — retention & richer input
- Let users **explain a familiar term** and get a **remembered-how-well score** shown back to them.
- **Omnisearch** to jump quickly to topics and terms.
- Support **PDF uploads and non-arXiv papers**.

**Acceptance:** users can self-test recall, search everything, and bring papers from anywhere.

### Beyond M3 (future)
Scalability and caching as usage grows (model-response caching, shared topic graphs, multi-model support via the model adapter). Out of scope for now.

---

## Cross-cutting decisions & notes
- **Model abstraction:** even though MVP is Gemini-only, calls go through a provider interface so Claude/OpenAI can slot in later.
- **Caching (from M1):** cache the extracted What/Why/How (and term definitions) in IndexedDB so reopening a topic is instant and doesn't re-bill the model.
- **Anonymous until M2:** Pre-MVP, MVP, and M1 run without accounts (data is device-local in IndexedDB); Google OAuth arrives in M2 when it unlocks cross-device data.
- **Server from MVP, DB from M2:** the FastAPI BFF runs from MVP (Gemini key must stay server-side); only the database is deferred to M2.

---

## Open questions (to resolve during OpenSpec / as we build)
- Exact JSON schema for the structured extraction output, and how many salient terms to surface per node (the Pre-MVP model spike should inform both).
- Rate/cost guardrails for the demo (per-session call caps, arXiv fetch etiquette).
- Graph layout/UX details: auto-layout vs. manual, collapse behavior for large graphs (full collapse lands at M1).
- M2 auth mechanism detail: Google Identity Services ID-token → BFF verification vs. full server-side OAuth flow.

## Next step
Finalized here → move to **OpenSpec** to formalize specs and begin implementation, starting at Pre-MVP.
