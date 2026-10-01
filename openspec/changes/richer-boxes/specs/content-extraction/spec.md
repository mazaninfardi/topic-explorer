# content-extraction (delta)

## ADDED Requirements

### Requirement: Provide the paper's original abstract verbatim

For an arXiv paper, the system SHALL make the paper's **original abstract** available **verbatim**, without
model rephrasing. The abstract SHALL be sourced from arXiv metadata (no model call) and made available to
the client both during extraction and for a graph restored later.

#### Scenario: Abstract is available during extraction

- **WHEN** a paper is being extracted
- **THEN** the paper's verbatim abstract is made available to the client without a separate model call

#### Scenario: Abstract is available for a restored graph

- **WHEN** a previously explored paper graph is reloaded
- **THEN** the client can retrieve the paper's verbatim abstract on demand

### Requirement: Rephrase a box at a requested complexity level

The system SHALL reformulate a box's text to a requested reading level — **simpler**, **standard**, or
**technical** — returning the reformulated text together with its highlighted words. The highlighted words
returned SHALL appear verbatim in the reformulated text. Rephrasing SHALL be a text-to-text reformulation
and SHALL NOT require re-extracting the source paper.

#### Scenario: A box is reformulated at a target level

- **WHEN** the system is asked to rephrase a box's text at a given level
- **THEN** it returns reformulated text at that level plus highlighted words that appear verbatim in it

#### Scenario: An invalid level is rejected

- **WHEN** a rephrase is requested at a level other than simpler, standard, or technical
- **THEN** the system rejects the request

### Requirement: Answer a custom question grounded in a box

For a **signed-in** user, the system SHALL answer a free-text question in the context of a given box (and,
for a paper, the paper), returning a plain-language answer together with its highlighted words that appear
verbatim in the answer. The system SHALL refuse the request for a guest (unauthenticated) caller.

#### Scenario: A grounded answer is produced for a signed-in caller

- **WHEN** a signed-in user asks a question about a box
- **THEN** the system returns a plain-language answer grounded in that box (and the paper, if any)
- **AND** the answer includes highlighted words that appear verbatim in it

#### Scenario: A guest is refused

- **WHEN** a guest (unauthenticated) caller asks a question
- **THEN** the system refuses and does not generate an answer
