# content-extraction (delta)

## ADDED Requirements

### Requirement: Enrichment endpoints require a signed-in account

The enrichment operations — providing the abstract, rephrasing a box, and extracting/serving figures —
SHALL require an authenticated (non-guest) account, alongside the already-gated custom-question answer. A
guest (unauthenticated) caller SHALL be refused. The core operations (deriving What/Why/How and defining a
term) remain available to guests.

#### Scenario: A guest is refused the enrichment endpoints

- **WHEN** a guest calls the abstract, rephrase, or figures endpoints
- **THEN** the system refuses the request (unauthorized) and does no costly work

#### Scenario: Core extraction stays open to guests

- **WHEN** a guest explores a paper or defines a term
- **THEN** the system serves it as before, without requiring sign-in

### Requirement: The verbatim abstract is not sent to guests

Although the paper's abstract is still cached for signed-in users, the system SHALL NOT include the
abstract in the extraction result delivered to a guest.

#### Scenario: A guest's extraction omits the abstract

- **WHEN** a guest explores a paper
- **THEN** the extraction result delivered to them does not contain the abstract
- **AND** the abstract is still cached so a signed-in user receives it
