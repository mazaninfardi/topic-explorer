# Proposal

## Why

The MVP loses everything on refresh. M1 makes exploration persistent and rewarding for a returning (same-device) user — without accounts yet: save explored topics, let users collapse a sprawling graph, and let them mark terms they already know as "familiar" and review them. This is the last milestone before accounts/backend DB (M2).

## What Changes

- **Expand/collapse**: a node with children can collapse its subtree (hiding descendants) and expand it again.
- **IndexedDB persistence** (device-local, anonymous): the current exploration graph is saved and restored across reloads.
- **`/topics`**: browse previously explored topics and reopen one into the graph.
- **Mark "familiar"**: mark a salient term as familiar; familiar terms are stored.
- **`/terms/familiar`**: review all familiar terms.
- Introduce client-side **routing** (`/`, `/topics`, `/terms/familiar`).

Still anonymous — no accounts, no backend DB (those are M2).

## Capabilities

### New Capabilities
- `local-persistence`: device-local (IndexedDB) storage of explored topics and familiar terms, with routes to browse and reopen them.

### Modified Capabilities
- `topic-graph`: nodes with children can be collapsed and expanded (subtree hidden/shown), and the layout re-flows accordingly.

## Impact

- Frontend only: add `react-router-dom` + `idb`; new pages (`/topics`, `/terms/familiar`), an IndexedDB layer, autosave of the graph, and collapse UI on nodes.
- No backend changes. Data is per-device and not synced (M2).
