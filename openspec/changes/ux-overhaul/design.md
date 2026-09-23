# Design

## Context

Implements the agreed items from `UX-concerns.md`. See `proposal.md` for scope and the locked decisions.
This is a frontend-heavy change; the only backend work is topic→paper resolution and surfacing the guest
remaining-count.

## Goals / Non-Goals

**Goals:** stop the viewport fighting the reader; make the first run teach + delight; ship a coherent
color/control system; accept topics; make the guest cap fair and legible. Keep changes incremental and the
BFF stateless.

**Non-Goals:** a11y/keyboard/contrast audit (M3), trust model (M3), mobile (M4), brand identity, guest→account
migration. Light tests only (project stance).

## Decisions

### Topic input → paper (§1.1)
- `PaperInput` sends the raw string. The backend decides: if it looks like an arXiv reference (existing
  `arxiv_id` regex matches), use it directly; otherwise treat it as a **topic query** and call the arXiv
  API `search_query=all:<q>&sortBy=relevance&max_results=1`, take the top entry's id, then proceed exactly
  as today. Extraction, caching, and the graph are unchanged downstream.
- Copy shifts from "Paste an arXiv link" to "Explore a topic or paste an arXiv link". Name stays **Topic
  Explorer** (now accurate).
- Failure (no results) returns a human message ("No paper found for that topic — try different words or
  paste an arXiv link.").

### Viewport behavior (§3.1, §3.3, §3.4) — the P0
Replace the current "fitView on every node-count change" with intent-aware camera:
- **Fit once per topic:** fit only when a topic is first rendered/loaded (a `topicKey` changes), not on
  every expansion.
- **Pan-to-new-node:** when an expansion adds nodes, after layout settles, if the new node isn't fully in
  view, smoothly pan (keep zoom) to reveal it; never refit the whole graph.
- **Respect the user's camera:** once the user manually pans/zooms (React Flow move events), suppress
  auto-fit for that topic; a visible "Fit view" control lets them opt back in.
- **New-node highlight:** newly created nodes get a brief ring/flash (CSS class dropped after ~1.2s) so
  the eye finds them.
- **Orientation:** enable React Flow `MiniMap`; show the current paper title in a persistent, unobtrusive
  chip; keep `Controls` (which includes fit) but make "fit" legible.

Implementation: the store tracks `topicKey` and a `justAdded` node-id set (with timestamps); `GraphCanvas`
owns the camera effect (compare previous vs. current `topicKey`; use `fitView` on change, else
`setCenter`/`fitBounds` on the new node if offscreen) and listens to `onMoveStart` (user-initiated) to set
a `userMovedCamera` flag.

### Loading experience (§2.1, §2.2)
- A dedicated loading state in the graph area: a **skeleton What card** plus a small playful animation and
  rotating, honest, lightly-funny status lines ("Diving into the deep end…", "Translating academese…",
  "Surfacing the big idea…"). Tone: friendly, not cutesy-annoying; lines are clearly labeled as progress.
- Drive stage text off real SSE milestones where possible (fetching → what arrived → why/how arriving);
  fall back to a timed rotation. No fake progress bars claiming false precision.
- Unify verbs: everything "working" uses the reading metaphor consistently; button shows a compact
  spinner + "Reading…".

### Color system (§4.1–4.4)
- Define semantic tokens (Tailwind v4 `@theme` or a small CSS-var layer): `--c-what` (sky), `--c-why`
  (amber), `--c-how` (violet), `--c-known` (emerald), `--c-danger` (red), plus neutrals. One brand hue for
  primary actions.
- Why/How buttons adopt their node's hue (amber/violet) so the control previews its result.
- Definition nodes get a defined accent + darker eyebrow (still calmer than What, but present).
- Term chips use a neutral/host-aware style so a chip inside an amber/violet card doesn't clash.

### Controls & known-vocabulary (§5.1–5.6, §9)
- **Hide:** replace the bare ✕ with an unmistakable collapse control (icon + accessible label, larger hit
  area); keep it reversible via the parent's restore.
- **Restore:** "+N" → an eye icon + "Show N".
- **Known:** unify on **"Known"** as the concept. Mark action = **"Got it"** (which, as today, marks the
  term known and hides the definition box — now stated plainly); marked state on a chip = the word with a
  **trailing** check ("residual functions ✓"); undo everywhere (chip + list page) = **"Forget"**. Nav
  item and page retitle from "Familiar" → "Known".
- **Tap targets:** every node control ≥ ~28px hit area.
- **Guest affordance:** a slim persistent bar/chip "Sign in to save your explorations — N of 5 papers
  left" for guests; a more present **Log in**.
- **Re-explore guard:** if a non-trivial graph exists (more than just the root, or unsaved for guests),
  confirm before Explore resets it.

### Onboarding (§1.3, §3.2)
- First visit (no signed-in topic to restore, guest, and not previously dismissed): load a **baked example
  graph** (ResNet — the canonical example everywhere) so the user can poke immediately with zero wait.
- A short, dismissible FTUX: 2–3 steps ("This is the What. Click a highlighted word to go deeper. Open Why
  / How for more."), plus a one-time coach-mark pointing at the first highlighted word.
- Dismissal persists in `localStorage`; "Explore" with the user's own input clears the example.

## Risks / Trade-offs
- **arXiv search quality:** top-1 result may not be the "best" paper for a vague topic. Acceptable for a
  prototype; the user can always paste a specific link. Keep the resolved title visible so mismatches are
  obvious.
- **Viewport heuristics** can feel wrong if too clever. Bias toward *doing less* — never move the camera
  after the user has taken control.
- **Baked example** must stay in sync with the real extraction shape; store it as a real `StoredGraph`
  snapshot so it renders through the same path.

## Migration / Rollout
No data migration. Ships as one Cloud Run deploy. Copy/label renames ("Familiar"→"Known") are display-only;
storage keys/API unchanged.
