# Design

## Context

M1 stored everything in IndexedDB (a prototyping stand-in). M2 replaces it with Postgres (Cloud SQL) as the single store, adds Google accounts + guest sessions, and adds a shared analysis cache. See `proposal.md`. Decisions locked with the user: optional sign-in with a 5-paper guest cap, Google Identity Services + BFF verification, Cloud SQL, fresh-on-sign-in (no guest→account migration), IndexedDB removed.

## Goals / Non-Goals

**Goals:** server-backed topics + familiar terms; Google sign-in; guest sessions with a 5-paper cap; persistent shared analysis cache; deployable on Cloud Run + Cloud SQL. Keep the BFF the only thing touching the DB and the model.

**Non-Goals:** guest→account data migration; roles/sharing; email/password auth; offline mode. Light tests only.

## Decisions

- **DB & ORM:** Cloud SQL for PostgreSQL, SQLAlchemy 2.0 **async** (`asyncpg`). Schema created on startup (`create_all`) for the prototype — Alembic later. Connection via `DATABASE_URL`; on Cloud Run the instance is attached and reached over the Cloud SQL unix socket, locally via the Cloud SQL Auth Proxy or a dev Postgres.
- **Tables:**
  - `users` (`id` uuid pk, `google_sub` unique null, `email` null, `name` null, `is_guest` bool, `created_at`).
  - `topics` (`id` uuid, `user_id` fk, `arxiv_id`, `title`, `graph` jsonb, `updated_at`, unique(`user_id`,`arxiv_id`)).
  - `familiar_terms` (`user_id` fk, `term`, `definition`, `added_at`, pk(`user_id`,`term`)).
  - `paper_analysis` (`arxiv_id` pk, `title`, `url`, `what` jsonb, `why` jsonb, `how` jsonb, `created_at`) — the shared cache.
- **Identity & sessions:** every request resolves to a `users` row. If no session cookie, create a **guest** user and set an httpOnly, signed session cookie (JWT, `SESSION_SECRET`) carrying the user id. `POST /api/auth/google` verifies the Google **ID token** (`google-auth`, audience = our client id), upserts a user by `google_sub`, and swaps the cookie to that account. `POST /api/auth/logout` drops back to a new guest. `GET /api/auth/me` reports guest vs account.
- **5-paper guest cap:** enforced in `/api/extract` — if the caller is a guest, the arXiv id isn't already one of their topics, and they already have 5 topics, the stream returns an `error` event asking them to sign in (so no wasted model call). `PUT /api/topics` re-checks as defense in depth.
- **Persistent analysis cache:** `/api/extract` looks up `paper_analysis` by arXiv id; hit → stream stored What/Why/How; miss → run Gemini, store, stream. Replaces the in-memory cache.
- **Topics/familiar API:** `GET /api/topics`, `GET/PUT /api/topics/{arxiv_id}`, `GET /api/familiar`, `POST /api/familiar`, `DELETE /api/familiar/{term}` — all scoped to the current user.
- **Frontend:** delete `idb` + `db.ts`; a `ServerStore` (fetch) replaces it behind the persistence layer. Add an auth store (`/api/auth/me` on load), a Google Identity Services sign-in button (`VITE_GOOGLE_CLIENT_ID`), and a sign-in prompt when the cap is hit. Autosave `PUT`s the topic (debounced); restore does `GET /api/topics`.
- **Deploy:** provision a small Cloud SQL Postgres instance; attach it to the Cloud Run service; runtime SA gets `roles/cloudsql.client`; `DATABASE_URL`, `SESSION_SECRET`, `GOOGLE_CLIENT_ID` via env/Secret Manager.

## Risks / Trade-offs

- **Cloud SQL cost/latency** → smallest tier; the analysis cache keeps model calls (the expensive part) down.
- **Guest cap is per-cookie** → clearing cookies resets it; acceptable as a soft gate.
- **create_all vs migrations** → fine for a greenfield prototype; move to Alembic before real users.
- **Local dev needs Postgres** → use the Cloud SQL Auth Proxy (same instance) or a local Postgres via Docker.

## Prerequisites (user / infra)

- A Google OAuth **Client ID** (Web) for GIS, with authorized JS origins for `http://localhost:5173`, the Cloud Run URL, and `topic-explorer.mazanin.com`.
- A Cloud SQL Postgres instance (provisioned during implementation) and its connection string / secret.
- `SESSION_SECRET` generated and stored.

## Open Questions

- Whether to also cache term definitions server-side (cheap; deferred).
- One-tap vs a rendered Google button — pick during implementation (UX only).
