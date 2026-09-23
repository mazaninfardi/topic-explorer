# Design

## Context

Frontend-only, anonymous. Builds on the existing Zustand graph store and dagre layout (see `plan.md`). No backend changes. See `proposal.md` for scope.

## Goals / Non-Goals

**Goals:** persistence + reopen across reloads (device-local), collapse/expand, familiar terms, simple routing. Keep the graph store the single source of truth.

**Non-Goals:** accounts, cross-device sync, backend DB (M2). No migrations (data is disposable device-local). Light tests only.

## Decisions

- **Routing:** `react-router-dom` with `/` (explorer), `/topics`, `/terms/familiar`, plus a small nav.
- **Storage:** `idb` wrapper, database `topic-explorer`, two object stores:
  - `topics` (keyPath `id`): `{ id, title, updatedAt, graph }` where `graph` is the serialized store slice.
  - `familiarTerms` (keyPath `term`): `{ term, addedAt }`.
- **Serialization:** `Set`s (`expansions`, `specialsOpened`, `collapsed`) ↔ arrays; persist `nodes, edges, expansions, specialsOpened, pending, collapsed, currentTopic`.
- **Topic identity:** derive the arXiv id client-side (regex mirroring the backend) as the `topics` key; `title` = the first ~60 chars of the What text.
- **Autosave:** subscribe to the store; on graph change, debounce (~500ms) and upsert the current topic. On app load, restore the most recently updated topic.
- **Collapse:** add `collapsed: Set<id>` to the store. `toggleCollapse(id)` recomputes each node's `hidden` flag (a node is hidden if any ancestor is collapsed, via edge traversal) and relayouts. `layoutGraph` lays out only non-hidden nodes so there are no gaps.
- **Familiar terms:** keep a `familiar: Set<string>` in the store mirrored to the `familiarTerms` store; a toggle on salient-term nodes.

## Risks / Trade-offs

- **Autosave churn** → debounce writes; one record per topic (upsert), not per change.
- **IndexedDB unavailable / private mode** → wrap all IDB calls in try/catch; the app still works in-memory if storage fails.
- **Collapse + dagre interplay** → lay out visible-only; hidden nodes keep their last position (irrelevant while hidden).

## Open Questions

- Whether "familiar" should also apply to whole topics (spec covers terms; topics can follow later) — deferrable.
