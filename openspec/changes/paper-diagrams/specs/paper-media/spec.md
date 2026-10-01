# paper-media (delta)

## ADDED Requirements

### Requirement: Extract a paper's figures as real images on demand

The system SHALL, on demand, extract a paper's **figures as real images** from its PDF, each paired with
its **caption** and **figure number**. Extraction SHALL run only when the figures are first requested for a
paper (not during the initial extraction), and the results SHALL be cached so that a later request for the
same paper's figures returns without re-extracting.

#### Scenario: Figures are extracted on first request

- **WHEN** a paper's figures are requested for the first time
- **THEN** the system extracts the figures as images, each with its caption and number

#### Scenario: A repeat request is served from cache

- **WHEN** a paper's figures are requested again after a prior extraction
- **THEN** the system returns the cached figures without re-extracting

#### Scenario: A paper with no detectable figures

- **WHEN** a paper has no detectable figures
- **THEN** the system returns an explicit empty result rather than an error

### Requirement: Serve extracted figures to the client

The system SHALL expose a paper's extracted figures to the client as an ordered list, each item carrying
the figure's **number**, **caption**, and a reference to its **image**, with the images served through the
backend.

#### Scenario: Figures are listed for the client

- **WHEN** the client requests a paper's figures after extraction
- **THEN** the system returns an ordered list of figures, each with its number, caption, and image reference
