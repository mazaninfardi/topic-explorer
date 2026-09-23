# Spec Delta

## ADDED Requirements

### Requirement: Reuse a paper's prior analysis

The system SHALL persistently store a paper's analysis (What, Why, How, and their salient terms, plus title) keyed by its arXiv id, and SHALL reuse the stored analysis for any later request for the same paper instead of re-running the model — shared across users and across restarts.

#### Scenario: Second request reuses stored analysis

- **WHEN** any user requests extraction for a paper that has already been analyzed
- **THEN** the system returns the stored What/Why/How without calling the model again

#### Scenario: First request computes and stores

- **WHEN** a paper is analyzed for the first time
- **THEN** the system stores its analysis so subsequent requests can reuse it
