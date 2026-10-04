# Tasks

## 1. Backend — figure extraction (paper-media)
- [x] 1.1 `gemini.py`: `locate_figures(pdf)` → `[{number, caption, page, bbox}]` (structured output, top-left-origin bbox)
- [x] 1.2 `figures.py` with pypdfium2 + Pillow: render each figure's page (~144dpi) and crop to `bbox` → PNG (≤1100px); full-page fallback on bad/missing bbox; runs via `asyncio.to_thread`
- [x] 1.3 Cache in Postgres: new `paper_figures` table (one JSONB row/paper, inline base64 PNGs); row existence = extracted (empty list included)
- [x] 1.4 No new infra/secret (Postgres reused); pypdfium2 + Pillow added to `pyproject.toml`

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
- [ ] 5.2 In-browser e2e: open Figures on a figure-rich paper → real images with captions, page back/forth; re-open is instant (cached); empty-state paper
- [ ] 5.3 Merge to main; deploy to Cloud Run; verify live
