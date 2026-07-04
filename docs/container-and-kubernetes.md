# Container And Kubernetes Readiness

Vercel remains the current production deployment. This Docker setup gives the project a cloud-neutral runtime path for local parity, staging experiments, and future non-Vercel deployment.

## Local Container Commands

Build individual images:

```bash
yarn docker:build:web
yarn docker:build:admin
yarn docker:build:chatgpt
```

Prepare the local Compose database schema explicitly:

```bash
docker compose --profile setup run --rm db-push
```

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

- Web: `http://localhost:3000/api/health`
- Admin readiness: `http://localhost:3001/api/health`
- Admin browser health page: `http://localhost:3001/health`
- ChatGPT/MCP: `http://localhost:3002/health`

## Runtime Environment

Containers read configuration from Compose environment variables or the deployment platform. `.env` files are ignored by Docker and are not copied into images.

Expected runtime values:

- `DATABASE_URL`
- `AUTH_SECRET`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL`
- `INNER_AVATAR_WEB_URL`
- `NEXT_PUBLIC_ADMIN_URL`
- `RESEND_API_KEY` and `AUTH_EMAIL_FROM` for email verification and password reset delivery
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` for managed auth bot protection

Stripe variables are optional unless billing flows are being tested.

Migrations are not run automatically when web, admin, or ChatGPT containers boot. Local Compose uses the explicit `db-push` setup service. Production schema changes should remain a controlled release step.

## Container Shape

The web and admin apps use Next.js standalone output so runtime images do not need the full monorepo source. They are designed as stateless app instances: session and application state live in Postgres, which makes horizontal scaling viable once database connection limits are handled.

The ChatGPT/MCP image uses the pinned Yarn 4 launcher with the same immutable install path as CI and Vercel.

## Future Kubernetes Shape

Do not add Kubernetes manifests until there is real traffic or an explicit infrastructure target. When that time comes, use this shape:

- Separate Kubernetes Deployments for `web`, `admin`, and `chatgpt-app`.
- Managed Postgres for production, not in-cluster Postgres.
- Kubernetes Secrets for `DATABASE_URL`, `AUTH_SECRET`, `OPENAI_API_KEY`, Stripe values, and admin configuration.
- Ingress routes for public web, admin, and ChatGPT/MCP hostnames.
- Readiness and liveness probes:
  - Web: `/api/health`
  - Admin: `/api/health`
  - ChatGPT/MCP: `/health`
- HorizontalPodAutoscaler for `web` and `chatgpt-app` first.
- Conservative admin scaling unless review traffic grows.
- Database connection pooling before high replica counts. Use a managed pooler or PgBouncer so autoscaling does not exhaust Postgres connections.

## Scaling Notes

The first scaling pressure is likely web traffic and AI/MCP request volume, not admin traffic. Scale `web` and `chatgpt-app` independently. Keep admin access restricted and operationally boring.

If RAG or longer-running AI orchestration becomes heavier, consider moving generation jobs to a queue-backed worker before increasing web request timeouts.
