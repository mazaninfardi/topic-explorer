# onboarding (delta)

## ADDED Requirements

### Requirement: Logged-out visitors see the example only

A logged-out visitor SHALL always see the baked example graph and SHALL NOT be able to explore their own
paper or topic. The example's pre-baked content (Why/How and its already-defined term boxes) remains
interactive with no model call. In place of the exploration input, a logged-out visitor SHALL see a
**sign-in call-to-action**.

#### Scenario: A guest sees the example and a sign-in call-to-action

- **WHEN** a logged-out visitor opens the app
- **THEN** the example graph is shown
- **AND** a "sign in to explore" call-to-action is shown in place of the input
- **AND** the example's Why/How and pre-baked term boxes still open without any model call

### Requirement: Gated actions prompt a guest to sign in

When a logged-out visitor triggers a model-backed action — exploring, or defining a new (not pre-baked)
term — the system SHALL show a sign-in prompt instead of performing the action.

#### Scenario: A guest clicks a new term

- **WHEN** a logged-out visitor clicks a highlighted word that has no pre-baked definition
- **THEN** a sign-in prompt is shown and no definition is fetched
