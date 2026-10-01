# topic-graph (delta)

## ADDED Requirements

### Requirement: Browse a paper's figures in a gallery

For a paper root, the system SHALL offer a **Figures** action (presented like the Why/How actions) that
opens a single **gallery** node showing the paper's figures one at a time. The gallery SHALL display the
current figure's image and caption and a position indicator, and SHALL provide **previous** and **next**
controls that move between figures **without adding further nodes**. A topic (non-paper) root SHALL NOT
offer the Figures action. While figures are being extracted the gallery SHALL show a loading state, and a
paper with no figures SHALL show an explicit empty state.

#### Scenario: Paging through figures within one box

- **WHEN** the user opens Figures on a paper with multiple figures
- **THEN** a single gallery node shows one figure with its caption and a position indicator
- **AND** previous / next move between figures without creating new nodes

#### Scenario: Extraction is in progress

- **WHEN** figures are opened for a paper that has not been extracted yet
- **THEN** the gallery shows a loading state until the figures are ready

#### Scenario: No figures to show

- **WHEN** the paper has no detectable figures
- **THEN** the gallery shows an explicit empty state rather than an error

#### Scenario: Topics have no figures

- **WHEN** the root is a free-text topic (not a paper)
- **THEN** no Figures action is offered
