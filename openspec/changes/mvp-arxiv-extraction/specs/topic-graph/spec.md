# Spec Delta

## ADDED Requirements

### Requirement: What node exposes Why and How actions

The root What node SHALL present **Why** and **How** actions the user can trigger to reveal deeper explanation, distinct from salient-term expansion.

#### Scenario: What node shows Why and How

- **WHEN** the root What node is rendered
- **THEN** it presents a Why action and a How action

### Requirement: Open a single Why or How special node

The system SHALL, on triggering the Why or How action, create one special node of that kind connected to the What node by an edge; triggering the same action again SHALL NOT create a duplicate.

#### Scenario: Triggering Why opens a connected special node

- **WHEN** the user triggers the Why action on the What node
- **THEN** a Why special node is added and connected to the What node by an edge

#### Scenario: Why and How are not duplicated

- **WHEN** the user triggers an already-opened Why or How action
- **THEN** no duplicate special node is created

### Requirement: Nodes show a loading state until content arrives

A node whose content is still being fetched SHALL display a loading state that is replaced by the content once it arrives.

#### Scenario: Loading indicator then content

- **WHEN** a node's content is still being fetched
- **THEN** the node shows a loading indicator
- **AND** the indicator is replaced by the content when it arrives
