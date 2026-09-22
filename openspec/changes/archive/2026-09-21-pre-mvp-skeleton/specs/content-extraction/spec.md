# Spec Delta

## Purpose

The content-extraction capability turns user input into the content shown in graph nodes — the What headline, the set of salient terms, and each term's definition. At Pre-MVP this is fully mocked; it later evolves to real model-based extraction.

## ADDED Requirements

### Requirement: Derive What content from a pasted paragraph

The system SHALL accept a plain-text paragraph and derive the root What node's content from its first and last sentences (stand-ins for the paper's M1 and M5).

#### Scenario: Paragraph produces a What headline

- **WHEN** the user submits a paragraph of at least two sentences
- **THEN** the system produces What content composed from the paragraph's first and last sentences

#### Scenario: Too-short input is rejected

- **WHEN** the user submits input from which first and last sentences cannot be identified
- **THEN** the system does not create a graph and surfaces a clear message to the user

### Requirement: Select salient terms from node content

The system SHALL select a small set of salient terms from a node's text to offer for exploration.

#### Scenario: Salient terms are produced for the What node

- **WHEN** the What node content is produced
- **THEN** the system marks a small number (at least one) of its words as salient terms

### Requirement: Produce a definition for an expanded term

The system SHALL produce definition content for a salient term when it is expanded, and that content SHALL itself contain salient terms so exploration can continue.

#### Scenario: Expanding a term yields definition content with further terms

- **WHEN** a salient term is expanded
- **THEN** the system returns placeholder definition content for it
- **AND** that content contains its own salient terms
