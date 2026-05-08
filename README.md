# Inner Avatar AI

Inner Avatar is a guided AI journaling SaaS built as a Yarn workspaces + Turborepo monorepo.

## Workspace

- `apps/web`: public journaling SaaS, auth pages, journal flow, voice APIs, and user settings.
- `apps/admin`: separate internal admin application with its own login, session cookie, URL, and deployment.
- `packages/db`: Prisma schema, generated client access, and shared database utilities.
- `packages/auth`: first-party email/password auth, scoped sessions, and RBAC guards.
- `packages/ai`: OpenAI schemas, safety checks, analysis, Avatar responses, prompts, pattern memory, and progression logic.
- `packages/billing`: Stripe Checkout, Billing Portal, and webhook subscription sync helpers.
- `packages/ui`: shared UI primitives.
- `packages/types`: shared TypeScript types.
- `packages/config`: shared TypeScript configuration.

## Commands

```bash
yarn install
yarn db:generate
yarn dev:web
yarn dev:admin
yarn typecheck
yarn lint
yarn build:web
yarn build:admin
```

## Deployment

Deploy two Vercel projects:

- Web project root directory: `apps/web`
- Admin project root directory: `apps/admin`

Each app has its own `.env.example`. Shared packages are imported through workspaces and are not deployed as standalone services.

## Documentation

Start with [docs/README.md](docs/README.md).
