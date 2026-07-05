# Local Setup and Deployment

## Requirements

- Node.js compatible with Next.js 16 and Prisma 7.
- Yarn 4 using `nodeLinker: node-modules`.
- PostgreSQL database URL.
- OpenAI API key for real AI, transcription, and speech behavior.

## Environment Variables

Web app (`apps/web/.env.example`):

```bash
DATABASE_URL="postgres://..."
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-5-mini"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
INNER_AVATAR_WEB_URL="http://localhost:3000"
NEXT_PUBLIC_ADMIN_URL="http://localhost:3001"
RESEND_API_KEY=""
AUTH_EMAIL_FROM="Inner Avatar <no-reply@example.com>"
NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
TURNSTILE_SECRET_KEY=""
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_STARTER_PRICE_ID="price_..."
STRIPE_PRO_PRICE_ID="price_..."
```

Admin app (`apps/admin/.env.example`):

```bash
DATABASE_URL="postgres://..."
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

`NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` enable Cloudflare Turnstile on registration, login, email verification, and password reset forms. Leave them blank for local development.

Production environment checklist:

| Variable | Web | Admin | ChatGPT/MCP | Notes |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Required | Required | Required | Use the production Postgres URL; run schema changes as a controlled release step. |
| `AUTH_SECRET` | Required | Required | Required | Use the same long random value anywhere session/auth helpers run. |
| `SUPER_ADMIN_EMAILS` | Required | Required | Optional | Required before the first admin login. |
| `OPENAI_API_KEY` | Required | Recommended | Recommended | Missing keys fall back locally, but production AI/voice needs this. |
| `OPENAI_MODEL` | Optional | Optional | Optional | Defaults to `gpt-5-mini`. |
| `NEXT_PUBLIC_APP_URL` | Required | Required | Required | Public web origin. |
| `INNER_AVATAR_WEB_URL` | Required | Required | Required | Used for safe founder handoff links back to the web app. |
| `NEXT_PUBLIC_ADMIN_URL` | Required | Required | Required | Used for admin review links. |
| `RESEND_API_KEY` | Required for production auth email | Optional | No | Enables verification and password reset delivery. |
| `AUTH_EMAIL_FROM` | Required with Resend | Optional | No | Must be an approved sender domain/address. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Recommended | Recommended | No | Enables visible Turnstile widgets. |
| `TURNSTILE_SECRET_KEY` | Recommended | Recommended | No | Enforces Turnstile server-side when configured. |
| `STRIPE_SECRET_KEY` | Required for billing | Required for subscription admin | Optional | Billing can stay disabled during founder calibration. |
| `STRIPE_WEBHOOK_SECRET` | Required for billing | No | No | Set to the webhook secret for the web deployment. |
| `STRIPE_STARTER_PRICE_ID` / `STRIPE_PRO_PRICE_ID` | Required for billing | No | No | Needed before enabling paid plans. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Required for billing UI | No | No | Public Stripe key for the web app. |
| `CHATGPT_APP_PORT` / `PORT` | No | No | Optional | Defaults to `3002`; hosted runtimes may set `PORT`, while local scripts can use `CHATGPT_APP_PORT`. |

For local/dev scripts, the root `.env.example` includes additional helper variables for founder setup, pilot seeding, RAG smoke tests, and handoff packet generation.

## Install and Run

```bash
yarn install
yarn db:generate
yarn dev:web
yarn dev:admin
```

The web app runs on port `3000`. The admin app runs on port `3001`.

If a local port is already occupied and Next.js starts the web app on another port, update `INNER_AVATAR_WEB_URL` to the actual web URL. The admin founder-calibration setup page uses this value for copyable Carl/Maria handoff links.

If the admin app runs somewhere other than `http://localhost:3001`, update `NEXT_PUBLIC_ADMIN_URL` in the web app environment. The web founder-calibration dashboard uses this value for admin review shortcuts.

## Database Setup

For local schema sync:

```bash
yarn db:generate
yarn db:push
```

Use destructive Prisma flags only when intentionally dropping or replacing data.

## Verification

Run:

```bash
yarn lint
yarn typecheck
yarn build:web
yarn build:admin
```

For the founder calibration code path, run the full verifier:

```bash
yarn verify:founder-calibration-code
```

This checks Prisma generation, auth tests, AI tests, RAG and pilot evals, founder calibration fixtures/regression, founder reports, web/admin/ChatGPT typechecks and builds, and ChatGPT app tests. It proves the code path is ready.

Before asking Carl and Maria to start live sessions, print the current launch packet:

```bash
yarn packet:founder-calibration --web-url http://localhost:3000 --admin-url http://localhost:3001
```

Founder reports are operational visibility. Feedback notes and ready/golden reviews are useful calibration evidence, not blockers for continued app development.

To build and test the ChatGPT MCP server package locally:

```bash
yarn --cwd apps/chatgpt-app build
yarn --cwd apps/chatgpt-app test
```

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

Create two Vercel projects:

- Web project root directory: `apps/web`.
- Admin project root directory: `apps/admin`.

Use the same repository but separate project settings, domains, and environment variables. Each app root has its own `vercel.json` that runs the repository-pinned Yarn 4 launcher from the monorepo root, so workspace packages resolve correctly.

Recommended build commands:

```bash
yarn build:web
yarn build:admin
```

### Docker / GitHub Actions (ChatGPT MCP App)

The repository includes a Dockerfile and CI workflow for the ChatGPT MCP App:


Build and run locally:

```bash
docker build -f apps/chatgpt-app/Dockerfile -t inner-avatar-chatgpt-app:latest .
docker run -p 3002:3002 inner-avatar-chatgpt-app:latest
```

CI notes:

- The workflow runs `node .yarn/releases/yarn-4.cjs --cwd apps/chatgpt-app build` and `node .yarn/releases/yarn-4.cjs --cwd apps/chatgpt-app test` before building the Docker image.

Vercel notes:

- The root `vercel.json` is configured for the web app project. It installs with the bundled Yarn 4 launcher, builds `apps/web`, and tells Vercel to read the Next.js output from `apps/web/.next`.
- `apps/web/vercel.json` and `apps/admin/vercel.json` support Vercel projects whose root directory is set to the app folder. They `cd` back to the monorepo root for install/build and use `.next` as the app-relative output directory.
- Vercel's build machines may default to Yarn v1 which cannot resolve `workspace:*` protocol. To ensure builds succeed you can either:
  - Set the Vercel Project "Install Command" to `yarn vercel:install` and the "Build Command" to `node .yarn/releases/yarn-4.cjs --cwd apps/web build` (adjust per project), or
  - Use the repository helper script by setting Vercel's Build Command to: `bash ./scripts/vercel-build.sh`.

The repository intentionally does not use an install lifecycle hook to invoke Yarn from inside Yarn; Vercel should call the bundled launcher explicitly through the install/build commands above.

Set production database schema before using the apps:

```bash
yarn db:generate
yarn db:push
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
