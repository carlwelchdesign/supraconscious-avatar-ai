# ChatGPT MCP App

Small Express-based MCP server used by Supraconscious for legacy journal analysis and guide reflections.

Quick commands

- Dev (live):

```bash
yarn --cwd apps/chatgpt-app dev
```

- Build (TypeScript):

```bash
yarn --cwd apps/chatgpt-app build
```

- Run compiled app:

```bash
node apps/chatgpt-app/dist/server.js
```

- Tests:

```bash
yarn --cwd apps/chatgpt-app test
```

Widget

- Static widget is served at `http://localhost:3002/widget` when the MCP server is running (default port `3002`).

Docker

- Build:

```bash
docker build -f apps/chatgpt-app/Dockerfile -t inner-avatar-chatgpt-app:latest .
```

- Run:

```bash
docker run -p 3002:3002 inner-avatar-chatgpt-app:latest
```

Environment

- Start from `apps/chatgpt-app/.env.example`.
- `CHATGPT_APP_PORT` or platform `PORT` — default `3002`.
- `CHATGPT_APP_API_TOKEN` — optional locally, required for hosted/staging/production tool execution. Use a long random bearer token.
- `INNER_AVATAR_WEB_URL` or `NEXT_PUBLIC_APP_URL` — public web app origin for widget redirects and CORS.
- `NEXT_PUBLIC_ADMIN_URL` — admin origin included in CORS when configured.

Notes

- `/health` and MCP tool metadata are public; MCP tool execution requires `Authorization: Bearer <CHATGPT_APP_API_TOKEN>` when the token is configured.
- The package relies on workspace packages (`@inner-avatar/ai`, `@inner-avatar/db`) and expects a workspace build in CI or in the Docker builder stage.
- See `docs/chatgpt-mcp-app.md` and `.github/workflows/chatgpt-app-deploy.yml` for CI and deployment details.
