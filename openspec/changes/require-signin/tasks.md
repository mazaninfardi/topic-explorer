# Tasks

## 1. Backend — require sign-in for core features
- [x] 1.1 `_require_account` on `/api/extract` and `/api/define` (guest → 401)
- [x] 1.2 Remove the guest trial: `_record_guest_paper`, the guest-limit gate in extract, `papers_left`/`guest_limit` in `_user_public`, and `_strip_abstract_for_guest`

## 2. Frontend — guests see the example only
- [x] 2.1 Store: guard `explore`/`exploreTopic` and the new-term branch of `expandTerm` for guests → set `signInPrompt`; add `promptSignIn`/`dismissSignIn`
- [x] 2.2 `PaperInput`: render a "Sign in to explore any paper or topic" CTA for guests
- [x] 2.3 `SignInPrompt` modal shown when a guest triggers a gated action
- [x] 2.4 `Onboarding`: always load the example for guests (even after the walkthrough is dismissed); reword the hint
- [x] 2.5 Remove `GuestBar`

## 3. Frontend — withdraw the Figures entry
- [x] 3.1 Remove the Figures button from `WhatNode` (backend/`openFigures`/`FiguresNode` left dormant for re-enable)

## 4. Verify
- [x] 4.1 Typecheck + lint + unit tests green (29 FE, 14 BE); build OK; new tests: guest explore → prompt, guest new-term → prompt, guest ask gated
- [x] 4.2 Live gate verified as guest: `/api/extract` 401, `/api/define` 401, `/api/auth/me` returns the slim guest shape (no `papers_left`), home + health 200. Guest example/CTA/no-Figures UI left to the user in-browser
- [x] 4.3 Merged to main; deployed to Cloud Run (revision topic-explorer-00014-ktd); live at topic-explorer.mazanin.com
