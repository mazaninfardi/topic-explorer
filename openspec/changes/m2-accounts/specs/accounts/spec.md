# Spec Delta

## Purpose

The accounts capability establishes who a user is — an anonymous guest or a Google-signed-in account — and gates anonymous usage so exploration is unlimited only for signed-in users.

## ADDED Requirements

### Requirement: Google sign-in

The system SHALL let a user sign in with Google: the client obtains a Google ID token, the backend verifies it, and the user is identified by their Google account thereafter (via a session).

#### Scenario: Successful sign-in

- **WHEN** a user completes Google sign-in and the backend verifies the ID token
- **THEN** the system establishes an authenticated session for that user

#### Scenario: Invalid token is rejected

- **WHEN** an invalid or unverifiable Google token is presented
- **THEN** the system does not establish a session and returns an error

### Requirement: Guest sessions

The system SHALL give an anonymous visitor a persistent guest identity (session) so their explorations are stored and retrievable without an account.

#### Scenario: Guest identity persists

- **WHEN** an anonymous visitor uses the app across page loads on the same device
- **THEN** their explorations remain associated with the same guest identity

### Requirement: Guest usage is limited to 5 papers

The system SHALL allow a guest to explore at most 5 papers; further exploration SHALL require signing in. Signed-in users have no such limit.

#### Scenario: Guest hits the limit

- **WHEN** a guest who already has 5 explored papers tries to explore another
- **THEN** the system blocks it and prompts the user to sign in

#### Scenario: Signed-in users are unlimited

- **WHEN** a signed-in user explores papers
- **THEN** no 5-paper limit is applied

### Requirement: Current user and sign-out

The system SHALL expose who the current user is (guest vs signed-in, with account details when signed in) and SHALL let a signed-in user sign out.

#### Scenario: Report current identity

- **WHEN** the app loads
- **THEN** the system reports whether the current session is a guest or a signed-in account

#### Scenario: Sign out

- **WHEN** a signed-in user signs out
- **THEN** their authenticated session ends
