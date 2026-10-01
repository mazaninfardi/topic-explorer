# Tasks

## 1. Backend — box enrichment endpoints
- [x] 1.1 `arxiv.py`: `fetch_meta` returns the abstract (arXiv API `<summary>`) with the title; cached on `PaperAnalysis` (inside the `what` JSONB — no migration)
- [x] 1.2 Abstract rides along on the `what` SSE payload; `GET /api/abstract?arxiv=` fallback for restored graphs (cache, else fresh fetch)
- [x] 1.3 `gemini.py`: `rephrase(text, level, context?)` → `{text, terms}` (text-to-text at target level; terms verbatim)
- [x] 1.4 `POST /api/rephrase` wiring (open, like `/api/define`); validate `level ∈ {simpler,standard,technical}`
- [x] 1.5 `gemini.py`: `answer(question, box_text, paper?)` → `{text, terms}` grounded in box + paper
- [x] 1.6 `POST /api/ask` wiring — require an authenticated **non-guest** session; guests get a clear 401

## 2. Frontend — abstract box
- [x] 2.1 Add node kind `abstract` (types + deterministic id `abstract`); store `pending.abstract` + `openSpecial('abstract')`
- [x] 2.2 Abstract button on the paper root (styled like Why/How), shown only when the root is a paper
- [x] 2.3 `AbstractNode` component: verbatim read-only prose; `SelectionDefiner` works; no terms/complexity/Ask

## 3. Frontend — complexity levels
- [x] 3.1 `ComplexityControl` (Simpler ⇄ Standard ⇄ Technical) on generated boxes; default Standard
- [x] 3.2 Store `setComplexity(nodeId, level)`: call `/api/rephrase`, swap `{text, terms}` in place, **preserve edges/children**; spinner + failure-safe; regenerate from kept `baseText` so re-leveling never drifts, Standard restores instantly
- [x] 3.3 Persist `data.complexity` per node (rides the existing graph sync); exclude the abstract box

## 4. Frontend — custom questions (signed-in)
- [x] 4.1 Node kind `qa` (`{question, text, terms, complexity}`); deterministic id `qa:${parentId}:${slug(question)}`
- [x] 4.2 `AskBox` affordance on every generated box; for guests, route to sign-in instead of calling the API
- [x] 4.3 Store `askQuestion(parentId, question)`: call `/api/ask`, add `qa` child + edge (no-op on duplicate question per parent)
- [x] 4.4 `QaNode` rendering: question eyebrow + answer body; terms expand; carries its own complexity + Ask

## 5. Docs & specs
- [x] 5.1 `plan.md`: "Richer understanding" milestone (shared with `paper-diagrams`); cross-note the two M5 bullets this delivers
- [x] 5.2 `openspec validate richer-boxes --strict` passes

## 6. Verify
- [x] 6.1 Typecheck + lint + unit tests green (25 pass); light store tests (open abstract; setComplexity preserves children; duplicate question no-op; guest ask gated); production build OK
- [x] 6.2 In-browser e2e (user-verified locally): abstract on a paper; dial simpler→technical with children surviving; guest ask → sign-in prompt. Backend smoke: abstract verbatim, real Gemini rephrase, level→400, guest ask→401
- [ ] 6.3 Merge to main; deploy to Cloud Run; verify live
