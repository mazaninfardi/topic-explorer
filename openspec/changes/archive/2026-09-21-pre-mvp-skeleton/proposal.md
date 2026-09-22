# Proposal

## Why

Before investing in real model integration, we need to prove the core interaction and look end-to-end: a curious reader pastes text, sees a concise "What" node, and explores salient terms into nested explanations. Building this skeleton first de-risks the UX and gives us a functional shell to slot real extraction into at MVP. In parallel, a throwaway spike validates that Gemini can actually produce good extractions before we commit the UI to that shape.

## What Changes

- Introduce the frontend shell: React + Vite + Tailwind + React Flow, with Zustand for graph/UI state.
- A user pastes a plain paragraph; the app derives a **What** node from the first and last sentences (stand-ins for M1 & M5) and renders it as the graph root.
- A few words in the What node are highlighted as **salient terms** (chosen heuristically/at random for now — no model).
- Clicking a salient term creates a new **salient-term node** with placeholder ("lorem ipsum") definition content, connected by an edge to its parent, with its own highlighted terms.
- Clicking a nested salient term spawns another placeholder node, proving **recursive nesting** works.
- All content is mocked; there is no backend, no model, no persistence beyond the live session.
- **Parallel de-risking spike** (throwaway, not shipped): feed 3–4 real arXiv PDFs to Gemini and evaluate extraction quality (What/Why/How + salient terms) to inform the MVP extraction schema. Treated as go/no-go on the premise.

## Capabilities

### New Capabilities
- `topic-graph`: the interactive node/edge graph — a root What node, click-to-expand salient terms into connected child nodes, and recursive nesting. Owns rendering and interaction, independent of where node content comes from.
- `content-extraction`: producing node content from input. At Pre-MVP this is fully mocked (What from first/last sentence, salient terms chosen heuristically, placeholder definitions); it evolves to real Gemini extraction at MVP.

### Modified Capabilities
<!-- None — greenfield. -->

## Impact

- New `frontend/` app (React + Vite + Tailwind + React Flow + Zustand); no `backend/` yet.
- No external services, no API keys, no persistence at this stage.
- Establishes the graph data shape (nodes/edges, node types) that later milestones build on.
- Separate throwaway spike code (kept out of the shipped app) to validate Gemini extraction quality.
