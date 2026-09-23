# Tasks

## 1. Routing

- [x] 1.1 Add `react-router-dom`; wrap the app in a router with `/`, `/topics`, `/terms/familiar` and a small nav; verify each route renders

## 2. IndexedDB layer

- [x] 2.1 Add an `idb`-based `db.ts`: database `topic-explorer` with `topics` and `familiarTerms` stores; CRUD helpers (upsertTopic, listTopics, getTopic, addFamiliar, removeFamiliar, listFamiliar), all try/catch-guarded; verify with a unit test round-trip (fake-indexeddb)

## 3. Persist & restore explorations

- [x] 3.1 Track `currentTopic` (arXiv id + title) in the store; derive the id client-side; set it when What arrives
- [x] 3.2 Autosave: subscribe to graph changes, debounce, upsert the current topic to IndexedDB; verify a topic record is written after exploring
- [x] 3.3 On app load, restore the most recently updated topic into the graph; verify the graph survives a reload

## 4. Topics view

- [x] 4.1 `/topics` lists saved topics (most recent first, with title/date); selecting one loads it into the explorer and navigates to `/`; verify reopen works

## 5. Expand/collapse

- [x] 5.1 Add `collapsed` set + `toggleCollapse(id)` to the store; recompute node `hidden` flags (descendants of collapsed) and relayout visible-only; unit-test the hidden-set computation
- [x] 5.2 Show a collapse/expand control only on nodes with children; verify collapse hides the subtree and expand restores it in the running app

## 6. Familiar terms

- [x] 6.1 Add `familiar` set in the store mirrored to IndexedDB; a toggle on salient-term nodes marks/unmarks a term; verify persistence
- [x] 6.2 `/terms/familiar` lists all familiar terms with unmark; verify add/remove reflects there

## 7. Verify

- [x] 7.1 End-to-end in-browser: explore → collapse/expand → mark familiar → reload (restored) → `/topics` reopen → `/terms/familiar` — no console errors
- [x] 7.2 `pnpm test` passes; `openspec validate m1-local-persistence --strict` passes
