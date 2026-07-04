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
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_STARTER_PRICE_ID="price_..."
STRIPE_PRO_PRICE_ID="price_..."
```

Admin app (`apps/admin/.env.example`):

```bash
DATABASE_URL="postgres://..."
SUPER_ADMIN_EMAILS="you@example.com"
NEXT_PUBLIC_ADMIN_URL="http://localhost:3001"
STRIPE_SECRET_KEY="sk_test_..."
```

`SUPER_ADMIN_EMAILS` is a comma-separated allowlist. Matching emails are promoted to `super_admin` during registration or login.

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

This checks Prisma generation, auth tests, AI tests, RAG and pilot evals, founder calibration fixtures/regression, founder reports, web/admin/ChatGPT typechecks and builds, and ChatGPT app tests. It proves the code path is ready; it does not replace the live founder launch gate.

Before asking Carl and Maria to start live sessions, print the current launch packet and confirm the live gate status:

```bash
yarn packet:founder-calibration --web-url http://localhost:3000 --admin-url http://localhost:3001
yarn check:founder-calibration-launch
```

The launch gate should remain blocked until Carl and Maria complete onboarding, consent, first guided sessions, feedback notes, and admin review.

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

Use the same repository but separate project settings, domains, and environment variables. Shared packages are resolved through Yarn workspaces during each app build.

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
- The app currently does not implement email verification, password reset, rate limiting, or bot protection.
