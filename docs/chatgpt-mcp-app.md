# ChatGPT MCP App

This document describes the ChatGPT MCP server added in Phase 5 and finalized in Phase 6.

## What it is

- A small Express-based MCP server implemented in `apps/chatgpt-app`.
- Exposes a health endpoint, tools metadata at `/mcp/tools`, and a POST tool-execution route at `/mcp/tools/:toolName`.
- Serves a small static widget from `apps/chatgpt-app/src/widget` at `/widget`.
- Implements six MCP tools used by the product for journaling and reflection workflows.

## Key files

- `apps/chatgpt-app/src/server.ts` — main Express MCP server and `startChatGptApp` entrypoint.
- `apps/chatgpt-app/src/tools/*` — tool handlers: `create-journal-entry`, `analyze-journal-entry`, `generate-avatar-reflection`, `generate-personalized-prompt`, `get-recent-patterns`, `save-reflection-session`.
- `apps/chatgpt-app/src/middleware/*` — `auth` and `safety` middleware helpers.
- `apps/chatgpt-app/src/widget/*` — static widget assets (HTML/CSS/JS) served as static files.
- `apps/chatgpt-app/Dockerfile` — multi-stage Docker build for the MCP app.
- `.github/workflows/chatgpt-app-deploy.yml` — CI workflow to build, test, and push Docker images to GHCR.

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

All tests pass in CI: 19 passing tests at the time of writing.

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
- The Dockerfile installs workspace dependencies then builds `apps/chatgpt-app` in the `builder` stage and copies `dist` to the runtime image.
- During build, Yarn 4 workspace resolutions must match the repository lockfile; CI runs this workflow and publishes to GHCR when `GHCR_PAT` is configured.

## CI / GitHub Actions

The workflow is at `.github/workflows/chatgpt-app-deploy.yml` and does:

- Checkout code
- Setup Node 20 and Corepack/Yarn
- Install dependencies, build, run tests
- Build Docker image
- Optionally push to GitHub Container Registry when `GHCR_PAT` is set in repo secrets

## Runtime configuration

Set `CHATGPT_APP_PORT` to change the server port (default `3002`).

The server expects runtime access to dependent workspace packages (`@inner-avatar/ai`, `@inner-avatar/db`) which are compiled during the workspace build.

## Troubleshooting

- If Docker build fails due to Yarn lockfile/p2p peer issues, run `yarn install` locally to update the lockfile, commit it, and retry the Docker build.
- ESM resolution required explicit `.js` extensions in internal package exports; the workspace packages include `type: "module"` and imports use `.js` extensions for Node16+ resolution.

## Next steps

- Optionally configure a hosted container registry (GHCR) and deployment pipeline.
- Add runtime monitoring and liveness/readiness probes as needed.
