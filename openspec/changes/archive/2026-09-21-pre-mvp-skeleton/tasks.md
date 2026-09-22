# Tasks

## 1. Scaffold frontend

- [x] 1.1 Create `frontend/` with Vite + React + TypeScript via pnpm; verify `pnpm dev` serves a blank app locally
- [x] 1.2 Add and configure Tailwind; verify a Tailwind utility class visibly styles an element
- [x] 1.3 Add React Flow and Zustand; verify the app renders an empty React Flow canvas without console errors

## 2. Graph store and model

- [x] 2.1 Define the graph data model (node types: `what`, `salient-term`; edge shape; expansion bookkeeping) in a Zustand store; verify types compile and a unit test can add/read a node
- [x] 2.2 Implement `addChildNode(parentId, term, content)` enforcing no-duplicate expansion per (parent, term); verify a test that a repeat expansion is a no-op

## 3. ContentSource seam (mocked)

- [x] 3.1 Define the `ContentSource` interface (`deriveWhat`, `salientTerms`, `defineTerm`); verify it compiles and is the only content entry point used by the UI
- [x] 3.2 Implement `MockContentSource`: first/last-sentence What, deterministic heuristic salient-term selection, placeholder ("lorem ipsum") definitions containing their own salient terms; verify unit tests for sentence extraction and term selection
- [x] 3.3 Handle too-short input (cannot derive first/last sentence) with a clear user-facing message; verify the error path via a test

## 4. Node UI and interaction

- [x] 4.1 Build `WhatNode` custom node rendering What content with clickable salient-term spans; verify it renders given mock content
- [x] 4.2 Build `SalientTermNode` custom node (no Why/How) with its own clickable terms; verify it renders and exposes no Why/How action
- [x] 4.3 Wire term click → store `addChildNode` → new node + connecting edge appears; verify by clicking a term in the running app (required `nodrag`/`nopan` on term buttons so React Flow doesn't swallow the click as a drag)
- [x] 4.4 Wire nested term clicks so expansion works to arbitrary depth; verify by expanding at least three levels deep in the running app

## 5. Input entry

- [x] 5.1 Add a paragraph input (textarea + submit) that seeds the root What node via `ContentSource`; verify submitting a paragraph renders the What node

## 6. End-to-end demo verification

- [x] 6.1 Run the full flow (paste paragraph → What node → expand terms → nested nodes) and confirm it works end-to-end with no console errors; capture a short screen recording as the Pre-MVP demo artifact (`docs/pre-mvp-demo.gif`)
- [x] 6.2 `openspec validate pre-mvp-skeleton --strict` passes

## 7. Extraction spike (throwaway, parallel) — DEFERRED

Deferred to a follow-up after the demo: needs a Gemini API key and a Python env (uv not yet installed). Does not block the Pre-MVP demo.

- [ ] 7.1 In `spikes/` (outside `frontend/`, never imported by the app), send 3–4 real arXiv PDFs to Gemini via the File API and capture What/Why/How + salient-term output; verify raw outputs are saved
- [ ] 7.2 Write a short go/no-go note assessing extraction quality and listing learnings that shape the MVP extraction schema; verify the note exists in the repo
