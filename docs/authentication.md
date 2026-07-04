# Authentication

## Overview

The monorepo uses first-party email/password authentication. Clerk has been removed.

Auth code lives in `packages/auth`:

- `actions.ts`: web register/login/logout and admin login/logout server actions.
- `session.ts`: password hashing, scoped session cookie management, session lookup, and auth guards.
- `user.ts`: compatibility exports for user guards.

App route protection lives in:

- `apps/web/src/proxy.ts`
- `apps/admin/src/proxy.ts`

## Registration

Web `/register` creates normal product accounts.

Registration requires:

- name
- email
- password with at least 8 characters

The server action validates input, normalizes email, rejects duplicates, hashes the password, creates a `User`, creates a web-scoped session, and redirects to `/dashboard`.

If the email appears in `SUPER_ADMIN_EMAILS`, the user is assigned `super_admin`. Otherwise new users default to `user`.

## Web Login

Web `/login` creates an `ia_web_session` cookie with `Session.scope = "web"`.

Invalid credentials return the same graceful form error for unregistered users and wrong passwords:

```text
Email or password is incorrect.
```

Database/schema failures are caught and returned as form errors where possible.

## Admin Login

Admin `/login` creates an `ia_admin_session` cookie with `Session.scope = "admin"`.

Only users with `admin` or `super_admin` can create admin-scoped sessions. A normal web session does not grant admin access.

Emails in `SUPER_ADMIN_EMAILS` are upgraded to `super_admin` during login.

## Password Changes And Recovery

Signed-in web users can change their own password from `/settings` by entering the current password and confirming a new password with at least 8 characters. The password is hashed before storage and the change writes an audit log without storing the password value.

If a user is locked out, a `super_admin` can issue a temporary password from admin `/users`. That reset requires a reason, revokes the user's existing sessions, and writes audit logs without storing the temporary password.

There is no email-delivered "forgot password" flow yet.

## Auth Throttling

Registration, web login, and admin login use server-side attempt throttling keyed by client IP and submitted email when available.

Current limits:

- web login: 8 failed attempts per 15 minutes
- admin login: 5 failed attempts per 15 minutes
- registration: 6 failed attempts per 15 minutes

This is an application-level guard for the current deployment shape. A future high-traffic deployment should move throttling to shared infrastructure such as an edge/WAF layer or a shared store so limits apply consistently across many app replicas.

## Sessions

`createSession()` generates a random token, hashes it with SHA-256, stores the hash in `Session.tokenHash`, and sends the raw token in a scoped cookie.

Session cookies:

- web: `ia_web_session`
- admin: `ia_admin_session`

Cookie settings:

- `httpOnly: true`
- `sameSite: "lax"`
- `secure: true` in production
- 30-day expiry

`getCurrentUser(scope)` reads the corresponding cookie, hashes the token, finds the matching `Session`, verifies the stored scope, deletes expired sessions, updates `lastSeenAt`, and returns the related `User`.

Users can review active sessions from `/settings`, revoke a single session, revoke the current session, or revoke all sessions. Revoking the current session signs the user out. Session revocation writes audit and pilot-event metadata without storing raw journal content.

## Account Deletion

Signed-in users can delete their own account from `/settings` by confirming their current password and typing `DELETE`.

Deleting an account removes the user row and cascades private app-owned records such as sessions, journal entries, analyses, avatar responses, generated prompts, pattern memory, council sessions, council feedback, consent events, safety events, enrollments, and subscriptions stored in the app database. Operational records with nullable user references, such as audit logs, source import metadata, and generation traces, may remain detached for governance and debugging.

## Route Protection

Web protected routes:

- `/dashboard`
- `/journal`
- `/patterns`
- `/avatar`
- `/settings`
- `/api/journal`
- `/api/avatar`
- `/api/prompts`
- `/api/patterns`
- `/api/voice`

Admin protected routes:

- every admin route except `/login` and static assets.

Server-side authorization must still be called inside pages, server actions, and API routes:

- `requireAppUser()` for web account data.
- `requireAdminUser()` for admin pages/actions.
- `requireSuperAdminUser()` for super-admin-only operations.

## Known Gaps

- No email-delivered password reset flow yet.
- No email verification flow yet.
- No CAPTCHA or bot-protection challenge yet.
