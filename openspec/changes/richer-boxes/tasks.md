# Tasks

## 1. Backend — box enrichment endpoints
- [ ] 1.1 `arxiv.py`: fetch the abstract (arXiv API `<summary>`) alongside the title; cache it on `PaperAnalysis`
- [ ] 1.2 Emit an `abstract` event early on the `/api/extract` SSE stream; add `GET /api/abstract?arxivId=` fallback for restored graphs
- [ ] 1.3 `gemini.py`: `rephrase(text, level, context?)` → `{text, terms}` (text-to-text at target level; terms appear verbatim in text)
- [ ] 1.4 `POST /api/rephrase` wiring (open, like `/api/define`); validate `level ∈ {simpler,standard,technical}`
- [ ] 1.5 `gemini.py`: `answer(question, box_text, paper?)` → `{text, terms}` grounded in box + paper
- [ ] 1.6 `POST /api/ask` wiring — require an authenticated **non-guest** session; guests get a clear 401

## 2. Frontend — abstract box
- [ ] 2.1 Add node kind `abstract` (types + deterministic id `abstract`); store `pending.abstract` + `openSpecial('abstract')`
- [ ] 2.2 Abstract button on the paper root (styled like Why/How), shown only when the root is a paper
- [ ] 2.3 `AbstractNode` component: verbatim read-only prose; `SelectionDefiner` works; no terms/complexity/Ask

## 3. Frontend — complexity levels
- [ ] 3.1 `ComplexityControl` (Simpler ⇄ Standard ⇄ Technical) on generated boxes; default Standard
- [ ] 3.2 Store `setComplexity(nodeId, level)`: call `/api/rephrase`, swap `{text, terms}` in place, **preserve edges/children**; spinner + failure-safe
- [ ] 3.3 Persist `data.complexity` per node (rides the existing graph sync); exclude the abstract box

## 4. Frontend — custom questions (signed-in)
- [ ] 4.1 Node kind `qa` (`{question, text, terms, complexity}`); deterministic id `qa:${parentId}:${slug(question)}`
- [ ] 4.2 `AskBox` affordance on every generated box; for guests, route to sign-in instead of calling the API
- [ ] 4.3 Store `askQuestion(parentId, question)`: call `/api/ask`, add `qa` child + edge (no-op on duplicate question per parent)
- [ ] 4.4 `QaNode` rendering: question eyebrow + answer body; terms expand; carries its own complexity + Ask

## 5. Docs & specs
- [ ] 5.1 `plan.md`: "Richer understanding" milestone (shared with `paper-diagrams`); cross-note the two M5 bullets this delivers
- [ ] 5.2 `openspec validate richer-boxes --strict` passes

## 6. Verify
- [ ] 6.1 Typecheck + lint + unit tests green; light store tests (open abstract; setComplexity preserves children; duplicate question no-op; guest ask gated)
- [ ] 6.2 In-browser e2e: open abstract on a paper; dial What/How simpler→technical with children surviving; signed-in ask → Q&A child; guest ask → sign-in prompt
- [ ] 6.3 Merge to main; deploy to Cloud Run; verify live
