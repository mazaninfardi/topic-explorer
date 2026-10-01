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

Naive "pull every embedded image" (`page.get_images()`) is noisy — it returns logos, math glyphs, and
split sub-images, and it loses the figure↔caption pairing. Instead:

1. **Localise with the model.** Gemini already receives the PDF for extraction; ask it (structured output)
   for the list of figures: `[{ number, caption, page, bbox }]`, where `bbox` is a normalised region on
   that page. The model is good at "where is Figure 3 and what does its caption say"; this gives us
   caption↔figure pairing for free.
2. **Render and crop with PyMuPDF.** For each figure, render its page at a readable DPI and crop to the
   `bbox` → a PNG. Rendering (not raw image extraction) sidesteps vector figures, multi-image composites,
   and odd encodings — what the reader sees is exactly what's on the page.
3. **Fallback.** If a `bbox` is missing or degenerate, serve the **full page image** for that figure (still
   useful, clearly captioned). If the model returns no figures, the gallery shows a clean empty state.

Trade-off: one extra model call per paper (only on first Figures open) plus render cost; accepted because
it is lazy and cached, and it is the only approach that reliably yields *captioned, real* figures.

### Serving & caching

- **Cache in GCS.** Cloud Run disk is ephemeral, so extracted PNGs live in a **GCS bucket** keyed
  `figures/{arxivId}/{number}.png`, with a small manifest (`number`, `caption`) cached on `PaperAnalysis`
  (or a sibling table). Re-opening a paper reads the manifest + objects — no re-extraction, no re-bill.
- **Endpoint.** `GET /api/figures?arxivId=` returns the manifest: `[{ number, caption, imageUrl }]`.
  `imageUrl` is served through the backend (proxying the GCS object, consistent with the single-origin,
  no-public-bucket posture) rather than a public bucket URL.
- **On-demand.** The endpoint triggers extraction on a cache miss and returns when ready; the frontend
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
- **New infra:** a GCS bucket + PyMuPDF dependency. Bucket name via config/secret (`.env` / Secret
  Manager), consistent with the secrets convention.
- **Copyright.** Figures are shown from the paper the user chose to explore, one at a time with
  attribution via caption/number; no redistribution beyond that reader's session/graph.

## Migration / Rollout

Additive: new `figures` node kind (older graphs simply lack it), new endpoint, new bucket. No data
migration. Requires PyMuPDF in the backend image and a bucket provisioned before deploy. Ships on one
Cloud Run deploy at the working e2e demo.
