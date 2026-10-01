# Design

## Context

Three features that all **enrich the box the reader is already looking at**. They share a backend contract
(`{text, terms}` for a box, the same shape extraction and `/api/define` already return) and a frontend
pattern (act on an existing node). See `proposal.md` for scope and the locked decisions. Sibling change
`paper-diagrams` adds figures; it is intentionally *not* here.

## Goals / Non-Goals

**Goals:** give the reader the authors' own words to anchor on; let them dial a box up/down in difficulty
without leaving it; let signed-in users ask a follow-up and keep the answer in the graph. Keep the BFF
stateless; reuse the Gemini seam and the `PaperAnalysis` cache; don't destroy a reader's existing
exploration.

**Non-Goals:** figures (sibling change), in-box threads, question history/search, non-arXiv abstracts,
new cost/caching machinery. Light tests only (project stance).

## Decisions

### A. Original-abstract box (papers only)

- **New node kind `abstract`.** Deterministic id `abstract` (one per paper, like `why`/`how`). Rendered
  like a special node (its own calm accent), but **read-only prose**: no auto-highlighted terms, no
  complexity control, no Ask. `SelectionDefiner` (select text → Define) still works, so a hard word in the
  abstract can still spawn a definition — the one way the abstract participates in the graph.
- **Source = arXiv, verbatim.** The abstract is paper metadata we already touch when resolving the PDF
  (arXiv API `<summary>`), so no model call. Backend path: extend `arxiv.py` to return the abstract
  alongside the title, cache it on `PaperAnalysis`, and **emit it early on the extract SSE stream** (an
  `abstract` event) so `openSpecial('abstract')` can build the node instantly — no round-trip. A small
  `GET /api/abstract?arxivId=` is the fallback for a graph restored from persistence where the stream is
  long gone.
- **Paper-only.** The Abstract button renders only when the root is a paper (has `paperUrl`); topic roots
  (`data.topic`) never show it — consistent with "topics have no Why/How/PDF."

### B. Complexity levels (discrete, in place)

- **Three levels:** `simpler` · `standard` · `technical`, default `standard` (today's output). A compact
  segmented/cycling control sits on every **generated** box: What, Why, How, salient-term, topic root, and
  (recursively) Q&A nodes. The abstract box is excluded.
- **One backend verb for all boxes — `POST /api/rephrase`.** Input `{ text, level, context? }` → output
  `{ text, terms }`. It is a *text-to-text* reformulation at the target reading level, **not** a
  re-extraction from the PDF, so it is one cheap model call that works uniformly for every box kind and
  needs no PDF. `context` (optional: the paper title / parent term) only sharpens phrasing. Crucially it
  re-emits **highlighted words that appear verbatim in the returned text**, same invariant as extraction,
  so the UI can keep highlighting.
- **In place, children preserved.** Setting a level calls `/api/rephrase`, then swaps the node's `text` +
  `terms` in the store **without touching its edges or already-expanded children**. Rationale: the reader
  built that sub-tree deliberately; a wording change must not wipe it. Terms that survive the rephrase stay
  clickable; terms that vanish keep whatever child they already spawned (edge remains). `sanitizeEdges()`
  at the reflow choke-point keeps the graph legal regardless.
- **Remembered per box.** The chosen level lives on the node (`data.complexity`) and is persisted with the
  graph (so a signed-in user's levels survive reload via the existing sync path). A tiny spinner on the
  box marks the regeneration; failure leaves the prior text intact with a human retry message.

### C. Custom questions → Q&A child node (signed-in)

- **New node kind `qa`.** `data = { question, text, terms, complexity }`. Rendered with the **question as
  an eyebrow/title** and the **answer as the body** (highlighted words + Define, exactly like a
  definition). A Q&A node is a first-class box: its terms expand into salient-term nodes, and it carries
  its own complexity control and Ask affordance (recursive questioning).
- **Deterministic id.** `qa:${parentId}:${slug(question)}` where `slug` reuses the `termKey` normalisation
  (lowercased, trimmed, truncated to a sane length). Collisions within the same parent (re-asking the same
  question) are a no-op, matching how duplicate term expansion already behaves. Edge: parent box → qa node.
- **Signed-in only.** `POST /api/ask` requires an authenticated **non-guest** session (reuses the JWT
  session cookie; guests — identified by the guest cookie — get `401`/a clear "sign in to ask"). The
  **AskBox** renders for everyone but, for a guest, submitting routes to the sign-in affordance instead of
  calling the API. Answers are persisted as part of the signed-in user's graph like any other node.
- **Grounding.** `/api/ask` answers *in the context of that box and the paper*, plain-language, returning
  `{text, terms}`. It may reuse the cached PDF bytes / `PaperAnalysis` for grounding; for a topic root
  (no paper) it answers from the box text alone.

### Shared backend shape

Both `/api/rephrase` and `/api/ask` return the extraction `{text, terms}` contract, so the frontend reuses
the exact rendering/highlighting path and the store's existing node-building helpers. `/api/ask` is the
only new **auth-gated** write; `/api/rephrase` and `/api/abstract` are open (same posture as `/api/define`).

## Risks / Trade-offs

- **Rephrase drops a term the reader was about to click.** Mitigated by preserving already-expanded
  children and by keeping `standard` as a one-click return. Accept: dialing complexity is explicitly a
  "reformulate this" action.
- **Q&A nodes can crowd the canvas** (the reason in-box threads were the other option). Mitigated by the
  existing collapse/"Show N" controls and pan-to-new-node viewport; revisit if it bites.
- **`/api/ask` cost is unbounded per signed-in user.** Acceptable for the prototype (signed-in only is
  itself the guardrail); per-user rate/cost caps are an M6 concern.
- **Abstract availability** depends on arXiv metadata; if missing, the Abstract button is simply not shown.

## Migration / Rollout

Additive. New node kinds (`abstract`, `qa`) extend the stored graph shape; older stored graphs lack them
and render unchanged (and gain the new controls on next interaction). New endpoints are additive; no data
migration. Ships behind one Cloud Run deploy once the e2e demo works (per the merge-at-demo convention).
