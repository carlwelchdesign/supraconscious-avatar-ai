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

- Dockerfile: `apps/chatgpt-app/Dockerfile` (multi-stage build: install deps → build → runtime)
- GitHub Actions workflow: `.github/workflows/chatgpt-app-deploy.yml`

Build and run locally:

```bash
docker build -f apps/chatgpt-app/Dockerfile -t inner-avatar-chatgpt-app:latest .
docker run -p 3002:3002 inner-avatar-chatgpt-app:latest
```

CI notes:

- The workflow runs `yarn --cwd apps/chatgpt-app build` and `yarn --cwd apps/chatgpt-app test` before building the Docker image.
- To publish the Docker image to GitHub Container Registry, set `GHCR_PAT` in repository secrets.


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
