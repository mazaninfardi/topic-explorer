# content-extraction (delta)

## ADDED Requirements

### Requirement: Resolve a topic query to a paper

The system SHALL accept either an arXiv reference or a free-text topic/question. When the input is not an
arXiv reference, the system SHALL resolve it to a paper by searching arXiv and selecting the most relevant
result, then extract that paper as usual. If no paper is found, the system SHALL return a plain-language
message suggesting different words or pasting an arXiv link.

#### Scenario: A topic query is resolved and explored

- **WHEN** the user submits free text that is not an arXiv reference
- **THEN** the system searches arXiv and selects the most relevant paper
- **AND** proceeds to extract and render that paper's graph

#### Scenario: A topic with no match fails gracefully

- **WHEN** the user submits a topic for which no paper is found
- **THEN** the system returns a plain-language message suggesting different words or pasting an arXiv link

### Requirement: Communicate extraction progress

While an extraction is in progress, the system SHALL show staged, human progress feedback (not a bare
wait), advancing as real milestones (fetch, What ready, Why/How) arrive.

#### Scenario: The wait is narrated

- **WHEN** an extraction is running
- **THEN** the user sees staged progress feedback that advances as milestones are reached
