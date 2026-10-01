# Proposal

## Why

The graph is good at going *wider* (expand a term → a new box) but weak at going *deeper on a box the
user already has in front of them*. Three gaps hurt comprehension most: (1) for a paper, the reader can't
see the authors' **own words** — only our model's rephrasing — so there's no ground truth to anchor on or
verify against; (2) a definition is pitched at **one fixed level** — a reader who finds it too dense (or
too shallow) has no lever but to give up or expand yet another term; (3) when a box *almost* answers the
reader's question, there's **no way to ask the follow-up** without leaving the tool. These three share one
shape — *enrich the box you're looking at* — and one backend pattern (return `{text, terms}` for a box),
so we ship them together.

Decisions locked with the user: **two changes, diagrams last** (this change is the three box features;
figures ship in `paper-diagrams`); complexity is a **discrete, in-place** control (not new nodes); a custom
question spawns a **new child node** (not an in-box thread) and is **signed-in only**.

## What Changes

- **Original-abstract box (papers only).** The root (paper) What node gains an **Abstract** action,
  styled like Why/How, that opens a special **abstract** node showing the paper's abstract **verbatim**
  (the authors' own words). It is read-only: no model-chosen highlighted words and no complexity control
  (it is not ours to rephrase), but free-text **Define** on a selection still works. Topic (non-paper)
  roots do not show it.
- **Complexity levels on every generated box.** What, Why, How, salient-term definitions, and the topic
  root get a small **Simpler ⇄ Standard ⇄ Technical** control (3 levels, default Standard = today's
  output). Changing the level **regenerates that box's text in place** and remembers the chosen level per
  box. The abstract box is excluded (verbatim). Already-expanded children are **preserved** across a
  rephrase even if the wording changed.
- **Custom questions as child nodes (signed-in).** Every generated box gets an **Ask** affordance. A
  signed-in user types a question about the box; the system answers it grounded in the box + paper and
  adds a new **Q&A child node** (the question as its label, the answer as plain-language body with its own
  highlighted words), linked to the box. Q&A nodes expand and take complexity/Ask like any other box.
  Guests see the affordance but are prompted to sign in.

## Capabilities

### Modified Capabilities

- `topic-graph`: a new **abstract** special node on paper roots; a per-box **complexity level** control
  that regenerates in place and preserves already-expanded children; a signed-in **Ask** affordance that
  adds a **Q&A child node**; recursive expansion/complexity/Ask available on Q&A nodes.
- `content-extraction`: surface the paper's **original abstract** verbatim (no model call); **rephrase a
  box** to a requested complexity level, returning `{text, terms}` with highlighted words appearing
  verbatim in the text; **answer a custom question** grounded in a box + paper (signed-in only), returning
  the same `{text, terms}` shape.

## Non-Goals

- Figure/diagram extraction and the gallery (→ **`paper-diagrams`**, the sibling change).
- An in-box Q&A thread (we chose child nodes), question history UI beyond the nodes themselves, or sharing.
- Per-level caching tuning / cost guardrails beyond reusing the existing analysis cache (revisit at M6).
- Abstracts for non-arXiv / uploaded papers (depends on M3 ingestion); topic roots never have one.

## Impact

- **Frontend:** new `abstract` node kind + an Abstract button on the paper root (next to Why/How); a
  `ComplexityControl` on generated nodes wired to in-place regeneration; an `AskBox` affordance (shown to
  all, gated for guests) that creates a `qa` child node; store actions to open the abstract, set a box's
  level and swap its `{text, terms}` in place without dropping children, and add a Q&A child; deterministic
  ids for the new node kinds (`abstract`, `qa:…`).
- **Backend:** emit the abstract on the extract stream (we already fetch arXiv metadata) and/or a small
  `GET /api/abstract`; `POST /api/rephrase` (`{text, level, context?}` → `{text, terms}`); `POST /api/ask`
  (`{arxivId|context, boxText, question}` → `{text, terms}`), requiring an authenticated (non-guest)
  session. All stay stateless and reuse the Gemini provider seam and the analysis cache.
- **Docs:** `plan.md` gains the "Richer understanding" milestone (shared with `paper-diagrams`).
