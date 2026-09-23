# topic-graph (delta)

## MODIFIED Requirements

### Requirement: Highlight salient terms within a node

The system SHALL visually distinguish a subset of words within a node as clickable terms, described to the
user in plain language (e.g. "highlighted words"), never as internal jargon such as "salient terms".

#### Scenario: Salient terms are visibly clickable

- **WHEN** a node with salient terms is rendered
- **THEN** each salient term is visually distinct from surrounding text and responds to click

#### Scenario: Terms are described in plain language

- **WHEN** the interface refers to the clickable terms in copy shown to the user
- **THEN** it uses plain language such as "highlighted words" rather than internal jargon

## ADDED Requirements

### Requirement: Preserve the reader's viewport during exploration

The system SHALL fit the view to the whole graph only when a topic is first rendered. On expanding a term,
the system SHALL bring the newly created node into view without refitting the whole graph, and SHALL keep
the user's current zoom. Once the user manually pans or zooms, the system SHALL stop moving the camera
automatically until the user invokes an explicit "fit view" control.

#### Scenario: Expanding a term keeps the reader oriented

- **WHEN** the user clicks a highlighted word to expand it
- **THEN** the new node is revealed in the viewport
- **AND** the rest of the graph is not refit and the zoom level is unchanged

#### Scenario: Manual camera control is respected

- **WHEN** the user has panned or zoomed the graph manually
- **AND** then expands a term
- **THEN** the system does not move the camera automatically
- **AND** an explicit "fit view" control remains available to re-frame the graph

### Requirement: Orient the user within the graph

The system SHALL provide an overview aid (minimap) and SHALL keep the current paper's title visible while
exploring, so the user stays oriented as the graph grows.

#### Scenario: Overview and current-paper are visible

- **WHEN** a graph with one or more nodes is displayed
- **THEN** a minimap of the whole graph is shown
- **AND** the current paper's title is visible independent of scroll position

### Requirement: Signal newly created nodes

The system SHALL briefly emphasize a node at the moment it is created so the user can find it.

#### Scenario: A new node draws the eye

- **WHEN** a node is added to the graph
- **THEN** it is briefly highlighted, and the highlight fades shortly after

### Requirement: Legible, reversible node controls

The system SHALL present the hide control as a clearly reversible "collapse" affordance, the restore
control with a label indicating how many are hidden, and the mark-known control with wording that states it
hides the box. Marked-known terms SHALL show a trailing check.

#### Scenario: Controls read as their real action

- **WHEN** a node offers hide, restore, and mark-known controls
- **THEN** the hide control reads as reversible collapse
- **AND** the restore control indicates the count it will reveal
- **AND** confirming mark-known both records the term as known and hides its box
- **AND** a term recorded as known displays a trailing check
