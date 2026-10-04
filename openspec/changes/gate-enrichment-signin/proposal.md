# Proposal

## Why

The four enrichment features just shipped (`richer-boxes` + `paper-diagrams`) each cost money per use —
**rephrase** and **ask** are model calls, **figures** is a model call plus PDF rendering, and even the
**abstract** is an extra fetch/box. Leaving them open to guests means unbounded spend on unauthenticated
traffic. They should be **signed-in perks**: a guest still gets the core try-it experience (What/Why/How +
term expansion), and signing in unlocks the richer tools.

Decisions locked with the user: **hide these features entirely for guests** (no teaser prompt), and
**enforce the gate on the backend**, not just in the UI (a guest must not be able to call the costly
endpoints directly).

## What Changes

- **Guests no longer see** the Abstract button, the Figures button, the complexity control, or the Ask
  affordance anywhere in the graph. (Custom questions were already signed-in.)
- **The backend refuses** `/api/abstract`, `/api/rephrase`, `/api/figures`, and `/api/figimg` for guests
  (401), alongside the already-gated `/api/ask`. The paper's abstract is **withheld from guests on the
  extract stream** (still cached for signed-in users). `/api/define` and `/api/extract` stay open — the
  core experience is unchanged for guests.

## Capabilities

### Modified Capabilities

- `topic-graph`: the abstract box, complexity control, custom-question Ask, and figure gallery are shown
  **only to signed-in users**; guests see none of them.
- `content-extraction`: the enrichment endpoints (abstract, rephrase, figures/figimg, ask) require an
  authenticated account; the verbatim abstract is not sent to guests.

## Non-Goals

- Per-user rate/cost caps for signed-in users (still an M6 concern).
- A sign-in teaser/upsell on the hidden controls (we chose to hide, not tease).
- Changing the guest 5-paper cap or the core What/Why/How + term-expansion experience.

## Impact

- **Frontend:** `BoxTools` renders nothing for guests (hides complexity + Ask on every box); `WhatNode`
  hides the Abstract and Figures buttons for guests.
- **Backend:** `_require_account` added to `/api/abstract`, `/api/rephrase`, `/api/figures`, `/api/figimg`;
  `_strip_abstract_for_guest` removes the abstract from the What payload for guests (cache still stores it).
