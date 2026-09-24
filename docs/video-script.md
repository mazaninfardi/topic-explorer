# Topic Explorer — 5-minute video script

Slides: the **Topic Explorer** deck (open from `/artifacts`). Pace ≈ 140 wpm.
Rough budget: **Intro ~1:35 · Demo ~1:00 · Closing ~2:00**.

---

## 1. Intro narration (~1:35) — page the deck as you go

The deck explains the *problem*; the product only shows up on the last slide.
(~205 words. Slow down on the 7±2 line and the pauses stretch it toward 1:40.)

**[Slide 1 · The problem]**
Here's a problem we all hit: how do you go deep on a hard idea — a dense paper, a new field — without drowning in it?

**[Slide 2 · You don't need all of it]**
The truth is, you rarely need the *whole* thing. You want the gist first — then more, but only where it actually grips you.

**[Slide 3 · Five stages → three questions]**
Take a paper. Understanding it has five stages — context, background, the gap, the approach, the findings. But you don't consume them equally. They fold into three questions you ask in order — *What*, then *Why*, then *How* — and you stop when you've had enough. And any unfamiliar term expands on its own, as deep as you want.

**[Slide 4 · 7 ± 2]**
LLMs make each *piece* easy — summarize this, define that — but you still assemble it all in your own working memory. And that's tiny: in 1956, Miller showed we hold only about seven things at once, give or take two.

**[Slide 5 · Collapse it into one handle]**
That's the bottleneck. We can't scale our brains — so the trick is to go deep on something, understand it, then collapse it into one handle. "Neural network" becomes a single familiar word; its detail moves to long-term memory — off your desk, one click away.

**[Slide 6 · The principle → the tool]**
So the idea is simple: go deep only where you need to, collapse what you've learned, and keep what's active under that seven-plus-or-minus-two limit — without losing your place. That's the tool I built. Here's how it works.

---

## 2. Demo (~1:00) — suggested beats

Keep talking over it; don't narrate every click.

1. **Paste a paper** (arXiv mode) — e.g. `arxiv.org/abs/1512.03385`. The **What** appears first (streaming); Why/How arrive.
2. **Click a highlighted word** → a plain-language definition. Click a term *inside* that → it nests. "Depth on demand, recursively."
3. **Open Why and How** — "the same paper, only as deep as I want it."
4. **Mark a term "Got it"** → it collapses out of the map. "That's the short-term → long-term move — it's now a known word, off my desk."
5. **Note the map stays put** — expanding doesn't yank the view; collapse a branch to keep it under ~7 boxes.
6. *(Optional, ~5s)* **Topic mode** — type `diffusion models`; instant plain-language explainer, same expandable terms, no paper needed.

---

## 3. Closing — draft answers (edit freely)

**Why this theme and this approach**
I wanted to make hard research and complex topics approachable for curious non-experts and also for people with limited time on their hands. The non-obvious choice was *not* to build another chat-summarizer, but to render understanding as an explorable graph, and to anchor the whole design in a real cognitive constraint — working memory's 7±2 limit. The graph externalizes the mental model you'd otherwise juggle in your head, and keeps you in one place.

**What makes it interesting / non-obvious**
It's designed around a limitation of the *human brain*, not just around what the model can do. It lets you dive deeper only when you need to — and, importantly, it helps move concepts from short-term to long-term memory (that's the "known" mechanism, and it matters most in the later stages of learning). It keeps you in the same place and preserves context as you explore, instead of scattering you across chats and tabs.

**Key design decisions & tradeoffs**

*System & architecture — the ones I'd focus on. Lead with the ★ points; add others if time.*
- ★ **Feasibility first, commit late.** A **Pre-MVP** phase de-risked the two unknowns before I built anything real: *can the model actually extract clean What / Why / How?* — a throwaway Gemini spike on real papers — and *does the graph interaction even work?* — a fake-data skeleton with no backend. Only once both proved out did I build the MVP with real extraction, then layer on persistence, then accounts. Throughout, I reached for cheap stand-ins before committing — mock content, and **IndexedDB as prototype storage before a real SQL database** — so I could iterate on the idea fast before locking into a deployable architecture. (OpenSpec proposals, merge only at a working end-to-end demo, tests "sufficient, not exhaustive.")
- ★ **Stack chosen for the shape of the problem.** React + **React Flow** for the graph — it's purpose-built for node/edge canvases, so I'm not reinventing pan, zoom and layout — with **Zustand** as the single source of truth for the graph, and a **stateless FastAPI backend-for-frontend**. The **BFF is the one trusted server layer**: it keeps the model key server-side, owns all **database access (Postgres)**, and handles **auth — Google OAuth and sessions**. The client never talks to the model, the DB, or holds a secret; everything goes through the BFF, on one origin.
- ★ **One model, on purpose — Gemini 2.5 Flash on Vertex AI.** I deliberately did *not* build "support every model." I put the model behind a small provider interface so it *can* be swapped later, but abstracting to all providers now is speculative complexity I don't need — Flash is fast and cheap for what's essentially summarization, and Vertex + ADC means no API key to manage. Tradeoff: keep the seam, skip the cost.
- ★ **Auth added later, not upfront.** The app ran anonymous through the early milestones; I added Google OAuth only at M2, when it earned its place — binding your explorations to an account across devices. Auth is real work (redirect flow, sessions, secrets), so I didn't pay for it before there was a payoff.
- **Clean migration, not tech debt.** When accounts arrived, the prototype's IndexedDB store was replaced by **Postgres on Cloud SQL** and ripped out entirely — not left bolted on.
- **One deployable unit.** A single **Cloud Run** container serves the built frontend *and* the API — one origin, no CORS, one pipeline; Cloud SQL over the Python Connector, secrets in Secret Manager.
- **Fast-then-deep, and never twice.** What-first streaming over **SSE** so the gist shows in seconds (an extra model call, worth it), plus a **shared analysis cache keyed by arXiv id** — any paper is analyzed once, ever, across all users.

*Product decisions — defer to these only if there's time.*
- **A graph, not a chat** — externalizes context and keeps the thread.
- **The viewport never steals your place** — I dropped auto-refit so expanding never loses your spot.
- **Two input modes** — a paper gets What/Why/How; a plain topic gets a generic definition with no Why/How.
- **Guests try it with a small free cap**, sign-in to save.

**How I'd extend it with more time**
On the *system* side, the provider seam means slotting in Claude or GPT — or routing cheap vs. capable models per task — is a small step, and there's room for response caching and shared topic graphs as usage grows. On the *product* side, the next milestones: go deeper on a term on demand; self-test recall on the terms you've marked known; pull in more sources — web, PDFs, non-arXiv — and a short explainer video per concept; search across your own explored topics; and generate a study slide-deck from a graph. Plus mobile, accessibility, and an honest "AI-generated — verify in the paper" layer. And I'm open to more ideas.

**Approximately how long I spent**
About **2–3 hours** to build a working prototype, and roughly **another hour** polishing it — making features discoverable and genuinely usable.
