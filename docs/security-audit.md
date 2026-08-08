# Journal Privacy Security Audit

Audit date: 2026-08-08

## Scope and threat model

This repository audit covers journal storage, application authorization, admin access, exports, AI processing, transport configuration, telemetry, and audit logging. The protected asset is the user's full journal text. Primary threats are cross-user access, unnecessary privileged access, accidental logging or tracing, database/network disclosure, and unreviewed expansion of raw-text access.

This audit does not prove the configuration of a deployed database, backups, cloud disks, secrets manager, or production network. Those require evidence from the hosting provider and an independent security review.

## Verified repository controls

- User-facing reads are scoped to the authenticated owner in the web, mobile, export, and ChatGPT tool paths.
- Admin list and calibration views are metadata-first. Calibration reports now classify sessions from generation-trace metadata and do not query journal text.
- Raw safety-event reveal is limited to `super_admin`, requires a reason, and records actor, target, IP address, user agent, timestamp, and a one-way content hash without copying raw text into the audit log.
- Production database URLs are normalized to `sslmode=verify-full`, including URLs with a missing or weaker configured mode.
- Sentry and LangSmith configuration strips or excludes journal content from telemetry metadata.
- `yarn test:security` prevents calibration-report raw-text reads and weaker safety-reveal authorization from returning unnoticed.

## Data paths that intentionally retain plaintext access

`JournalEntry.rawText` remains an application plaintext column. The owner journal UI, reflection generation, safety classification, saved-session APIs, and account export need the content to deliver their current behavior. Explicit safety review can reveal a flagged entry under the controls above.

## External gates and unresolved risks

Before production approval, obtain and retain evidence for:

1. Managed PostgreSQL disk and backup encryption at rest, TLS certificate verification, access logs, private-network/firewall policy, and least-privilege database credentials.
2. A field-level encryption decision based on a documented threat model. If required, use envelope encryption with a managed KMS, versioned ciphertext, separate key/data storage, rotation and revocation procedures, backup recovery tests, and a migration plan for existing entries. Do not introduce a single hard-coded or repository-managed encryption key.
3. Retention and deletion requirements for journal entries, exports, audit logs, backups, and derived AI records.
4. Independent application and infrastructure security review, including authorization tests and incident-response procedures.

Repository checks passing means the scoped engineering controls were verified; it is not a claim of production security certification or legal/privacy compliance.
