# Design

## Context

Greenfield. This is the first vertical slice — a frontend-only shell that proves the exploration UX with mocked content. See `proposal.md` (Why) for motivation. No backend, model, or persistence exists yet; all node content is generated client-side. The design must leave clean seams so MVP can swap mocked content-extraction for a real backend without reworking the graph.

## Goals / Non-Goals

**Goals:**
- A working end-to-end demo: paste paragraph → What node → click terms → nested definition nodes.
- Establish the graph data model (node types, edges) and a `ContentSource` seam that MVP will implement against.
- Keep it deployable-shaped (a plain Vite SPA) even though deployment starts at MVP.

**Non-Goals:**
- No Why/How nodes (MVP), no expand/collapse (M1), no persistence (M1), no accounts (M2), no real model.
- No exhaustive test coverage — sufficient smoke/critical-path checks only (per project testing stance).

## Decisions

- **Frontend-only, mocked content behind an interface.** Define a `ContentSource` interface with `deriveWhat(paragraph)`, `salientTerms(text)`, and `defineTerm(term)`. Pre-MVP ships a `MockContentSource`; MVP adds a `BackendContentSource` hitting FastAPI. This is the seam that makes the skeleton throwaway-free. _Alternative:_ hardcode mock logic inline — rejected, would force a rewrite at MVP.
- **React Flow with custom node types.** `WhatNode` and `SalientTermNode` as custom node components; salient terms are clickable spans inside node bodies. _Alternative:_ force-directed lib — rejected earlier (poor fit for rich node content).
- **Zustand as the single graph store.** Holds `nodes`, `edges`, and expansion bookkeeping (which term→node expansions exist) to enforce no-duplicate expansion. _Alternative:_ React Flow internal state only — rejected, we want app-level control and a persistence seam for M1.
- **Sentence splitting is naive and local.** First/last sentence via a simple splitter; salient terms chosen by a trivial heuristic (e.g. longest non-stopword tokens) rather than randomly, so the demo looks intentional. Still explicitly mock-grade.
- **Extraction spike is separate and throwaway.** Lives outside `frontend/` (e.g. a `spikes/` script), never imported by the app. Its only output is a go/no-go note and learnings feeding the MVP extraction schema.

## Risks / Trade-offs

- **Mock looks too fake to be a convincing demo** → use the deterministic heuristic (not random) for term selection and readable placeholder text, so the interaction reads as intentional.
- **Graph model chosen now constrains later milestones** → keep node/edge shape minimal and explicit; validate it against the MVP What/Why/How + salient-term needs before finalizing.
- **Spike underestimates real extraction difficulty** → run it on the actual papers intended for the MVP demo, and treat a weak result as a real signal to adjust scope, not a formality.

## Migration Plan

- New branch per the branching convention; merge to `main` once the e2e demo works, then tag the Pre-MVP snapshot.
- No deploy, no data migration at this stage.

## Open Questions

- Exact node visual layout (auto-layout vs. simple placement) — deferrable; does not change the graph model or the `ContentSource` seam.
