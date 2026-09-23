# Spec Delta

## Purpose

The sync capability stores each user's topics and familiar terms on the server (Postgres), replacing device-local storage — so a signed-in user's data follows them across devices, and every user's data survives without relying on the browser.

## ADDED Requirements

### Requirement: Server-backed topics

The system SHALL store a user's explored topics on the server and let them list and reopen those topics.

#### Scenario: Topic is saved and reopened

- **WHEN** a user explores a paper and later opens their topics list
- **THEN** the topic appears there and can be reopened into the explorer

### Requirement: Cross-device sync for signed-in users

The system SHALL make a signed-in user's topics and familiar terms available on any device where they sign in.

#### Scenario: Data available on another device

- **WHEN** a signed-in user opens the app on a different device
- **THEN** their previously saved topics and familiar terms are available

### Requirement: Server-backed familiar terms

The system SHALL store a user's familiar terms (with definitions) on the server and let them review and remove them.

#### Scenario: Familiar term persists server-side

- **WHEN** a user marks a term familiar
- **THEN** it is stored server-side and appears in their familiar list until removed

### Requirement: No device-local storage

The system SHALL NOT rely on device-local storage (e.g. IndexedDB) for topics or familiar terms; the server is the single source of truth.

#### Scenario: Fresh browser reflects server state

- **WHEN** a signed-in user opens the app in a browser with no local data
- **THEN** their topics and familiar terms load from the server
