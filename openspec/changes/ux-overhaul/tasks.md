# Tasks

## 1. Foundations (color system + copy)
- [x] 1.1 Define semantic color tokens (what/why/how/known/danger + neutrals + primary) in the Tailwind/CSS layer
- [x] 1.2 Global copy pass: "salient terms" → "highlighted words"; unify loading verbs; unify "known" vocabulary; canonical example paper everywhere (§1.2, §1.4, §2.2, §5.5)

## 2. Viewport & orientation (P0)
- [x] 2.1 Store: track `topicKey` (per exploration) and a `justAdded` set for new nodes
- [x] 2.2 GraphCanvas: fit-to-view only when `topicKey` changes; pan the new node into view (keep zoom) on expansion; never refit on expansion
- [x] 2.3 Suppress auto-fit once the user manually pans/zooms; add a visible "Fit view" control
- [x] 2.4 Brief highlight/ring on newly created nodes (§3.4)
- [x] 2.5 Enable MiniMap + a persistent current-paper title chip (§3.3)

## 3. Loading experience (§2.1)
- [x] 3.1 Skeleton What card + playful, honest, rotating stage lines driven off SSE milestones
- [x] 3.2 Compact spinner + unified "Reading…" button state

## 4. Nodes & controls
- [x] 4.1 Why/How buttons colored to match their nodes; definition node presence; chip style that doesn't clash (§4.1–4.4)
- [x] 4.2 Hide (✕) → clear collapse control w/ larger hit area; "+N" → eye + "Show N" (§5.1, §5.2, §5.6)
- [x] 4.3 "I know this" → "Got it" (plainly hides); trailing check on known chips; "Forget" to undo (§5.3, §5.4)
- [x] 4.4 Differentiate structural vs. definition edges; long-definition handling (§10.1, §10.2)

## 5. Topics input (§1.1)
- [x] 5.1 Backend: accept a topic query → arXiv search (top result) → paper id; arXiv-link path unchanged; human "no results" error
- [x] 5.2 Frontend: input copy accepts "a topic or an arXiv link"; keep resolved paper title visible

## 6. Onboarding & guest (§1.3, §3.2, §9)
- [x] 6.1 Baked example graph on first visit (zero-wait) rendered through the normal path
- [x] 6.2 Dismissible FTUX walkthrough + first-term coach-mark (persist dismissal in localStorage)
- [x] 6.3 Guest "Sign in to save — N of 5 left" affordance; more present Log in; surface remaining count from backend
- [x] 6.4 Re-explore guard when a non-trivial graph exists (§9.3)

## 7. Plan & specs
- [x] 7.1 Update `plan.md` milestones: a11y + trust → M3; mobile → new M4
- [x] 7.2 Rename "Familiar" nav/page → "Known" (§5.5); note Why/How scope on definitions (§10.4)

## 8. Verify
- [x] 8.1 Typecheck + lint + unit tests green; add/adjust light tests for new store logic (topicKey, topic-vs-link resolve)
- [x] 8.2 In-browser e2e: first-visit example + FTUX; topic search; expand without losing viewport; loading; guest affordance
- [ ] 8.3 Merge to main; deploy to Cloud Run; verify live
