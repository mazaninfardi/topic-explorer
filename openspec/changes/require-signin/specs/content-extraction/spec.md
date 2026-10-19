# content-extraction (delta)

## ADDED Requirements

### Requirement: Core extraction and definition require a signed-in account

Deriving a paper's or topic's What/Why/How content, and defining a term, SHALL require an authenticated
(non-guest) account. A guest (unauthenticated) caller SHALL be refused. There is no free-paper trial for
guests.

#### Scenario: A guest is refused extraction and definition

- **WHEN** a guest calls the extract or define endpoint
- **THEN** the system refuses the request (unauthorized) and does no model work

#### Scenario: A signed-in user extracts and defines normally

- **WHEN** a signed-in user explores a paper or topic, or defines a term
- **THEN** the system serves the content as before
