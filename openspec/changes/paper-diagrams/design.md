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

### Extraction: model-assisted localisation + render-and-crop

> Decisions locked with the user: render with **pypdfium2** (permissive Apache/BSD licence — safe in a
> deployed product) rather than PyMuPDF (AGPL); cache figures in **Postgres**, not a GCS bucket, so the
> prototype needs no new infra ("explore fast, commit late").

Naive "pull every embedded image" is noisy — it returns logos, math glyphs, and split sub-images, and it
loses the figure↔caption pairing. Instead:

1. **Localise with the model.** Gemini already receives the PDF for extraction; ask it (structured output)
   for the list of figures: `[{ number, caption, page, bbox }]`, where `bbox` is a normalised
   top-left-origin region on that page. The model is good at "where is Figure 3 and what does its caption
   say"; this gives us caption↔figure pairing for free.
2. **Render and crop with pypdfium2 + Pillow.** For each figure, render its page at ~144dpi and crop to the
   `bbox` → a PNG (downscaled to ≤1100px wide). Rendering (not raw image extraction) sidesteps vector
   figures, multi-image composites, and odd encodings — what the reader sees is exactly what's on the page.
3. **Fallback.** If a `bbox` is missing or implausibly small, render the **full page** for that figure
   (still useful, clearly captioned). If the model returns no figures, the gallery shows a clean empty
   state. CPU-bound render/crop runs in a worker thread (`asyncio.to_thread`) so the event loop isn't blocked.

Trade-off: one extra model call per paper (only on first Figures open) plus render cost; accepted because
it is lazy and cached, and it is the only approach that reliably yields *captioned, real* figures.

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
- **New dependency:** pypdfium2 + Pillow in the backend image (both permissive-licensed, no new infra).
- **Copyright.** Figures are shown from the paper the user chose to explore, one at a time with
  attribution via caption/number; no redistribution beyond that reader's session/graph.

## Migration / Rollout

Additive: new `figures` node kind (older graphs simply lack it), two new endpoints, and a new
`paper_figures` table created by `create_all` (no column migration). Requires pypdfium2 + Pillow in the
backend image. Ships on one Cloud Run deploy at the working e2e demo.
