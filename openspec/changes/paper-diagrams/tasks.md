# Tasks

## 1. Backend — figure extraction (paper-media)
- [x] 1.1 `gemini.py`: `locate_figures(pdf)` → `[{number, caption, page}]` (structured output)
- [x] 1.2 `figures.py` with pypdfium2 + Pillow + numpy: find the caption in the text layer, render the page (~144dpi), white out all text (incl. the figure's labels), and crop the ink cluster above the caption → PNG (≤1100px); full-page fallback; runs via `asyncio.to_thread`. (Replaces the model-bbox crop, which was too imprecise — clipped/over-included figures.)
- [x] 1.3 Cache in Postgres: `paper_figures` table (one JSONB row/paper, inline base64 PNGs), wrapped `{v, items}` with `FIGURES_VERSION` so algorithm changes auto-re-extract; row existence = extracted (empty list included)
- [x] 1.4 No new infra/secret (Postgres reused); pypdfium2 + Pillow + numpy added to `pyproject.toml`

## 2. Backend — serving
- [x] 2.1 `GET /api/figures?arxiv=` → manifest `[{number, caption, imageUrl}]`; extract on cache miss, return when ready
- [x] 2.2 `GET /api/figimg?arxiv=&idx=` serves one figure's bytes through the backend (base64-decoded), cache header
- [x] 2.3 Empty result (no figures) returns a clean, explicit empty manifest (and is cached, so no re-extract)

## 3. Frontend — gallery node
- [x] 3.1 Node kind `figures` (deterministic id `figures`); `data = { items:[{imageUrl,caption,number}], current }`
- [x] 3.2 Figures button on the paper root (styled like Why/How/Abstract), shown only when the root is a paper
- [x] 3.3 Store `openFigures()` — lazy `/api/figures` call, build/update node; `setFigureIndex(i)` to page (wraps)
- [x] 3.4 `FiguresNode`: one figure + caption + position ("2 / 7") + prev/next; paging adds no nodes
- [x] 3.5 Loading / empty / error states; respect long-content sizing

## 4. Docs & specs
- [x] 4.1 `plan.md`: covered by the "Richer understanding" milestone; note it opens the media direction M5 extends
- [x] 4.2 `openspec validate paper-diagrams --strict` passes

## 5. Verify
- [x] 5.1 Typecheck + lint + unit tests green (27 pass); light tests (openFigures builds node; setFigureIndex wraps; topic root offers none); production build OK
- [x] 5.2 Pipeline verified live on arXiv 1512.03385: 7 figures with correct captions, cache hit ~56ms, bad input 400, out-of-range 404; crop fix confirmed figure-shaped via probe (277x135, 763x846 …). In-browser visual (signed-in) left to the user on prod
- [x] 5.3 Merged to main; deployed to Cloud Run (revision topic-explorer-00012-mkb, with gate-enrichment-signin); live at topic-explorer.mazanin.com
