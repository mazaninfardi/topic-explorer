# Design

## Context

Let the reader see the paper's real figures inside the graph, in a gallery. The hard part is backend:
getting the **actual figure images** out of a PDF reliably, then serving and caching them. See
`proposal.md` for scope and the locked decision (real figures, gallery, on-demand, cached). Ships after
`richer-boxes`.

## Goals / Non-Goals

**Goals:** real figures (authors' images), paged one at a time with captions; extraction only when asked;
instant on repeat; stateless BFF preserved. **Non-Goals:** in-figure highlighting/OCR, non-arXiv figures,
tables/equations, cost caps (M6). Light tests only.

## Decisions

### Extraction: render the page, isolate the figure from the text

> Decisions locked with the user: render with **pypdfium2** (permissive Apache/BSD licence — safe in a
> deployed product) rather than PyMuPDF (AGPL); cache figures in **Postgres**, not a GCS bucket, so the
> prototype needs no new infra ("explore fast, commit late").

The model names each figure well but can't place it: its pixel bounding boxes are too imprecise (they clip
or over-include), and the PDF object model hides figures wrapped in Form XObjects. What *is* reliable is
the **caption's position in the text layer** and the **rendered pixels**. So:

1. **Locate captions with the model.** Gemini returns `[{ number, caption, page }]` — what it's good at.
   (It may also return a `bbox`; we ignore it.)
2. **Find the caption in the text layer.** Search the page's text for the caption's own words (pypdfium2
   text search) to get its exact rectangle — hence the figure's bottom edge and its column.
3. **Isolate the figure by erasing text.** Render the page (~144dpi), then white out every text-layer
   rectangle — body text, the caption, *and the figure's own labels*. The ink that remains is the drawn
   figure (works for vector diagrams, raster plots, and form-wrapped figures alike). Take the vertically
   contiguous ink cluster directly above the caption (a blank gap separates stacked figures / body text),
   find its tight extent, and crop the **original** render so labels stay visible. Downscale to ≤1100px.
4. **Fallback.** If the caption can't be found or no ink cluster sits above it, render the **full page**
   (still real and captioned). No figures from the model → clean empty state. The CPU-bound render/crop
   runs in a worker thread (`asyncio.to_thread`).

Trade-off: one model call per paper (only on first Figures open) plus render + a little numpy pixel work;
accepted because it is lazy, cached, and the only approach that reliably yields *tight, correct* figures
across every figure encoding. New dep: **numpy** (pixel masking). A **`FIGURES_VERSION`** stamped on each
cached row auto-invalidates old extractions when the algorithm changes.

### Serving & caching

- **Cache in Postgres.** A new `paper_figures` table (one row per paper) holds the ordered manifest with
  the base64 PNG bytes inline: `figures = [{ number, caption, b64, content_type }]`. A handful per paper
  (~1-2 MB) sits comfortably in one JSONB row. The **row's existence marks extraction done** — even an
  empty list — so a figureless paper isn't re-extracted (and re-billed) on every open. New table ⇒ created
  by `create_all`, so no migration (unlike adding a column).
- **Endpoints.** `GET /api/figures?arxiv=` returns the manifest `[{ number, caption, imageUrl }]` where
  `imageUrl` is a small backend URL, not inline bytes — so the persisted graph stays small.
  `GET /api/figimg?arxiv=&idx=` serves one figure's bytes (base64-decoded from the row) with a cache header.
- **On-demand.** `/api/figures` triggers extraction on a cache miss and returns when ready; the frontend
  shows a loading gallery meanwhile. (A later streaming/poll refinement is possible but out of scope.)

### Frontend: the gallery node

- **New node kind `figures`** (one per paper, deterministic id `figures`), opened from the **Figures**
  button on the paper root (shown only when the root is a paper, like Abstract). `data` holds an ordered
  `items: [{ imageUrl, caption, number }]` and a `current` index.
- **Gallery UI:** one figure at a time, its caption below, a position indicator ("2 / 7"), and
  **prev/next** controls that only change `current` — paging stays **within the one box**, adding no nodes
  (the explicit intent: back-and-forth inside a box). Keyboard ◀/▶ when focused.
- **States:** loading (extraction running), empty (no figures found), error (human retry). Image sizing
  respects the long-content handling already used for big definitions.
- **Store:** `openFigures()` lazily calls `/api/figures` (triggering extraction), builds/updates the
  `figures` node; `setFigureIndex(i)` pages. Persisted with the graph; `imageUrl`s are re-fetchable via the
  endpoint for a restored graph.

## Risks / Trade-offs

- **Localisation accuracy.** Model bbox/caption may be off; the full-page fallback bounds the worst case,
  and captions make a slightly-mis-cropped figure still usable. Revisit with a dedicated extractor
  (e.g. pdffigures2) only if quality demands it — deliberately avoided now (JVM/heavy).
- **Cost/latency of first open.** One model call + render; mitigated by lazy + cache. Per-user caps → M6.
- **DB growth.** Figure bytes live in Postgres (~1-2 MB/paper, shared across users via the cache). Fine at
  prototype scale; move to object storage if the table grows large (the serving seam makes that a swap).
- **New dependencies:** pypdfium2 + Pillow + numpy in the backend image (all permissive-licensed, no new
  infra). A `FIGURES_VERSION` on each cached row re-extracts when the algorithm changes.
- **Copyright.** Figures are shown from the paper the user chose to explore, one at a time with
  attribution via caption/number; no redistribution beyond that reader's session/graph.

## Migration / Rollout

Additive: new `figures` node kind (older graphs simply lack it), two new endpoints, and a new
`paper_figures` table created by `create_all` (no column migration). Requires pypdfium2 + Pillow in the
backend image. Ships on one Cloud Run deploy at the working e2e demo.
