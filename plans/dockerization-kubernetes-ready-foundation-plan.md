# Dockerization And Kubernetes-Ready Foundation Plan

## Summary
Containerize the app with Docker and Docker Compose while keeping Vercel as the current production deployment. Add portable runtime images for web, admin, ChatGPT/MCP, and local Postgres-backed testing. Do not add Kubernetes manifests yet; document the Kubernetes scaling model for later.

## Scope
- Add production Docker support for `apps/web` on port `3000`.
- Add production Docker support for `apps/admin` on port `3001`.
- Update `apps/chatgpt-app` Docker support on port `3002` to use the pinned Yarn 4 launcher.
- Configure Next.js standalone output for web and admin.
- Add root Docker scripts for image builds and Compose lifecycle.
- Add `docker-compose.yml` with Postgres, web, admin, ChatGPT/MCP, and an explicit one-shot schema setup service.
- Add web and admin JSON health endpoints and reuse the existing ChatGPT health surface.
- Add container and Kubernetes readiness documentation.

## Constraints
- Docker builds must use `node .yarn/releases/yarn-4.cjs install --immutable`.
- Runtime environment comes from deployment variables or Compose values, not copied `.env` files.
- App containers must not run migrations automatically on every boot.
- Kubernetes YAML is out of scope for this phase.

## Validation
- `yarn typecheck`
- `yarn lint`
- `yarn build:web`
- `yarn build:admin`
- `yarn build:chatgpt`
- Docker image builds where local Docker is available.
- Compose configuration validation and optional local stack smoke checks.
