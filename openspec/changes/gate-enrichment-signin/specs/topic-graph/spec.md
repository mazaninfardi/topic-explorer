# topic-graph (delta)

## ADDED Requirements

### Requirement: Enrichment features are shown only to signed-in users

The abstract box, the complexity control, the custom-question Ask affordance, and the figure gallery SHALL
be shown **only to signed-in users**. A guest SHALL NOT see any of these controls — no Abstract button, no
Figures button, no complexity control, and no Ask affordance — anywhere in the graph. The core experience
(What/Why/How and expanding highlighted terms) remains available to guests.

#### Scenario: A guest sees none of the enrichment controls

- **WHEN** a guest views any box in the graph
- **THEN** no Abstract button, Figures button, complexity control, or Ask affordance is shown
- **AND** the What/Why/How content and term expansion remain available

#### Scenario: A signed-in user sees the enrichment controls

- **WHEN** a signed-in user views the graph
- **THEN** the Abstract and Figures buttons (on a paper root), the complexity control, and the Ask
  affordance are available
