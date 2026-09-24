# content-extraction (delta)

## ADDED Requirements

### Requirement: Explain a free-text topic (no paper)

The input offers two modes. In **paper** mode the system extracts an arXiv paper (What/Why/How) and
validates the arXiv reference. In **topic** mode the system SHALL treat the input as a free-text topic and
return a generic plain-language explanation — a definition-style root node with expandable highlighted
terms, recursively — and SHALL NOT resolve it to a paper, show Why/How, or link a PDF.

#### Scenario: A topic gets a generic explanation

- **WHEN** the user submits a free-text topic in topic mode
- **THEN** the system returns a plain-language explanation as a definition-style root node
- **AND** its highlighted terms can be expanded further, like any definition
- **AND** no Why/How and no paper link are shown

#### Scenario: A non-arXiv link is rejected in paper mode

- **WHEN** the user submits something that isn't an arXiv reference in paper mode
- **THEN** the system rejects it with a plain-language message and does not start an extraction

### Requirement: Communicate extraction progress

While an extraction is in progress, the system SHALL show staged, human progress feedback (not a bare
wait), advancing as real milestones (fetch, What ready, Why/How) arrive.

#### Scenario: The wait is narrated

- **WHEN** an extraction is running
- **THEN** the user sees staged progress feedback that advances as milestones are reached
