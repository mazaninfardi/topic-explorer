# Spec Delta

## Purpose

The local-persistence capability stores a user's explorations and familiar terms on their device (IndexedDB, anonymous), so a returning same-device user can reopen past topics and review terms they marked as known.

## ADDED Requirements

### Requirement: Persist and restore the current exploration

The system SHALL save the current exploration graph to device-local storage and restore it when the user returns, without an account.

#### Scenario: Exploration survives a reload

- **WHEN** a user has explored a paper and reloads the app
- **THEN** the most recent exploration's graph is restored from device-local storage

### Requirement: Browse and reopen saved topics

The system SHALL keep a list of explored topics and let the user reopen one from a `/topics` view.

#### Scenario: Reopen a saved topic

- **WHEN** the user opens `/topics` and selects a previously explored topic
- **THEN** that topic's graph is loaded into the explorer

#### Scenario: Topics list reflects explorations

- **WHEN** the user has explored one or more papers
- **THEN** `/topics` lists them (most recent first) with an identifying label

### Requirement: Mark and review familiar terms

The system SHALL let the user mark a salient term as "familiar", persist it device-locally, and review all familiar terms at `/terms/familiar`.

#### Scenario: Mark a term familiar

- **WHEN** the user marks a salient term as familiar
- **THEN** the term is stored and appears in `/terms/familiar`

#### Scenario: Unmark a familiar term

- **WHEN** the user unmarks a term that was familiar
- **THEN** it is removed from `/terms/familiar`
