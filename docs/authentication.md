# Authentication

## Overview

The monorepo uses first-party email/password authentication. Clerk has been removed.

Auth code lives in `packages/auth`:

- `actions.ts`: web register/login/logout and admin login/logout server actions.
- `account-email.ts`: one-time email verification and password reset token lifecycle.
- `email.ts`: transactional email delivery through Resend when configured.
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

New accounts start with `emailVerified = false`. Registration creates a one-time email verification token and sends a verification link when `RESEND_API_KEY` and `AUTH_EMAIL_FROM` are configured. If transactional email is not configured or delivery fails, account creation still succeeds and a `super_admin` can manually mark a known account verified or unverified from admin `/users`; both paths are audited.

Users can request a fresh verification link from `/verify-email`. Verification links expire after 24 hours and only token hashes are stored.

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

Users can request an email-delivered password reset from `/forgot-password`. Reset links expire after 60 minutes, store only token hashes, revoke existing sessions after a successful reset, and write audit logs without storing password values. Requests use generic success copy so the app does not reveal whether an email is registered.

## Auth Throttling

Registration, web login, admin login, email verification requests, and password reset requests use server-side attempt throttling keyed by client IP and submitted email when available.

Current limits:

- web login: 8 failed attempts per 15 minutes
- admin login: 5 failed attempts per 15 minutes
- registration: 6 failed attempts per 15 minutes
- email verification request: 6 failed attempts per 15 minutes
- password reset request: 6 failed attempts per 15 minutes

Auth rate-limit counters are stored in `AuthRateLimitBucket` rows keyed by scope, client/email bucket, and fixed time window. This keeps throttling consistent across Vercel/serverless instances and future horizontally scaled containers. Admin `/health` shows recent auth pressure with redacted bucket keys.

The public and admin auth forms also include a hidden honeypot field. Submissions that fill that field are rejected and counted as failed auth attempts.

When `TURNSTILE_SECRET_KEY` is configured, auth actions require a valid Cloudflare Turnstile token from the form. Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in the matching web/admin environment so the widget renders. Leave both values blank for local development.

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

Deleting an account first attempts Stripe cleanup when `STRIPE_SECRET_KEY` is configured: linked Stripe subscriptions are cancelled and the linked Stripe customer is deleted when present. It then removes the user row and cascades private app-owned records such as sessions, journal entries, analyses, avatar responses, generated prompts, pattern memory, council sessions, council feedback, consent events, safety events, enrollments, and subscriptions stored in the app database. Operational records with nullable user references, such as audit logs, source import metadata, and generation traces, may remain detached for governance and debugging.

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

- A high-traffic public launch should still add edge/WAF analytics around the app-level auth throttles.
