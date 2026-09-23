xc# tl;dr
A web app designed to make complex scientific research accessible to anyone with curiosity, regardless of their background.

# top-level
* User provides a topic (for the MVP a link to a paper)
* We visualize the concept briefly and let them explore important terms in the context, until they get the full context.
* Since we focus on papers at first, we can utilize the general M1-M5 structure of papers:
> - **M1 — Context**: the broad problem and why it matters.
> - **M2 — Background**: prior work and the foundational concepts a newcomer needs.
> - **M3 — Gap**: what's unresolved or missing that motivates this paper.
> - **M4 — Contribution / Approach**: what the paper actually does (method, idea, model).
> - **M5 — Findings & Implications**: results and what they mean going forward.

So if we think about learning, a person is mainly interested in "What" first, which is M1 & M5, then if they are curious, they would like to know why, which is M2&M3, and when their curiosity is engaged, they'd like to know how the authors achieved it. This applies to almost any topic though.

What the app does:
* App summarizes concepts in the shape of a graph
* First it shows the **What** (M1 & M5 most probably, if the paper is well-written) of the paper in a node and provides two additional links in the bottom, **why**, and **how**
* If **why** or **how** are clicked a new node, explains them in more details, these are our three special nodes
* Everything else is based on the salient terms in a box, e.g., for simplicity If the **what** is Claude is frontiner model which makes several tasks, including coding simpler, some salient terms would be **frontiner model**, and **coding**, user can click on these and the new concepts are explained in simple terms again, but now we are only limited to **what** there is no why, so those other special nodes don't exist
* Each box can have it salient terms and we can epxlore more
* I'll share more variations in the milestones I have in mind.

# Evolution of the app
* Pre-mvp (goal- get something that is functional and close to how it looks like), e2e pre-demo
  - User provides a simple paragraph
  - take the first and last sentences (M1 & M5) and show it in a node
  - highlight some random words from these two sentences and highlight them as salient terms
  - when clicked show a **lorem ipsum...** node and connect it to the main **what** node, and highlight some more random text as salient term
  - When salient terms in the explanations node are clicked show another **lorem ipsum..** so we can see nested definition working
* MVP - a fully functional - everything pre-mvp +
  - Get a real link to a paper
  - extract the what, why and how using the model in the BE
  - show the what to user, and why & how as special buttons within that node
  - automatically identify salient terms using the  model in the BE
  - when salient terms are clicked extract a summary of their definition with the model in the BE and show a salient term node definition
* M1 - adding users
  - enable Google OAuth
  - Make the nodes both expandable and collapsable
  - Use indexdb as a temporary db for explorations
  - Store the already explored topics in indexdb, user can accdess them under /topics
  - allow users to mark a topic as "familiar", and see all faimliar terms in their terms/familiar path
* M2 - real functional app
  - add a db to the BE to store user preferences (familiar terms for now), topics
  - deploy to GCP
* M3
  - allow users to explain the familiar terms and get a score, that score will be shown to them to tell them how well they remember the term
  - enable omnisearch, so they can get to topics and terms quickly
  - Allow PDF and non-archive papers

We can expand this further in the future by adding more scalability and caching, as number of users grow, but we are at MVP phase at this point.

