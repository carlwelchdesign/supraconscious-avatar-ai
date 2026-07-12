# Social Login + YubiKey/Passkey MFA Plan

## Summary
Add Google and Apple social login across web and Flutter mobile, plus opt-in anti-phishing MFA using WebAuthn/passkeys so a YubiKey can protect an account. Once a user enrolls a passkey, every password or social login must complete passkey verification before the normal app session is created.

## Key Changes
- Add auth persistence for OAuth linked accounts, WebAuthn credentials, pending auth challenges, recovery codes, and session MFA metadata.
- Add password/social login handoff into pending MFA when a user has enrolled passkeys; create the normal cookie-backed session only after passkey assertion succeeds.
- Add web routes and UI for Google/Apple social login, passkey MFA challenge, and passkey management in settings.
- Add mobile JSON support for social login, pending MFA state, passkey challenge completion, and basic passkey management; keep cookie-backed sessions.
- Add native association files for iOS/Android passkey support and document required env vars.

## Test Plan
- Auth tests for password login with and without passkey MFA, OAuth account linking, challenge expiry/replay, recovery code use, and audit events.
- Web tests for OAuth state/nonce handling, settings passkey management, and MFA-required login behavior.
- Flutter tests for social login buttons, MFA-required state, and passkey settings states.
- Run auth/web typecheck/tests, `build:web`, mobile pub-get/analyze/test, Android debug build, and iOS simulator build where local tooling allows.

## Assumptions
- Google + Apple are the first social providers; enterprise SAML/OIDC is out of this slice.
- MFA is opt-in for all users, but enforced for every future login once any passkey is enrolled.
- YubiKey support is via WebAuthn/passkeys, not TOTP.
- Native mobile passkeys require production domain association and platform signing identifiers.
