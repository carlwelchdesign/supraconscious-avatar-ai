# Local Setup and Deployment

## Requirements

- Node.js compatible with Next.js 16 and Prisma 7.
- Yarn 4 using `nodeLinker: node-modules`.
- PostgreSQL database URL.
- OpenAI API key for real AI, transcription, and speech behavior.

## Environment Variables

Web app (`apps/web/.env.example`):

```bash
# Local development can use sslmode=disable. Production managed Postgres should use sslmode=verify-full.
DATABASE_URL="postgres://user:password@localhost:5432/inner_avatar?sslmode=disable"
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-5-mini"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
INNER_AVATAR_WEB_URL="http://localhost:3000"
NEXT_PUBLIC_ADMIN_URL="http://localhost:3001"
APP_TIME_ZONE="America/Los_Angeles"
RESEND_API_KEY=""
AUTH_EMAIL_FROM="Supraconscious <no-reply@example.com>"
NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
TURNSTILE_SECRET_KEY=""
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_STARTER_PRICE_ID="price_..."
STRIPE_PRO_PRICE_ID="price_..."
```

Admin app (`apps/admin/.env.example`):

```bash
# Local development can use sslmode=disable. Production managed Postgres should use sslmode=verify-full.
DATABASE_URL="postgres://user:password@localhost:5432/inner_avatar?sslmode=disable"
AUTH_SECRET="replace-with-a-long-random-secret"
SUPER_ADMIN_EMAILS="you@example.com"
NEXT_PUBLIC_ADMIN_URL="http://localhost:3001"
INNER_AVATAR_WEB_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
OPENAI_API_KEY="sk-..."
NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
TURNSTILE_SECRET_KEY=""
STRIPE_SECRET_KEY="sk_test_..."
```

`SUPER_ADMIN_EMAILS` is a comma-separated allowlist. Matching emails are promoted to `super_admin` during registration or login.

`RESEND_API_KEY` and `AUTH_EMAIL_FROM` enable email-delivered account verification and password reset links. Leave them blank for local development if you want to rely on manual super-admin verification and temporary password resets.

`NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` enable Cloudflare Turnstile on registration, login, email verification, and password reset forms. Leave them both blank for local development. Do not configure only the public site key: the server treats that as a misconfigured challenge and rejects auth submissions until the matching secret is set.

Production environment checklist:

| Variable | Web | Admin | ChatGPT/MCP | Notes |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Required | Required | Required | Use the production Postgres URL; use `sslmode=verify-full` when TLS is required, and run schema changes as a controlled release step. |
| `PRISMA_QUERY_LOGGING` | Optional | Optional | Optional | Set to `true` only for short local debugging. Leave off for founder testing and production so raw query parameters stay out of logs. |
| `AUTH_SECRET` | Required | Required | Required | Use the same long random value anywhere session/auth helpers run. |
| `SUPER_ADMIN_EMAILS` | Required | Required | Optional | Required before the first admin login. |
| `OPENAI_API_KEY` | Required | Recommended | Recommended | Missing keys fall back locally, but production AI/voice needs this. |
| `OPENAI_MODEL` | Optional | Optional | Optional | Defaults to `gpt-5-mini`. |
| `NEXT_PUBLIC_APP_URL` | Required | Required | Required | Public web origin. |
| `INNER_AVATAR_WEB_URL` | Required | Required | Required | Public web origin for founder handoff links, auth verification/reset emails, ChatGPT widget redirects, and CORS. |
| `NEXT_PUBLIC_ADMIN_URL` | Required | Required | Required | Used for admin review links. |
| `APP_TIME_ZONE` | Recommended | No | No | IANA timezone used by the web app for daily journal curriculum selection and "today" labels. Defaults to `America/Los_Angeles`. |
| `RESEND_API_KEY` | Required for production auth email | Optional | No | Enables verification and password reset delivery. |
| `AUTH_EMAIL_FROM` | Required with Resend | Optional | No | Must be an approved sender domain/address. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Recommended | Recommended | No | Enables visible Turnstile widgets. |
| `TURNSTILE_SECRET_KEY` | Recommended | Recommended | No | Enforces Turnstile server-side when configured. |
| `STRIPE_SECRET_KEY` | Required for billing | Required for subscription admin | Optional | Billing can stay disabled during founder calibration. |
| `STRIPE_WEBHOOK_SECRET` | Required for billing | No | No | Set to the webhook secret for the web deployment. |
| `STRIPE_STARTER_PRICE_ID` / `STRIPE_PRO_PRICE_ID` | Required for billing | No | No | Needed before enabling paid plans. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Required for billing UI | No | No | Public Stripe key for the web app. |
| `CHATGPT_APP_PORT` / `PORT` | No | No | Optional | Defaults to `3002`; hosted runtimes may set `PORT`, while local scripts can use `CHATGPT_APP_PORT`. |
| `CHATGPT_APP_API_TOKEN` | No | No | Required for hosted tool execution | Long random bearer token. `/health` and MCP tool metadata stay public, but tool execution requires this token when configured. |

For local/dev scripts, the root `.env.example` includes additional helper variables for founder setup, pilot seeding, RAG smoke tests, and handoff packet generation.

## Install and Run

```bash
node .yarn/releases/yarn-4.cjs install --immutable
node .yarn/releases/yarn-4.cjs db:generate
node .yarn/releases/yarn-4.cjs dev:web
node .yarn/releases/yarn-4.cjs dev:admin
```

Do not use ambient Yarn 1 for installation. This workspace uses `workspace:*` dependencies and the repository-pinned Yarn 4 launcher avoids registry lookup failures for internal packages.

The web app runs on port `3000`. The admin app runs on port `3001`.

If a local port is already occupied and Next.js starts the web app on another port, update `INNER_AVATAR_WEB_URL` to the actual web URL. The admin founder-calibration setup page uses this value for copyable Carl/Maria handoff links.

If the admin app runs somewhere other than `http://localhost:3001`, update `NEXT_PUBLIC_ADMIN_URL` in the web app environment. The web founder-calibration dashboard uses this value for admin review shortcuts.

## Database Setup

For local schema sync against disposable development data:

```bash
node .yarn/releases/yarn-4.cjs db:generate
node .yarn/releases/yarn-4.cjs db:push
```

For CI, staging, production, or any shared database, apply checked-in migrations instead:

```bash
node .yarn/releases/yarn-4.cjs db:generate
node .yarn/releases/yarn-4.cjs db:migrate:deploy
```

Use destructive Prisma flags only when intentionally dropping or replacing data.

## Verification

Run:

```bash
node .yarn/releases/yarn-4.cjs lint
node .yarn/releases/yarn-4.cjs typecheck
node .yarn/releases/yarn-4.cjs build:web
node .yarn/releases/yarn-4.cjs build:admin
```

For the founder calibration code path, run the full verifier:

```bash
node .yarn/releases/yarn-4.cjs verify:founder-calibration-code
```

This checks Prisma generation, auth tests, web API-policy tests, AI tests, RAG and pilot evals, founder calibration fixtures/regression, founder reports, web/admin/ChatGPT typechecks and builds, and ChatGPT app tests. It proves the code path is ready.

Before asking Carl and Maria to start live sessions, print the current launch packet:

```bash
node .yarn/releases/yarn-4.cjs packet:founder-calibration --web-url http://localhost:3000 --admin-url http://localhost:3001
```

Founder reports are operational visibility. A feedback type is enough to keep Carl/Maria calibration moving; notes and ready/golden reviews are useful only when they capture a specific tuning detail or strong example.

To build and test the ChatGPT MCP server package locally:

```bash
node .yarn/releases/yarn-4.cjs --cwd apps/chatgpt-app build
node .yarn/releases/yarn-4.cjs --cwd apps/chatgpt-app test
```

The current preferred MCP tool is `run_inner_council_reflection`; it uses the same Inner Council service as the web journal. The older analysis/avatar/prompt tools remain available for compatibility.

Useful route smoke checks:

```bash
curl -I http://localhost:3000/login
curl -I http://localhost:3000/register
curl -I http://localhost:3000/journal
curl -I http://localhost:3001/login
curl -I http://localhost:3001/users
```

Without a session, web product routes should redirect to web `/login`. Admin routes should redirect to admin `/login`.

## Vercel Deployment

The current production deployment uses the repository root `vercel.json` for the web app. That file:

- installs dependencies with the bundled Yarn 4 launcher
- builds `apps/web`
- points Vercel at `apps/web/.next`

This is the safest default for Vercel because Vercel build machines may default to Yarn v1, which cannot resolve the repo's `workspace:*` dependencies.

For the current root project, use:

```bash
Install Command: node .yarn/releases/yarn-4.cjs install --immutable
Build Command: node .yarn/releases/yarn-4.cjs --cwd apps/web build
Output Directory: apps/web/.next
```

You may later split admin into a separate Vercel project. If you do, either:

- set the admin project root directory to `apps/admin` and use `apps/admin/vercel.json`, or
- keep the root directory at the repository root and use `node .yarn/releases/yarn-4.cjs --cwd apps/admin build` with output directory `apps/admin/.next`.

Keep web and admin domains, environment variables, and cookies separate.

## Docker And Compose

The repository includes production Dockerfiles for web, admin, and ChatGPT/MCP plus a local Compose stack with Postgres. Vercel remains the current production path, but Docker gives the project a portable runtime for staging experiments or future non-Vercel deployment.

```bash
cp .env.example .env
node .yarn/releases/yarn-4.cjs docker:build:web
node .yarn/releases/yarn-4.cjs docker:build:admin
node .yarn/releases/yarn-4.cjs docker:build:chatgpt
node .yarn/releases/yarn-4.cjs docker:compose:migrate
node .yarn/releases/yarn-4.cjs docker:compose:up
```

Compose exposes:

- Web: `http://localhost:3000`
- Admin: `http://localhost:3001`
- ChatGPT/MCP health: `http://localhost:3002/health`
- Postgres: `localhost:5433`

Migrations are intentionally explicit. Web, admin, and ChatGPT containers do not run migrations automatically at boot.

See [Container and Kubernetes Readiness](container-and-kubernetes.md) for the full runtime environment and future Kubernetes scaling model.

### Docker / GitHub Actions (ChatGPT MCP App)

The repository also keeps a focused CI workflow for the ChatGPT MCP app image.

CI notes:

- The workflow runs `node .yarn/releases/yarn-4.cjs --cwd apps/chatgpt-app build` and `node .yarn/releases/yarn-4.cjs --cwd apps/chatgpt-app test` before building the Docker image.

Vercel notes:

- The root `vercel.json` is configured for the web app project. It installs with the bundled Yarn 4 launcher, builds `apps/web`, and tells Vercel to read the Next.js output from `apps/web/.next`.
- `apps/web/vercel.json` and `apps/admin/vercel.json` support optional Vercel projects whose root directory is set to the app folder. They `cd` back to the monorepo root for install/build and use `.next` as the app-relative output directory.
- Vercel's build machines may default to Yarn v1 which cannot resolve `workspace:*` protocol. Do not use ambient `yarn install`; call `node .yarn/releases/yarn-4.cjs install --immutable`.
- `bash ./scripts/vercel-build.sh` is a broad helper that builds web, admin, and ChatGPT/MCP. Use it only for an intentional all-app build, not for the default web-only Vercel project.

The repository intentionally does not use an install lifecycle hook to invoke Yarn from inside Yarn; Vercel should call the bundled launcher explicitly through the install/build commands above.

Set production database schema before using the apps:

```bash
node .yarn/releases/yarn-4.cjs db:generate
node .yarn/releases/yarn-4.cjs db:migrate:deploy
```

Configure the Stripe webhook endpoint for the web deployment:

```text
POST https://your-web-domain.com/api/billing/webhook
```

Subscribe to these events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Security Notes

- Do not commit `.env`; it is ignored.
- Web and admin use different HTTP-only cookies.
- Session tokens are stored hashed in the database.
- Passwords are hashed with bcrypt.
- Admin access is denied by default unless the user has `admin` or `super_admin`.
- The app has server-side auth throttling, honeypot protection, and optional Cloudflare Turnstile protection for registration, login, email verification, and password reset requests. Super-admins can manually mark known user emails verified from admin `/users`.
