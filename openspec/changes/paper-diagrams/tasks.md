# Tasks

## 1. Backend — figure extraction (paper-media)
- [ ] 1.1 `gemini.py`: `locate_figures(pdf)` → `[{number, caption, page, bbox}]` (structured output)
- [ ] 1.2 Add PyMuPDF; render each figure's page and crop to `bbox` → PNG; full-page fallback on bad/missing bbox
- [ ] 1.3 Cache PNGs in a GCS bucket `figures/{arxivId}/{number}.png` + manifest (`number`, `caption`) on `PaperAnalysis`
- [ ] 1.4 Bucket name via config/secret (`.env` local / Secret Manager deployed)

## 2. Backend — serving
- [ ] 2.1 `GET /api/figures?arxivId=` → manifest `[{number, caption, imageUrl}]`; trigger extraction on cache miss, return when ready
- [ ] 2.2 Serve/proxy figure images through the backend (single-origin, no public bucket)
- [ ] 2.3 Empty result (no figures) returns a clean, explicit "no figures" signal

## 3. Frontend — gallery node
- [ ] 3.1 Node kind `figures` (deterministic id `figures`); `data = { items:[{imageUrl,caption,number}], current }`
- [ ] 3.2 Figures button on the paper root (styled like Why/How/Abstract), shown only when the root is a paper
- [ ] 3.3 Store `openFigures()` — lazy `/api/figures` call, build/update node; `setFigureIndex(i)` to page
- [ ] 3.4 `FiguresNode`: one figure + caption + position ("2 / 7") + prev/next (and ◀/▶ when focused); paging adds no nodes
- [ ] 3.5 Loading / empty / error states; respect long-content sizing

## 4. Docs & specs
- [ ] 4.1 `plan.md`: covered by the "Richer understanding" milestone; note it opens the media direction M5 extends
- [ ] 4.2 `openspec validate paper-diagrams --strict` passes

## 5. Verify
- [ ] 5.1 Typecheck + lint + unit tests green; light tests (openFigures builds node; setFigureIndex clamps/wraps; empty state)
- [ ] 5.2 In-browser e2e: open Figures on a figure-rich paper → real images with captions, page back/forth; re-open is instant (cached); empty-state paper
- [ ] 5.3 Provision bucket; merge to main; deploy to Cloud Run; verify live
