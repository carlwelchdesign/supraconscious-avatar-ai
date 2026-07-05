# ChatGPT MCP App

This document describes the ChatGPT MCP server added in Phase 5 and finalized in Phase 6.

## What it is

- A small Express-based MCP server implemented in `apps/chatgpt-app`.
- Exposes a health endpoint, tools metadata at `/mcp/tools`, and a POST tool-execution route at `/mcp/tools/:toolName`.
- Serves a small static widget from `apps/chatgpt-app/src/widget` at `/widget`.
- Implements seven MCP tools used by the product for journaling and reflection workflows.
- The preferred current tool is `run_inner_council_reflection`, which calls the same Inner Council service as the web journal and returns safety status, council voices, Integrator question, source provenance, generated prompt, and progression.
- The older analysis/avatar/prompt tools remain available as compatibility helpers for clients that have not moved to the full Inner Council flow yet.

## Key files

- `apps/chatgpt-app/src/server.ts` — main Express MCP server and `startChatGptApp` entrypoint.
- `apps/chatgpt-app/src/tools/*` — tool handlers: `run-inner-council-reflection`, `create-journal-entry`, `analyze-journal-entry`, `generate-avatar-reflection`, `generate-personalized-prompt`, `get-recent-patterns`, `save-reflection-session`.
- `apps/chatgpt-app/src/middleware/*` — `auth` and `safety` middleware helpers.
- `apps/chatgpt-app/src/widget/*` — static widget assets (HTML/CSS/JS) served as static files.
- `apps/chatgpt-app/.env.example` — runtime environment template for local and hosted MCP deployments.
- `apps/chatgpt-app/Dockerfile` — multi-stage Docker build for the MCP app.
- `.github/workflows/chatgpt-app-deploy.yml` — CI workflow to install dependencies, build, test, and validate the Docker image build.

## Local dev and build

Run the app locally in development mode (uses `tsx`):

```bash
yarn --cwd apps/chatgpt-app dev
```

To compile TypeScript and produce a production artifact:

```bash
yarn --cwd apps/chatgpt-app build
```

Run the test suite:

```bash
yarn --cwd apps/chatgpt-app test
```

All tests pass locally: 35 passing tests at the time of writing.

## Docker

Build locally (multi-stage):

```bash
docker build -f apps/chatgpt-app/Dockerfile -t inner-avatar-chatgpt-app:latest .
```

Run the container:

```bash
docker run -p 3002:3002 inner-avatar-chatgpt-app:latest
```

Notes:
- The Dockerfile installs workspace dependencies with the pinned Yarn 4 launcher, builds `apps/chatgpt-app` in the `builder` stage, and copies the runtime artifact plus workspace package sources required by Node resolution.
- During build, Yarn 4 workspace resolutions must match the repository lockfile.

## CI / GitHub Actions

The workflow is at `.github/workflows/chatgpt-app-deploy.yml` and does:

- Checkout code
- Setup Node 20
- Install dependencies, build, run tests
- Build Docker image
- The broader `.github/workflows/ci.yml` workflow also builds the web, admin, and ChatGPT Docker images.

If your CI host does not support Corepack, use the repository Yarn launcher:

```bash
node .yarn/releases/yarn-4.cjs install --immutable
node .yarn/releases/yarn-4.cjs --cwd apps/chatgpt-app build
node .yarn/releases/yarn-4.cjs --cwd apps/chatgpt-app test
```

## Runtime configuration

Start from `apps/chatgpt-app/.env.example` for local or hosted configuration. Set `CHATGPT_APP_PORT` to change the server port (default `3002`). Hosted, staging, and production deployments should also set `CHATGPT_APP_API_TOKEN` to a long random bearer token. `/health` and MCP tool metadata remain public, but MCP tool execution requires `Authorization: Bearer <CHATGPT_APP_API_TOKEN>` when the token is configured.

The server expects runtime access to dependent workspace packages (`@inner-avatar/ai`, `@inner-avatar/db`) which are compiled during the workspace build.

## Troubleshooting

- If Docker build fails due to Yarn lockfile/p2p peer issues, run `yarn install` locally to update the lockfile, commit it, and retry the Docker build.
- ESM resolution required explicit `.js` extensions in internal package exports; the workspace packages include `type: "module"` and imports use `.js` extensions for Node16+ resolution.

## Next steps

- Optionally configure a hosted container registry and deployment pipeline when a non-Vercel runtime is needed.
- Add runtime monitoring and liveness/readiness probes as needed.
