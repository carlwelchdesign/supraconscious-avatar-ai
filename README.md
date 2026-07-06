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
node .yarn/releases/yarn-4.cjs install --immutable
node .yarn/releases/yarn-4.cjs db:generate
node .yarn/releases/yarn-4.cjs dev:web
node .yarn/releases/yarn-4.cjs dev:admin
node .yarn/releases/yarn-4.cjs dev:founder-calibration
node .yarn/releases/yarn-4.cjs typecheck
node .yarn/releases/yarn-4.cjs lint
node .yarn/releases/yarn-4.cjs verify:founder-calibration-code
node .yarn/releases/yarn-4.cjs build:web
node .yarn/releases/yarn-4.cjs build:admin
node .yarn/releases/yarn-4.cjs docker:build:web
node .yarn/releases/yarn-4.cjs docker:build:admin
node .yarn/releases/yarn-4.cjs docker:build:chatgpt
```

## Deployment

The current Vercel deployment uses the root `vercel.json` with the pinned Yarn 4 launcher and builds the web app from `apps/web`.

Do not use ambient Yarn 1 for installs. This monorepo uses `workspace:*` dependencies and should be installed with the bundled Yarn 4 launcher or a Corepack-managed Yarn 4 runtime.

If you split admin into its own Vercel project later, keep the install command on the repository Yarn launcher:

```bash
node .yarn/releases/yarn-4.cjs install --immutable
```

Shared packages are imported through workspaces and are not deployed as standalone services.

CI validates Prisma, typecheck, lint, auth/web/AI/RAG/pilot/founder checks, app builds, and Docker image builds on pull requests.

## Current Launch Path

The repo-side launch path is founder calibration with Carl and Maria. The code and operations surfaces are ready for that flow, but the live launch gate intentionally remains blocked until real founder evidence exists.

Use:

```bash
node .yarn/releases/yarn-4.cjs verify:founder-calibration-code
node .yarn/releases/yarn-4.cjs packet:founder-calibration --web-url http://localhost:3000 --admin-url http://localhost:3001
node .yarn/releases/yarn-4.cjs check:founder-calibration-launch
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
