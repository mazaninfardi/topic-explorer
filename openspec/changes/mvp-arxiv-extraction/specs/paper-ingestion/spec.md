# Spec Delta

## Purpose

The paper-ingestion capability accepts an arXiv paper reference, retrieves its PDF, and validates the input, providing the source content that content-extraction turns into graph nodes.

## ADDED Requirements

### Requirement: Accept an arXiv paper reference

The system SHALL accept an arXiv paper reference as a URL or bare ID (e.g. `https://arxiv.org/abs/1706.03762`, `arxiv.org/pdf/1706.03762`, or `1706.03762`) and resolve it to the paper's PDF.

#### Scenario: Valid arXiv link resolves to a PDF

- **WHEN** the user submits a valid arXiv URL or ID
- **THEN** the system retrieves the corresponding paper PDF for extraction

### Requirement: Reject invalid or non-arXiv input

The system SHALL reject input that is not a recognizable arXiv reference and surface a clear message, without attempting extraction.

#### Scenario: Non-arXiv input is rejected

- **WHEN** the user submits a link that is not an arXiv reference
- **THEN** the system does not start extraction
- **AND** it returns a clear message that only arXiv links are supported at this stage

### Requirement: Handle retrieval failure gracefully

The system SHALL surface a clear error when a recognized arXiv reference cannot be retrieved (network failure, missing paper), without crashing the request.

#### Scenario: Unreachable paper reports an error

- **WHEN** a recognized arXiv reference cannot be fetched
- **THEN** the system returns a clear, user-facing error rather than an unhandled failure
