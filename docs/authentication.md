# Authentication

## Overview

The app uses first-party email/password authentication. Clerk has been removed.

Auth code lives in:

- `src/lib/auth/actions.ts`: register, login, logout server actions.
- `src/lib/auth/session.ts`: password hashing, session cookie management, session lookup, and auth guards.
- `src/lib/auth/user.ts`: compatibility export for `requireAppUser` and `requireAdminUser`.
- `src/proxy.ts`: early protected-route checks.
- `src/components/auth/auth-form.tsx`: shared login/register form.

## Registration

`/register` renders the custom registration form.

Registration requires:

- name
- email
- password with at least 8 characters

The server action:

1. Validates input with Zod.
2. Normalizes email to lowercase.
3. Rejects duplicate emails.
4. Hashes the password with bcrypt.
5. Creates a `User`.
6. Makes the first credentialed user an `admin`.
7. Creates a session and redirects to `/dashboard`.

## Login

`/login` renders the custom login form.

The server action:

1. Validates email/password input.
2. Looks up the user by email.
3. Verifies the password hash.
4. Returns `Email or password is incorrect.` for unregistered users or wrong passwords.
5. Creates a session and redirects to `/dashboard`.

Database/schema failures are caught and returned as form errors instead of raw `500` crashes where possible.

## Sessions

`createSession()` generates a random token, hashes it with SHA-256, stores the hash in `Session.tokenHash`, and sends the raw token as the `inner_avatar_session` cookie.

Cookie settings:

- `httpOnly: true`
- `sameSite: "lax"`
- `secure: true` in production
- 30-day expiry

`getCurrentUser()` reads the cookie, hashes the token, finds the matching `Session`, deletes expired sessions, updates `lastSeenAt`, and returns the related `User`.

## Route Protection

`src/proxy.ts` checks for `inner_avatar_session` on protected routes:

- `/dashboard`
- `/journal`
- `/patterns`
- `/avatar`
- `/settings`
- `/admin`
- `/api/journal`
- `/api/avatar`
- `/api/prompts`
- `/api/patterns`

Browser requests without a session redirect to `/login`. Protected API requests without a session return `401`.

Server pages and API routes still call `requireAppUser()` or `requireAdminUser()` because middleware cookie presence is not a full authorization check.

## Admin Access

Admin access is role-based through `User.role === "admin"`.

The first credentialed registered user becomes admin. Later users default to `user`.

Admin pages call `requireAdminUser()` and redirect non-admin users to `/dashboard`.

## Known Gaps

- No password reset flow yet.
- No email verification flow yet.
- No rate limiting or bot protection yet.
- No session management UI yet.
- No audit log yet.
