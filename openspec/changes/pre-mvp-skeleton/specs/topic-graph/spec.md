# Spec Delta

## Purpose

The topic-graph capability renders a user's exploration as an interactive node-and-edge graph and lets the user expand salient terms into connected child nodes, recursively, so understanding grows visually as curiosity drives it.

## ADDED Requirements

### Requirement: Render a root What node

The system SHALL render a single root **What** node as the entry point of the graph for a given input.

#### Scenario: Root node appears after input

- **WHEN** the user submits input to explore
- **THEN** the system displays exactly one What node as the graph root, containing the What content

### Requirement: Highlight salient terms within a node

The system SHALL visually distinguish a subset of words within a node as clickable **salient terms**.

#### Scenario: Salient terms are visibly clickable

- **WHEN** a node with salient terms is rendered
- **THEN** each salient term is visually distinct from surrounding text and responds to click

### Requirement: Expand a salient term into a connected child node

The system SHALL, on clicking a salient term, create a new **salient-term node** containing that term's definition content and connect it to the node the term was clicked from with a directed edge (parent → child).

#### Scenario: Clicking a salient term creates a linked child

- **WHEN** the user clicks a salient term in any node
- **THEN** a new salient-term node is added to the graph
- **AND** an edge connects the originating node to the new node

#### Scenario: A term already expanded is not duplicated

- **WHEN** the user clicks a salient term that has already been expanded from the same node
- **THEN** the system does not create a second duplicate node for that term from that node

### Requirement: Support recursive nesting of salient terms

The system SHALL allow salient-term nodes to themselves contain salient terms that expand into further salient-term nodes, to arbitrary depth.

#### Scenario: Nested expansion works

- **WHEN** the user clicks a salient term inside a salient-term node
- **THEN** a further salient-term node is created and connected to it, and the same interaction remains available on the new node
