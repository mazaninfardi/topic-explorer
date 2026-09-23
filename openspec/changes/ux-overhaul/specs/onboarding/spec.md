# onboarding (delta)

## ADDED Requirements

### Requirement: First-visit example graph

On a first visit with nothing to restore, the system SHALL display a pre-built example graph so the user
can interact immediately without waiting for extraction. Starting a real exploration SHALL replace the
example.

#### Scenario: Example graph greets a new user

- **WHEN** a new user opens the app with no prior exploration to restore
- **THEN** a pre-built example graph is shown and is fully interactive
- **AND** submitting a topic or link replaces the example with the real exploration

### Requirement: Dismissible first-time walkthrough

The system SHALL present a short, dismissible walkthrough that explains the core interaction (What, the
highlighted words, Why/How), including a one-time pointer to the first highlighted word. Dismissal SHALL
persist so it does not reappear on later visits.

#### Scenario: Walkthrough teaches then stays gone

- **WHEN** a first-time user views the app
- **THEN** a brief walkthrough explains the interaction and points at the first highlighted word
- **WHEN** the user dismisses it
- **THEN** it does not reappear on subsequent visits

### Requirement: Fair, legible guest limit

For guest users, the system SHALL show a persistent affordance to sign in to save work, including how many
of the allowed papers remain, so reaching the limit is expected rather than a surprise.

#### Scenario: Guest sees remaining papers and a save prompt

- **WHEN** a guest user is exploring
- **THEN** a persistent affordance shows how many papers remain and invites sign-in to save
- **WHEN** the guest reaches the limit
- **THEN** the outcome is consistent with the count already shown
