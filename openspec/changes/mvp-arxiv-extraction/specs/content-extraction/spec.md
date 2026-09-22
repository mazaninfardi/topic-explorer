# Spec Delta

## ADDED Requirements

### Requirement: Extract What from the source paper, first

The system SHALL extract the **What** (the paper's headline — M1 + M5) from the source paper and make it available before Why and How, so the root node can render quickly.

#### Scenario: What is produced before Why/How

- **WHEN** a paper is submitted for extraction
- **THEN** the system produces the What content and its salient terms
- **AND** delivers them before Why and How are available

#### Scenario: Extraction failure is surfaced

- **WHEN** the model fails to produce What for a paper
- **THEN** the system returns a clear, user-facing error rather than an unhandled failure

### Requirement: Extract Why and How from the source paper

The system SHALL extract **Why** (context and gap — M2 + M3) and **How** (method — M4) from the source paper, each with its own salient terms.

#### Scenario: Why and How are produced after What

- **WHEN** What has been produced for a paper
- **THEN** the system produces Why and How content, each carrying its own salient terms

## MODIFIED Requirements

### Requirement: Select salient terms from node content

The system SHALL select a small set of salient terms for each node's content, and every salient term MUST appear **verbatim** within that node's text so it can be highlighted in place.

#### Scenario: Salient terms are produced for the What node

- **WHEN** the What node content is produced
- **THEN** the system marks salient terms

#### Scenario: Salient terms are substrings of the node text

- **WHEN** salient terms are produced for a node
- **THEN** each term appears verbatim in that node's text

### Requirement: Produce a definition for an expanded term

When a salient term is expanded, the system SHALL produce a model-generated definition — a general, plain-language explanation and that definition SHALL itself contain salient terms so exploration can continue. The full source paper SHALL NOT be required to define a term.

#### Scenario: Expanding a term yields definition content with further terms

- **WHEN** a salient term is expanded
- **THEN** the system returns a general definition for the term in a new node
- **AND** the definition contains its own salient terms

## REMOVED Requirements

### Requirement: Derive What content from a pasted paragraph

**Reason**: The MVP replaces the paragraph-based mock with real extraction from an arXiv paper; the input is now a paper, not a pasted paragraph. Input validation moves to the `paper-ingestion` capability.
**Migration**: The What node is now produced from the fetched paper via model extraction (see "Extract What from the source paper, first"). No user data to migrate.
