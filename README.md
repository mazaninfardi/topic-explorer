# Topic Explorer

A web app that makes complex scientific research accessible to the curious,
regardless of background. Paste an **arXiv link** and explore the paper as a
graph: a concise **What** first, then **Why** and **How** on demand, with any
salient term expandable into a plain-language definition — recursively.

See [`plan.md`](./plan.md) for the full plan and milestones. The current build
is the **MVP** (real arXiv → Gemini extraction); Cloud Run deployment is still
pending, so for now it runs locally.

## Stack

- **Frontend:** React + Vite + Tailwind v4 + React Flow (Zustand store) — `frontend/`
- **Backend:** FastAPI BFF (stateless) — `backend/`
- **Model:** Gemini `gemini-2.5-flash` via **Vertex AI** (auth via ADC — no API key)

## Prerequisites

- **Node** 25 + **pnpm** 10 (`corepack enable` or install pnpm directly)
- **uv** (Python package manager) — https://astral.sh/uv (after installing, open a **new terminal** so `uv` is on your `PATH`)
- **gcloud** with Application Default Credentials for Vertex AI:

  ```bash
  gcloud auth application-default login
  gcloud auth application-default set-quota-project topic-explorer-509403
  gcloud services enable aiplatform.googleapis.com --project topic-explorer-509403
  ```

  GCP project `topic-explorer-509403`, region `us-central1` (defaults; override
  via `backend/.env`).

## Run locally

Two processes. **Backend** (port 8000):

```bash
cd backend
cp .env.example .env   # optional; defaults work
uv run uvicorn app.main:app --reload --port 8000
```

**Frontend** (port 5173, proxies `/api` → :8000):

```bash
cd frontend
pnpm install
pnpm dev
```

Open http://localhost:5173, paste an arXiv link (e.g.
`https://arxiv.org/abs/1512.03385`), and click **Explore**. Extraction can take
up to ~90s; the **What** node appears first, then **Why**/**How** stream in.

## Tests

```bash
cd frontend && pnpm test        # Vitest
cd backend  && uv run pytest    # pytest
```

## Layout

```
frontend/   React app (graph UI, ContentSource seam)
backend/    FastAPI BFF (arXiv ingestion, Gemini/Vertex extraction)
spikes/     Throwaway experiments (see spikes/FINDINGS.md)
openspec/   Specs and change proposals
plan.md     Living plan and milestones
```
