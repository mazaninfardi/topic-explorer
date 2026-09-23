# Spec Delta

## ADDED Requirements

### Requirement: Collapse and expand a node's subtree

The system SHALL let the user collapse a node that has children — hiding its descendant nodes and their edges — and expand it again to reveal them, re-flowing the layout for the visible nodes.

#### Scenario: Collapse hides the subtree

- **WHEN** the user collapses a node that has children
- **THEN** that node's descendant nodes and their connecting edges are hidden
- **AND** the layout re-flows to the remaining visible nodes

#### Scenario: Expand restores the subtree

- **WHEN** the user expands a previously collapsed node
- **THEN** its descendants become visible again
- **AND** the layout re-flows to include them

#### Scenario: Leaf nodes offer no collapse control

- **WHEN** a node has no children
- **THEN** it presents no collapse control
