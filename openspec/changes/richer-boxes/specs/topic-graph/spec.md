# topic-graph (delta)

## ADDED Requirements

### Requirement: Show the paper's original abstract as a box

For a paper root, the system SHALL offer an **Abstract** action (presented like the Why/How actions) that
opens a special **abstract** node showing the paper's abstract **verbatim**. The abstract node SHALL be
read-only prose: it SHALL NOT show model-chosen highlighted words and SHALL NOT offer the complexity or
Ask controls, but a free-text selection within it MAY still be defined. A topic (non-paper) root SHALL NOT
offer the Abstract action.

#### Scenario: Opening the abstract on a paper

- **WHEN** the user triggers the Abstract action on a paper root
- **THEN** an abstract node is added showing the paper's abstract verbatim
- **AND** it shows no auto-highlighted words and no complexity or Ask control
- **AND** selecting text within it still offers **Define**

#### Scenario: Topics have no abstract

- **WHEN** the root is a free-text topic (not a paper)
- **THEN** no Abstract action is offered

### Requirement: Adjust the complexity of a generated box

The system SHALL let the user set the reading complexity of any **generated** box (What, Why, How,
salient-term, topic root, or Q&A node) to one of three levels — **Simpler**, **Standard** (default), or
**Technical** — and SHALL regenerate that box's text **in place** at the chosen level. The abstract box
SHALL be excluded. Changing the level SHALL preserve the box's already-expanded child nodes and their
edges, even when the new wording no longer contains some previously highlighted words. The chosen level
SHALL be remembered for that box.

#### Scenario: Making a box simpler keeps its children

- **WHEN** the user sets a box with already-expanded children to **Simpler**
- **THEN** the box's text is regenerated in place at the simpler level
- **AND** its existing child nodes and edges remain
- **AND** the box's chosen level is remembered

#### Scenario: The abstract box cannot be rephrased

- **WHEN** the abstract node is shown
- **THEN** no complexity control is offered for it

### Requirement: Ask a custom question about a box

For a **signed-in** user, the system SHALL offer an **Ask** affordance on every generated box that, given a
free-text question, adds a new **Q&A child node** connected to that box. The Q&A node SHALL show the
question as its label and a plain-language answer (grounded in the box and, for a paper, the paper) as its
body, with its own highlighted words. A Q&A node SHALL support the same expansion, complexity, and Ask
interactions as other generated boxes. A guest triggering Ask SHALL be prompted to sign in rather than
receiving an answer. Re-asking the same question from the same box SHALL NOT create a duplicate node.

#### Scenario: A signed-in user asks a follow-up

- **WHEN** a signed-in user submits a question on a box
- **THEN** a Q&A child node is added and connected to that box
- **AND** it shows the question and a plain-language answer with its own highlighted words
- **AND** the answer's highlighted words can be expanded further

#### Scenario: A guest is asked to sign in

- **WHEN** a guest triggers the Ask affordance
- **THEN** the system prompts them to sign in and does not generate an answer

#### Scenario: The same question is not duplicated

- **WHEN** a user asks a question already asked from the same box
- **THEN** no second Q&A node is created for that question from that box
