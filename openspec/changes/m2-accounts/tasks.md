# Tasks

## 1. Prerequisites & infra

- [ ] 1.1 Provision a small Cloud SQL Postgres instance (project `topic-explorer-509403`, region `us-central1`); create a database + user; capture connection details
- [ ] 1.2 Obtain a Google OAuth **Client ID** (Web) for GIS; add authorized JS origins (localhost:5173, Cloud Run URL, topic-explorer.mazanin.com)
- [ ] 1.3 Generate `SESSION_SECRET`; add `DATABASE_URL`, `SESSION_SECRET`, `GOOGLE_CLIENT_ID` to `backend/.env.example` and `frontend` (`VITE_GOOGLE_CLIENT_ID`); ensure secrets are git-ignored

## 2. Database layer

- [ ] 2.1 Add SQLAlchemy 2.0 async + asyncpg; a session/engine module reading `DATABASE_URL`; verify a connection + a health query
- [ ] 2.2 Define models: `users`, `topics`, `familiar_terms`, `paper_analysis`; create tables on startup; verify tables exist

## 3. Accounts (auth)

- [ ] 3.1 Session cookie helper (signed JWT with user id, httpOnly); a `current_user` dependency that resolves the cookie or creates a guest user + sets the cookie; verify a guest is created on first request
- [ ] 3.2 `POST /api/auth/google`: verify the Google ID token (audience = client id), upsert user by `google_sub`, swap the session to that account; verify with a real token end-to-end
- [ ] 3.3 `GET /api/auth/me` (guest vs account) and `POST /api/auth/logout` (back to guest); verify both

## 4. Persistent analysis cache

- [ ] 4.1 On `/api/extract`, look up `paper_analysis` by arXiv id: hit → stream stored What/Why/How; miss → run Gemini, store, stream; remove the in-memory cache. Verify a second request makes no model call

## 5. Topics & familiar API (+ guest cap)

- [ ] 5.1 `GET /api/topics`, `GET/PUT /api/topics/{arxiv_id}` scoped to current user; verify save + reopen
- [ ] 5.2 `GET /api/familiar`, `POST /api/familiar`, `DELETE /api/familiar/{term}` scoped to current user; verify add/remove
- [ ] 5.3 Enforce the 5-paper guest cap in `/api/extract` (new paper + guest + 5 topics → error event); verify the block and that signed-in users are unlimited

## 6. Frontend: auth + server storage

- [ ] 6.1 Auth store: fetch `/api/auth/me` on load; a Google Identity Services sign-in button (`VITE_GOOGLE_CLIENT_ID`) that posts the credential to `/api/auth/google`; sign-out; show identity in the header
- [ ] 6.2 `ServerStore`: topics + familiar via the API; wire autosave (debounced `PUT`), restore (`GET /api/topics`), Topics + Familiar pages, and mark-familiar to the server
- [ ] 6.3 Handle the cap: on the extract `error` for the guest limit, show a sign-in prompt

## 7. Remove IndexedDB

- [ ] 7.1 Delete `idb`, `src/lib/db.ts`, and IndexedDB code paths; update tests; verify nothing references IndexedDB

## 8. Local end-to-end

- [ ] 8.1 With Postgres running locally, verify: guest explores + saves (server), hits 5-paper cap → prompted; sign in with Google → unlimited, data on the server; sign out; reopen topics; familiar terms; reused analysis makes no model call. No console/server errors
- [ ] 8.2 `pnpm test` (FE) + backend tests pass; `openspec validate m2-accounts --strict` passes

## 9. Deploy

- [ ] 9.1 Attach Cloud SQL to Cloud Run (`--add-cloudsql-instances`), grant the runtime SA `roles/cloudsql.client`, wire `DATABASE_URL`/`SESSION_SECRET`/`GOOGLE_CLIENT_ID` via Secret Manager; redeploy and verify the full flow live
