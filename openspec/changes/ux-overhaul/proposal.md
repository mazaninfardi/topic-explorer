# Proposal

## Why

A lead-designer UX review (`UX-concerns.md`) found the product speaks like a tool built *by* experts *for*
experts — the opposite of its mission (make hard science accessible to curious non-experts). Three issues
hurt the core value most: (1) the graph **fights the user** — every term expansion refits the viewport and
the reader loses their place; (2) the **first 90 seconds are hostile** — the name overpromises, the copy
uses the jargon we exist to remove ("salient terms"), the empty canvas teaches nothing, and the first
action is a long blocking wait with almost no feedback; (3) the **visual/interaction language is
unsystematic** — button colors don't match the nodes they open, control icons imply the wrong action, and
micro-targets are sub-legible. This change fixes those, plus a batch of smaller rough edges, and delivers
the "1 — topics" positioning decision.

Decisions locked with the user: **grow toward topics** (accept a topic/question, not only an arXiv link);
**nail the interaction** before investing in brand/skin; defer **accessibility & keyboard** and a **trust
disclosure** to **M3**, and **mobile** to **M4**; skip a full brand identity for now.

## What Changes

- **Topics, not just links (§1.1):** the input accepts a free-text topic/question *or* an arXiv link. A
  topic is resolved to a paper via arXiv search (top relevant result), then explored as today. Copy and
  naming become accurate.
- **Viewport that respects the reader (§3.1, P0):** fit-to-view only on a topic's first render; on
  expansion, pan the new node into view at the user's current zoom; once the user manually pans/zooms,
  stop auto-fitting.
- **A guided, delightful start (§1.2–1.4, §2.1, §3.2):** de-jargoned copy ("highlighted words"), a
  pre-loaded **example graph** on first visit with a short, dismissible first-time walkthrough (FTUX) and
  a coach-mark on the first highlighted word, and a **playful, staged loading** experience instead of a
  bare 90-second wait (with a skeleton What card).
- **Clear feedback & recovery (§2.2, §2.3, §3.4):** unified loading vocabulary, human error copy with a
  next step, and a brief highlight on each newly created node so cause↔effect is obvious.
- **Orientation (§3.3):** minimap, a persistent current-paper label, and a discoverable "fit / reset
  view" control.
- **A coherent visual system (§4.1–4.4):** semantic color tokens; Why/How buttons colored to match the
  amber/violet nodes they open; definition nodes given real presence; term chips that don't clash with
  their host card.
- **Legible, honest controls (§5.1–5.6):** hide (✕) reframed as a clear collapse affordance; "+N"
  labeled; "I know this" → a **"Got it"** action that plainly hides the box; a **trailing** check on
  known terms; one unified vocabulary for the "known" concept; and enlarged tap targets.
- **A fair guest experience (§9.1–9.3):** a persistent "sign in to save" affordance with a remaining-count
  hint so the 5-paper cap is expected, a more present **Log in**, and a guard before a non-trivial graph
  is discarded by a re-explore.
- **Polish (§10.1–10.4):** differentiate structural vs. definition edges, gracefully handle very long
  definitions, consolidate the two control systems' mental model, and clarify why Why/How aren't offered
  on definitions.

## Capabilities

### New Capabilities
- `onboarding`: first-visit example graph, dismissible FTUX walkthrough, and the first-term coach-mark;
  a persistent guest "sign in to save (N papers left)" affordance.

### Modified Capabilities
- `topic-graph`: viewport/orientation behavior (fit-on-first-render, pan-to-new-node, respect manual
  camera, minimap, current-paper label), new-node highlight, plain-language term wording, coherent node
  color system, and clearer node controls.
- `content-extraction`: accept a **topic/question** input and resolve it to an arXiv paper via search
  (arXiv-link input unchanged); staged/streamed progress signalling.

## Non-Goals

- Accessibility, keyboard operation, focus management, and contrast-audit fixes (→ **M3**).
- A "this is AI-generated / verify in paper" trust model beyond what exists (→ **M3**).
- Mobile/responsive layout (→ **M4**).
- A full brand identity: typeface, logo, bespoke elevation system (deferred; substance before skin).
- Guest→account data migration; PDF/non-arXiv ingestion (still M3).

## Impact

- **Frontend:** new onboarding/FTUX + example-graph module; `PaperInput` accepts topics; `GraphCanvas`
  viewport logic reworked (fit-once, pan-to-node, minimap, reset control); loading experience component;
  node components restyled (color tokens, controls, chips, trailing check, "Got it"); guest affordance;
  re-explore guard; copy pass across all surfaces; "Familiar" renamed to the unified term.
- **Backend:** `/api/extract` (or a small resolver) accepts a topic query → arXiv search → paper id;
  `/api/auth/me` (or extract path) surfaces the guest's remaining count.
- **Docs:** `plan.md` milestones updated (a11y + trust → M3; mobile → M4).
