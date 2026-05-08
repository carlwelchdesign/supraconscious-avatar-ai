# Admin and Operations

## Separate Admin App

The admin panel lives in `apps/admin` and deploys separately from `apps/web`.

There are no `/admin` routes inside the public web app. Admin functionality is not bundled into the user-facing deployment.

Current admin routes:

- `/`: high-level counts and system links.
- `/users`: users, roles, account dates, entry counts.
- `/subscriptions`: subscription state and billing metadata.
- `/safety`: safety events and flagged entry metadata.
- `/health`: database and runtime configuration checks.
- `/prompts`: prompt template create/list/edit.
- `/avatar-stages`: editable Avatar stage metadata.
- `/feature-flags`: feature flag create/list/update.
- `/ai-quality`: metadata-only AI output review.

## Access Control

Admin access uses a separate session scope:

- web cookie: `ia_web_session`
- admin cookie: `ia_admin_session`

Only users with `admin` or `super_admin` may create an admin session. `SUPER_ADMIN_EMAILS` bootstraps `super_admin` access at registration/login.

Every admin page or server action must call `requireAdminUser()` or `requireSuperAdminUser()` server-side. Client-side role checks are never enough.

## Privacy and Audit Logging

Admin list views are metadata-first and should not show raw journal content.

The safety page can reveal raw journal text only through `revealFlaggedEntryAction()`, which requires:

- a signed-in admin session
- a safety event ID
- an explicit reason
- a server-side authorization check
- an `AuditLog` row with actor, action, target, reason, metadata, IP, user agent, and timestamp

Use raw reveal only for support, moderation, or safety review.

## Subscriptions

The web app starts Stripe Checkout from `/pricing`, opens Stripe Billing Portal from `/settings`, and syncs subscription state through `POST /api/billing/webhook`.

Stored fields include Stripe customer ID, subscription ID, price ID, plan, status, and current period dates. Admin `/subscriptions` shows a searchable metadata table.

Required web env vars:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_STARTER_PRICE_ID`
- `STRIPE_PRO_PRICE_ID`

## Prompt Management

Prompt template records live in `PromptTemplate`. Admin changes write audit logs. The AI package still contains core hardcoded prompt logic; template-driven runtime prompt selection can be layered in later.

## Operational Checks

Before deploy:

```bash
yarn lint
yarn typecheck
yarn build:web
yarn build:admin
```

After deploy:

- visit web `/login`
- register or login with an allowlisted `SUPER_ADMIN_EMAILS` account
- visit admin `/login`
- confirm normal `user` accounts cannot access admin routes
- confirm `/safety` does not show raw journal content in list views
- reveal a flagged entry with a reason and confirm an `AuditLog` row is created

## Incident Notes

If login throws database errors about missing columns, regenerate the Prisma client and push the schema to the active database:

```bash
yarn db:generate
yarn db:push
```

If production uses a different database than local development, run the schema update against the production `DATABASE_URL`.
