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

- No password reset flow yet.
- No email verification flow yet.
- No rate limiting or bot protection yet.
- No session management UI yet.
