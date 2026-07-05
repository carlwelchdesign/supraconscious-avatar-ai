# Container And Kubernetes Readiness

Vercel remains the current production deployment. This Docker setup gives the project a cloud-neutral runtime path for local parity, staging experiments, and future non-Vercel deployment.

## Local Container Commands

Start by copying `.env.example` to `.env` and replacing the placeholder secrets/API keys you intend to test. The Compose defaults can boot Postgres locally, but real AI, email, billing, founder handoff, and ChatGPT/MCP flows need the matching runtime values set.

Build individual images:

```bash
yarn docker:build:web
yarn docker:build:admin
yarn docker:build:chatgpt
```

Prepare the local Compose database schema explicitly:

```bash
yarn docker:compose:migrate
```

For local-only schema experiments that intentionally use Prisma `db push`, run `yarn docker:compose:db-push`. Shared development, staging-like Compose runs, and production releases should use migrations.

Run the local container stack:

```bash
yarn docker:compose:up
```

Stop the stack:

```bash
yarn docker:compose:down
```

The Compose stack exposes:

- Web app: `http://localhost:3000`
- Admin app: `http://localhost:3001`
- ChatGPT/MCP app health: `http://localhost:3002/health`
- Postgres: `localhost:5433`

Health endpoints:

- Web readiness: `http://localhost:3000/api/health` checks Postgres and returns `503` if the database is unavailable.
- Admin readiness: `http://localhost:3001/api/health` checks Postgres and returns `503` if the database is unavailable.
- Admin browser health page: `http://localhost:3001/health`
- ChatGPT/MCP liveness: `http://localhost:3002/health`

Compose also defines container healthchecks for web, admin, and ChatGPT/MCP using those endpoints. Web and admin only become healthy after their database readiness checks pass.

## Runtime Environment

Containers read configuration from Compose environment variables or the deployment platform. `.env` files are ignored by Docker and are not copied into images.

The local `sources/` corpus is also excluded from Docker build context. Import or register source material before building images, and rely on reviewed database records at runtime rather than copying manuscripts into containers.

Expected runtime values:

- `DATABASE_URL`
- `AUTH_SECRET`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL`
- `INNER_AVATAR_WEB_URL`
- `NEXT_PUBLIC_ADMIN_URL`
- `CHATGPT_APP_API_TOKEN` for hosted ChatGPT/MCP tool execution
- `SUPER_ADMIN_EMAILS` before first admin login
- `RESEND_API_KEY` and `AUTH_EMAIL_FROM` for email verification and password reset delivery
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` for managed auth bot protection

Stripe variables are optional only while billing is intentionally disabled. Before testing or enabling paid plans, configure `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_STARTER_PRICE_ID`, `STRIPE_PRO_PRICE_ID`, and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` for the web app. Admin needs `STRIPE_SECRET_KEY` to inspect or clean up subscription/customer state.

Founder calibration handoff links depend on `INNER_AVATAR_WEB_URL` and `NEXT_PUBLIC_ADMIN_URL`; set both to real public origins in staging or production so copied launch packets do not point at localhost.

The ChatGPT/MCP container also uses `INNER_AVATAR_WEB_URL` / `NEXT_PUBLIC_APP_URL` for widget redirects and CORS. It listens on `CHATGPT_APP_PORT` when set, otherwise on the platform-provided `PORT`, and finally defaults to `3002`. Set `CHATGPT_APP_API_TOKEN` in hosted, staging, and production environments so MCP tool execution requires a bearer token; `/health` and tool metadata can remain public.

Migrations are not run automatically when web, admin, or ChatGPT containers boot. Local Compose uses the explicit `db-migrate` setup service by default. Production schema changes should remain a controlled release step.

## Container Shape

The web and admin apps use Next.js standalone output so runtime images do not need the full monorepo source. They are designed as stateless app instances: session and application state live in Postgres, which makes horizontal scaling viable once database connection limits are handled.

The ChatGPT/MCP image uses the pinned Yarn 4 launcher with the same immutable install path as CI and Vercel.

## Future Kubernetes Shape

Do not add Kubernetes manifests until there is real traffic or an explicit infrastructure target. When that time comes, use this shape:

- Separate Kubernetes Deployments for `web`, `admin`, and `chatgpt-app`.
- Managed Postgres for production, not in-cluster Postgres.
- Kubernetes Secrets for `DATABASE_URL`, `AUTH_SECRET`, `OPENAI_API_KEY`, `CHATGPT_APP_API_TOKEN`, Stripe values, and admin configuration.
- Ingress routes for public web, admin, and ChatGPT/MCP hostnames.
- Readiness and liveness probes:
  - Web readiness: `/api/health`
  - Admin readiness: `/api/health`
  - ChatGPT/MCP liveness: `/health`
- HorizontalPodAutoscaler for `web` and `chatgpt-app` first.
- Conservative admin scaling unless review traffic grows.
- Database connection pooling before high replica counts. Use a managed pooler or PgBouncer so autoscaling does not exhaust Postgres connections.

## Scaling Notes

The first scaling pressure is likely web traffic and AI/MCP request volume, not admin traffic. Scale `web` and `chatgpt-app` independently. Keep admin access restricted and operationally boring.

If RAG or longer-running AI orchestration becomes heavier, consider moving generation jobs to a queue-backed worker before increasing web request timeouts.
