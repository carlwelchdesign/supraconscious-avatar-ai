# Supraconscious

Supraconscious is a Maria-grounded guided journaling SaaS centered on Inner Council reflection. A user writes or dictates an entry, the app runs safety checks, reflects through bounded council voices, synthesizes one guide question, and invites one embodied micro-shift.

The product is reflective journaling. It is not Maria, not therapy, not diagnosis, not treatment, and not crisis monitoring.

## Workspace

- `apps/web`: public journaling SaaS, auth pages, journal flow, voice APIs, and user settings.
- `apps/admin`: separate internal admin application with its own login, session cookie, URL, and deployment.
- `apps/chatgpt-app`: Express-based ChatGPT/MCP server, Inner Council MCP tool, compatibility tools, and embeddable widget.
- `packages/db`: Prisma schema, generated client access, and shared database utilities.
- `packages/auth`: first-party email/password auth, scoped sessions, and RBAC guards.
- `packages/ai`: OpenAI schemas, safety checks, Inner Council orchestration, source provenance, prompts, pattern memory, founder calibration reports, and progression logic.
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
yarn dev:founder-calibration
yarn typecheck
yarn lint
yarn verify:founder-calibration-code
yarn build:web
yarn build:admin
yarn docker:build:web
yarn docker:build:admin
yarn docker:build:chatgpt
```

## Deployment

Deploy two Vercel projects:

- Web project root directory: `apps/web`
- Admin project root directory: `apps/admin`

Each app has its own `.env.example` and app-level `vercel.json`. Shared packages are imported through workspaces and are not deployed as standalone services.

CI validates Prisma, typecheck, lint, AI/RAG/pilot/founder checks, app builds, and Docker image builds on pull requests.

## Current Launch Path

The repo-side launch path is founder calibration with Carl and Maria. The code and operations surfaces are ready for that flow, but the live launch gate intentionally remains blocked until real founder evidence exists.

Use:

```bash
yarn verify:founder-calibration-code
yarn packet:founder-calibration --web-url http://localhost:3000 --admin-url http://localhost:3001
yarn check:founder-calibration-launch
```

In admin, use `/calibration/setup` for the copyable launch packet, `/calibration/live` for review, and `/health` for runtime configuration and launch-gate status.

Docker and Compose are available for portable runtime testing. The local `sources/` corpus and environment files are excluded from Docker image context; source material should be imported into reviewed database records before building images.

## Runtime Shape

- Web app: `apps/web`, usually `http://localhost:3000`.
- Admin app: `apps/admin`, usually `http://localhost:3001`.
- ChatGPT/MCP app: `apps/chatgpt-app`, usually `http://localhost:3002`.
- Database: PostgreSQL through Prisma.
- Deployment today: Vercel for web/admin.
- Portable path: Docker images and Docker Compose for web, admin, ChatGPT/MCP, and local Postgres testing.
- Future scaling path: Kubernetes-ready stateless web/admin/MCP containers with managed Postgres and connection pooling.

## Documentation

Start with [docs/README.md](docs/README.md).
