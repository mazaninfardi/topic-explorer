# Proposal

## Why

The logged-out experience is no longer sustainable: every guest exploration is a paid model call (full
What/Why/How extraction, plus term definitions), with no account behind it. The guest **trial** (5 free
papers) hands unbounded cost to unauthenticated traffic. We're closing that: **signing in is required to
use the features**; a logged-out visitor sees **only a live example** of what the tool does, with a clear
invitation to sign in.

Separately, the **Figures** gallery is withdrawn from the UI for now — a reader who wants the figures can
open the full paper (the existing "read paper" PDF panel), so the extra surface isn't worth carrying yet.

Decisions locked with the user: **hide the features for guests** (the example is interactive only for its
pre-baked, zero-cost parts); **enforce on the backend**; **remove the guest trial entirely**; **remove the
Figures entry point** (backend left dormant for easy re-enable).

## What Changes

- **Core features require sign-in.** `/api/extract` and `/api/define` now require an authenticated account
  (joining the already-gated enrichment endpoints). A guest gets 401.
- **Guests see the example only.** The logged-out visitor always sees the baked example graph. Its Why/How
  and its pre-baked term boxes are interactive (no API, no cost); the input is replaced by a **"Sign in to
  explore any paper or topic"** call-to-action, and any gated action (explore, or defining a new term)
  raises a **sign-in prompt** instead of calling the model.
- **Guest trial removed.** No free-paper quota; the `papers_left` counter, the server-side trial gate, and
  the guest bar are gone.
- **Figures entry removed.** The Figures button no longer appears; the figures endpoints/code remain but
  are unreachable from the UI (re-enable later by restoring the button).

## Capabilities

### Modified Capabilities

- `content-extraction`: deriving What/Why/How and defining a term now require a signed-in account; the
  guest free-paper trial is removed.
- `onboarding`: a logged-out visitor sees the example graph only — interactive for its pre-baked content,
  with a sign-in CTA in place of the input and a sign-in prompt on any model-backed action.

## Non-Goals

- Changing the signed-in experience (unchanged, full features).
- Removing the figures backend (kept dormant), or deleting its OpenSpec change.
- Per-user rate/cost caps for signed-in users (still M6).

## Impact

- **Frontend:** `PaperInput` renders a sign-in CTA for guests; a `SignInPrompt` modal appears when a guest
  triggers a gated action; the store guards `explore`/`exploreTopic`/`expandTerm` (new term) for guests;
  `Onboarding` always loads the example for guests; `GuestBar` removed; the Figures button removed.
- **Backend:** `_require_account` on `/api/extract` and `/api/define`; the guest-trial logic
  (`_record_guest_paper`, `papers_left`, `_strip_abstract_for_guest`) removed.
