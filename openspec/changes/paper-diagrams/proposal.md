# Proposal

## Why

Papers carry a lot of their meaning in **figures** — architectures, plots, schematics — and today the
reader can't see any of them without opening the PDF and losing the graph. The reader should be able to
ask for the paper's diagrams and flip through them **inside the exploration**, in the authors' own images,
with each figure's caption. This is the heavier of the two "next" changes (it needs real figure extraction
from the PDF), so per the locked decision it ships **after** `richer-boxes`.

Decision locked with the user: show the **real figures extracted from the PDF** (not model-drawn
re-creations and not just caption text), in a **gallery** the reader pages back and forth through within a
single box. Extraction is **on demand** ("if they ask for them"), because it is expensive, and **cached**
so a second visit is instant.

## What Changes

- **Figures action on the paper root.** A **Figures** action (styled like Why/How/Abstract) appears on a
  paper root. Topic (non-paper) roots do not show it.
- **On-demand extraction of real figures.** The first time Figures is opened for a paper, the system
  extracts the paper's figures — the actual images — from the PDF, each with its caption and figure
  number, and caches them. Subsequent opens are instant.
- **Gallery node.** Figures open into a single **gallery** node showing one figure at a time with its
  caption and a position indicator (e.g. "2 / 7"), and **previous / next** controls to move back and forth
  without adding more nodes. A clear loading state covers the extraction wait; an empty state covers papers
  with no detectable figures.

## Capabilities

### New Capabilities

- `paper-media`: on-demand extraction of a paper's **figures as real images** (with caption and number)
  from its PDF, cached and served to the client.

### Modified Capabilities

- `topic-graph`: a **Figures** action on paper roots and a **gallery** node that pages through the
  extracted figures (one at a time, prev/next, caption, position), with loading and empty states.

## Non-Goals

- Highlighting or defining content *inside* a figure image; OCR of figure text (future).
- Figures for non-arXiv / uploaded papers (depends on M3 ingestion).
- Tables and equations as media (figures only for now).
- Re-extraction tuning / cost caps beyond the on-demand + cache posture (M6).

## Impact

- **Frontend:** a Figures button on the paper root; a new `figures` (gallery) node kind holding an ordered
  list of `{imageUrl, caption, number}` plus a current index; prev/next + counter UI; loading and empty
  states; a store action to open figures (lazy-trigger extraction, then populate) and page the index.
- **Backend:** figure extraction from the PDF and a serving path. Approach: **model-assisted
  localisation** — Gemini (which already has the PDF) returns, per figure, `{page, bbox, caption,
  number}`; the backend renders that page region with **pypdfium2 + Pillow** (permissive licence) and
  crops it to a PNG; falls back to the full page image when a bbox is unreliable. Images are **cached in
  Postgres** — a new `paper_figures` table, one JSONB row per paper with inline base64 PNGs (no new
  infra). Exposed via `GET /api/figures?arxiv=` (manifest of number + caption + a backend image URL) and
  `GET /api/figimg?arxiv=&idx=` (the bytes). New Python deps: pypdfium2, Pillow.
- **Docs:** `plan.md` "Richer understanding" milestone covers this (shared with `richer-boxes`); it is the
  first media capability and opens the multi-modal direction M5 extends.
