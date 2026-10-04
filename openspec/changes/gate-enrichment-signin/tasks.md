# Tasks

## 1. Backend — enforce the gate
- [x] 1.1 `_require_account` on `/api/abstract`, `/api/rephrase`, `/api/figures`, `/api/figimg` (ask already gated)
- [x] 1.2 `_strip_abstract_for_guest`: withhold the abstract from the What payload for guests (cache still stores it)

## 2. Frontend — hide for guests
- [x] 2.1 `BoxTools` returns null for guests (hides complexity + Ask on every box)
- [x] 2.2 `WhatNode` hides the Abstract and Figures buttons for guests

## 3. Verify
- [x] 3.1 Typecheck + lint + unit tests green (27 FE, 14 BE); `openspec validate gate-enrichment-signin --strict`
- [ ] 3.2 Live: guest sees no Abstract/Figures/complexity/Ask and the endpoints 401; signed-in sees and uses them
- [ ] 3.3 Merge to main; deploy to Cloud Run; verify live
