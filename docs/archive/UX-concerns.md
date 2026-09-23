# Topic Explorer — UX Design Review

**Reviewer stance:** lead product designer, reviewing as if this were a flagship consumer product.
**Target user (from the product brief):** a *curious non-expert* who wants to understand hard science.
That audience is the lens for every judgment below — the core question is repeatedly: *"Would a smart
person with no ML background feel oriented, in control, and confident here?"*

**Method:** walked every screen and state in the running app (explore → stream → graph → expand →
familiar/topics → auth), and read every component's copy, color, and layout. Findings are grounded in
the actual code and live behavior, not assumptions.

**Severity:** `P0` = breaks trust or blocks the core loop · `P1` = high friction, hurts the core value ·
`P2` = notable rough edge · `P3` = polish.
**Effort:** S (hours) · M (a day-ish) · L (multi-day / needs product decision).

---

## Executive summary

The interaction *concept* is strong and the build is clean. But the product currently speaks like a tool
built *by* an expert *for* experts, which is exactly backwards from its mission. The three things holding
it back most:

1. **The first 90 seconds are hostile to a newcomer.** The name overpromises, the copy uses the very
   jargon the product exists to remove ("salient terms"), the empty canvas teaches nothing, and the first
   action is a ~90s blocking wait with almost no feedback.
2. **The graph fights the user.** Every expansion auto-refits the viewport, so the user repeatedly *loses
   their place* the moment they go deeper — punishing the exact behavior the product is built to reward.
3. **The visual language is unsystematic.** Four+ node hues, controls whose icons imply the wrong action
   (✕ "delete" that only hides), sub-legible micro-targets, and a button-color scheme that doesn't match
   the nodes those buttons create. It reads as competent-but-generic, not considered.

None of these are hard to fix. Prioritized shortlist is at the bottom.

---

## 1. Positioning, naming & first-run

### 1.1 The name and the input contradict each other · `P1` · M *(product decision)*
Header says **"Topic Explorer"** and **"explore topics,"** but the only thing you can do is paste an
**arXiv link**. "Topic" sets an expectation ("explore *quantum computing*") the product doesn't meet.
Either (a) rename/reframe around papers ("Paper Explorer", "read any paper"), or (b) actually accept a
topic/question and fetch a paper for the user. This is a positioning decision for you — flagging, not
prescribing.

### 1.2 The tagline uses the jargon the product exists to kill · `P1` · S
> "Paste an arXiv link → explore What, Why, and How; click **salient terms** to go deeper"

"Salient terms" is exactly the kind of phrase our non-expert user won't parse. Use plain language:
"click any **highlighted word** to go deeper." Small change, but it's the thesis of the whole product —
we should model the plain-speaking we promise.

### 1.3 The empty canvas is a wasted first impression · `P1` · M
On load the user sees a dark bar, a prefilled input, and an **empty dotted grid with zoom controls**.
Nothing shows what this does or what the payoff looks like. A newcomer has no mental model before
committing to a 90s wait. Add a real empty state: a one-line promise, a 3-step "how it works" (Paste →
We break it into What/Why/How → Click highlighted words to go deeper), and ideally a *pre-baked example
graph* they can poke at instantly with zero wait. Let them feel the delight before they pay the latency.

### 1.4 Placeholder ≠ prefilled value · `P3` · S
Input is prefilled with `1512.03385` (ResNet) but the placeholder shows `1706.03762` (Transformers).
Pick one paper for the canonical example everywhere (header copy, prefill, placeholder, docs) so the
product feels authored, not assembled.

---

## 2. The core loop: latency & feedback

### 2.1 A ~90s blocking wait with near-zero feedback · `P0` · M
First run: press **Explore**, the button disables to "Extracting…", and a single gray line appears —
"Fetching and reading the paper… (can take up to ~90s)". Ninety seconds is an eternity with no progress,
no stages, no skeleton, no motion. This is the single biggest abandonment risk in the product.

Fixes, roughly in order of value:
- **Stage the wait.** You already stream (What first, then Why/How via SSE). Surface the stages:
  "Downloading PDF → Reading → Writing the plain-English summary." Even fake-but-honest stage labels
  dramatically reduce perceived wait.
- **Show a skeleton What card** in the graph immediately instead of leaving the canvas empty, so the
  user sees the shape of what's coming.
- Admitting "up to ~90s" in body text is honest but alarming as the *only* signal. Pair it with motion.

### 2.2 Inconsistent loading vocabulary · `P2` · S
Four different metaphors for "working": "Extracting…" (button), "Fetching and reading the paper…"
(status), "Reading the paper…" (What node), "Defining…" (term node). Unify the voice. Pick one metaphor
(reading) and conjugate it consistently.

### 2.3 Errors are raw and unstyled · `P1` · S
Backend error strings are piped straight to a red `<span>`. A non-expert who pastes a bad link gets a
developer message, not a recovery path. Wrap failures in human copy with a next step ("We couldn't read
that link. Make sure it's an arXiv paper URL like arxiv.org/abs/1706.03762."). The guest-limit message is
the one good example — match its tone everywhere.

---

## 3. The graph interaction (the heart of the product)

### 3.1 Auto-fit steals the user's viewport on every expansion · `P0` · M
`LayoutAndFit` calls `fitView` on every node-count change. So each time the user clicks a term to go
deeper — *the primary action* — the whole graph re-lays-out and the camera jumps to frame everything.
The user loses the box they were reading. I saw this live this session: after an expansion, the new
definition node landed **off the top of the screen**. This actively punishes exploration.
- Fit on *first render of a topic* only. On subsequent expansions, **pan just enough to bring the new
  node into view** (and keep the user's zoom), rather than refitting the world.
- Respect manual pan/zoom — once the user has moved the camera, stop auto-fitting entirely.

### 3.2 The deep-dive affordance isn't taught · `P1` · S
The entire product rests on the user noticing that dotted-underline sky chips are clickable. There's no
first-time coach mark, no "try clicking a highlighted word." Add a one-time hint anchored to the first
term chip on the first graph.

### 3.3 No orientation in a large graph · `P1` · M
Once the tree grows, there's no minimap (React Flow ships one — unused), no "fit all"/"collapse all"
affordance that's discoverable, and the paper title (only on the What node) can be scrolled off. Add the
minimap, a persistent current-paper label, and a visible "reset view" control. Give the user a way to see
where they are.

### 3.4 Expansion loses the reading thread · `P2` · M
Clicking a term spawns a *new box elsewhere* that the user must visually hunt for. Consider a subtle
highlight/flash on the newly created node, and/or auto-scroll-to-new-node (see 3.1) so cause and effect
are obvious.

---

## 4. Nodes & the visual system

### 4.1 Button colors don't match the nodes they create · `P1` · S
On the What card, **Why** and **How** buttons are both **sky** (`border-sky-300`, `text-sky-700`). But
the nodes they open are **amber** (Why) and **violet** (How). The control gives no preview of its result,
and the color coding is wasted. Color the Why button amber and the How button violet so the button *is*
a legend for the node.

### 4.2 Too many hues, no documented system · `P2` · M
Live palette: sky (What + primary buttons + term chips), amber (Why), violet (How), slate (Definition),
emerald (familiar), red (errors). Six semantic colors with no defined roles reads ad hoc. Define a small
token system (one brand hue, one "you-know-this" hue, one danger hue, neutrals) and map node types onto
it deliberately. A billion-dollar bar means the palette looks *chosen*, not accumulated.

### 4.3 Definitions — the payoff — are the most muted node · `P2` · S
Definition nodes are gray-on-slate-50 with a `text-slate-400` "DEFINITION" eyebrow (low contrast, likely
fails WCAG AA). The recursive definition *is* the core value; visually it's the quietest thing on screen.
Reconsider the hierarchy — at minimum fix the contrast.

### 4.4 Color clash: sky chips inside amber/violet cards · `P3` · S
Term chips are always sky, regardless of host node color, so a sky chip sits inside an amber Why card.
Either neutralize chip styling or tint it to the host. Minor, but it's the kind of detail that separates
"fine" from "crafted."

### 4.5 Generic, brand-less look · `P3` · L
Default system font, default Tailwind slate/sky, thin borders, light shadows, no logo/mark. Clean but
forgettable. If this is meant to feel premium, invest in a typeface, a mark, and a spacing/elevation
rhythm. (Explicitly low priority — substance before skin.)

---

## 5. Controls & microinteractions

### 5.1 "✕" implies delete but only hides · `P1` · S
The per-node **✕** looks like close/destroy; it actually *hides* the box (recoverable via the parent's
**+N**). The reversible nature lives only in a tooltip. Non-experts will read ✕ as destructive and
hesitate. Use a "collapse/hide" metaphor (an eye-off or chevron), or label it, so the action's
reversibility is legible without hovering.

### 5.2 "+N" is a mystery until hovered · `P2` · S
`+3` on a node means "3 hidden children — click to restore," but nothing on its face says so. Give it an
icon (eye) or a word ("Show 3"). Right now it reads like a counter, not a button.

### 5.3 "I know this" secretly hides the box · `P2` · S
"I know this" marks the term familiar *and removes the node* — the removal is only disclosed in a tooltip.
Users don't expect a labeling action to also make content disappear. Either separate the two actions, or
make the outcome explicit ("Got it — hide this").

### 5.4 The familiar "✓" badge is sub-legible · `P2` · S
An 8px emerald circle pinned to the corner of a term chip, overlapping the text. At that size it's noise,
not signal. Use a cleaner treatment (a leading check, a filled-vs-outline chip, a subtle color shift).

### 5.5 One concept, three words · `P2` · S
The "familiar" idea is labeled **"I know this"**, **"✓ known"**, and **"forget"** (on the Familiar page).
Pick one verb and one noun and use them everywhere.

### 5.6 Micro-targets below tap-target minimums · `P1` · S
✕, ✓, +N, and the familiar badge are all `text-xs` and unpadded — well under the ~24px (desktop) / 44px
(touch) minimum. Frustrating with a mouse, unusable on touch. Enlarge hit areas.

---

## 6. Accessibility

### 6.1 Contrast failures · `P1` · S
`text-slate-400` eyebrows and controls on white/slate-50 almost certainly fail WCAG AA (4.5:1). Audit and
darken. (Free win: it also improves the visual hierarchy noted in 4.3.)

### 6.2 The graph is effectively keyboard-inaccessible · `P2` · L
Nodes are draggable divs; term chips are focusable buttons (good) but focus order across a spatial graph
is unpredictable, and there's no keyboard path to pan/zoom/expand deliberately. The **Select-text →
"Define"** flow is mouse-only (no keyboard or touch equivalent). Full graph a11y is a real effort — worth
at least ensuring the primary click-to-expand path is keyboard-operable and focus is visible.

### 6.3 No visible focus styling on buttons · `P2` · S
Only the input defines a focus style. Add consistent focus rings so keyboard users can see where they are.

---

## 7. Responsive / mobile · `P1` · L *(product decision: is mobile in scope?)*
The header (title + tagline + nav + auth in one flex row) will overflow on a phone; the graph canvas
fights page scroll; 13px node text and tiny chips are hard to tap. The product is likely **unusable on
mobile** today. Decide whether mobile is a target. If yes, it's a dedicated effort (responsive header,
touch-tuned targets, a mobile graph mode). If no, at least show a graceful "best on desktop" note.

---

## 8. Trust & credibility · `P1` · M
We're showing **AI-generated summaries of scientific papers to non-experts who can't easily verify them**
— the highest-stakes trust context there is. Today there's no "AI-generated, may contain errors" signal,
and individual claims aren't traceable to the source. There's a good **"full paper ↗"** link, but no
per-claim grounding. At minimum add a light, honest disclosure and make "verify in the paper" easy. Trust
*is* the product here.

---

## 9. Account & guest experience

### 9.1 Guests get no orientation and a surprise wall · `P2` · M
A guest can explore 5 papers, but nothing tells them they're a guest, that work won't be saved, or how
many explorations remain — the 5-paper cap arrives as an error out of nowhere. Add a gentle, persistent
"Sign in to save your explorations" affordance and, ideally, a remaining-count hint, so the limit is
expected, not a trap.

### 9.2 "Log in" is nearly invisible · `P2` · S
The guest CTA is low-contrast slate text in the corner. If sign-in (saving, history) is a goal, give it
more presence.

### 9.3 Re-exploring silently discards the current graph · `P3` · S
Pressing Explore (or editing the URL) resets the whole graph with no confirm. Signed-in users get it back
via autosave, but in-progress layout/expansions vanish. Consider a light guard when a non-trivial graph
exists.

---

## 10. Smaller notes
- **10.1 · P3** — Edges are default gray beziers; What→Why/How and term→definition look identical. Subtle
  differentiation (or light labels) would aid readability. Low priority.
- **10.2 · P3** — Long definitions fill a small box with no truncation/expand; deep graphs get text-heavy.
- **10.3 · P3** — Two control systems coexist (React Flow's zoom/fit/lock bottom-left vs. per-node
  ✕/+N). Consolidate the mental model.
- **10.4 · P3** — No indication that Why/How aren't offered on definition/special nodes; a user may look
  for them. Likely fine by design — noting the possible expectation gap.

---

## Prioritized shortlist (what I'd fix first)

| # | Fix | Sev | Effort | Why it's top |
|---|-----|-----|--------|--------------|
| 1 | Stop auto-fit stealing the viewport on expansion (§3.1) | P0 | M | Punishes the core action |
| 2 | Stage the 90s wait + skeleton What card (§2.1) | P0 | M | Biggest abandonment risk |
| 3 | De-jargon the copy: "salient terms" → "highlighted words"; unify loading/familiar vocabulary (§1.2, §2.2, §5.5) | P1 | S | Lives or dies on plain language |
| 4 | Teaching empty state + first-term coach mark (§1.3, §3.2) | P1 | M | Builds the mental model before the wait |
| 5 | Human error copy (§2.3) | P1 | S | Cheap trust win |
| 6 | Color buttons to match the nodes they open; fix contrast (§4.1, §4.3, §6.1) | P1 | S | Coherence + a11y in one pass |
| 7 | Fix control affordances: ✕/+N/"I know this"/badges + tap targets (§5.1–5.6) | P1 | S/M | Removes hesitation on every node |
| 8 | Trust disclosure + verify-in-paper (§8) | P1 | M | Non-negotiable for this audience |

---

## Open product decisions for you (need your call before we spec)
1. **Naming/scope (§1.1):** stay "papers only," or grow toward true "topics"? Changes positioning + copy.
2. **Mobile (§7):** in scope now, later, or explicitly desktop-only?
3. **Design ambition (§4.5):** ship a considered visual identity now, or keep utilitarian until the
   interaction is nailed? (I lean: nail interaction first — items 1–7 above — then invest in skin.)
4. **Trust model (§8):** how far do we go — a disclaimer, or real per-claim grounding to the source?

---

*Next step: once you've reacted (agree / push back / reprioritize), I'll turn the agreed items into an
OpenSpec change (`openspec/changes/…`) with proposal / design / tasks, and we implement from there.*
