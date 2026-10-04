# Tasks

## 1. Backend — enforce the gate
- [x] 1.1 `_require_account` on `/api/abstract`, `/api/rephrase`, `/api/figures`, `/api/figimg` (ask already gated)
- [x] 1.2 `_strip_abstract_for_guest`: withhold the abstract from the What payload for guests (cache still stores it)

## 2. Frontend — hide for guests
- [x] 2.1 `BoxTools` returns null for guests (hides complexity + Ask on every box)
- [x] 2.2 `WhatNode` hides the Abstract and Figures buttons for guests

## 3. Verify
- [x] 3.1 Typecheck + lint + unit tests green (27 FE, 14 BE); `openspec validate gate-enrichment-signin --strict`
- [x] 3.2 Live gate verified as guest: /api/abstract, /api/figures, /api/figimg, /api/rephrase, /api/ask all 401; /api/define 200 (core stays open). UI hiding covered by the signedIn gate in BoxTools/WhatNode (signed-in in-browser check left to the user on prod)
- [x] 3.3 Merged to main; deployed to Cloud Run (revision topic-explorer-00012-mkb); verified live at topic-explorer.mazanin.com
