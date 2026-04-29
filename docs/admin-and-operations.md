# Admin and Operations

## Admin Dashboard

Admin pages live under `/admin` and require `User.role === "admin"`.

Current pages:

- `/admin`: high-level counts and links.
- `/admin/users`: recent users, roles, entry counts, session counts.
- `/admin/subscriptions`: subscription rows and linked user identities.
- `/admin/analytics`: counts for users, entries, analyses, safety events, and tracked patterns.
- `/admin/prompts`: recent generated prompts.

The first credentialed registered user becomes admin. Later users default to `user`.

## Subscriptions

The `Subscription` model is Stripe-ready but Stripe is not fully wired yet.

Stored fields include:

- Stripe customer ID
- Stripe subscription ID
- Stripe price ID
- plan
- status
- current period start/end

Future Stripe work should add checkout, billing portal, webhook verification, subscription upsert logic, and admin visibility into webhook failures.

## Prompt Management

The current prompt admin page lists recently generated prompts. It does not yet support editing system prompts, versioning prompt templates, approving generated prompts, or disabling patterns.

The generation logic currently lives in code under `src/lib/ai`.

## Analytics

Analytics are database counts only. There is no product analytics vendor, event stream, retention cohorting, or funnel tracking yet.

Current counters:

- users
- journal entries
- analyses
- safety events
- tracked patterns

## Operational Checks

Before deploy:

```bash
npm run lint
npm run build
npx prisma validate
```

After deploy:

- visit `/login`
- register the first admin account if needed
- confirm `/dashboard` loads after login
- confirm `/journal` redirects to `/login` when signed out
- confirm `/admin` redirects non-admin users to `/dashboard`
- submit a low-risk journal entry
- confirm `JournalEntry`, `EntryAnalysis`, `AvatarResponse`, and `GeneratedPrompt` rows are created

## Incident Notes

If login throws database errors about missing columns, regenerate the Prisma client and push the schema to the active database:

```bash
npx prisma generate
npx prisma db push
```

If production is using a different database than local development, run the schema update against the production `DATABASE_URL`.
