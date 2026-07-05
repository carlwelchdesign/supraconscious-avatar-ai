# ChatGPT MCP App

Small Express-based MCP server used by Inner Avatar for journal analysis and Avatar reflections.

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

- `CHATGPT_APP_PORT` or platform `PORT` — default `3002`.
- `INNER_AVATAR_WEB_URL` or `NEXT_PUBLIC_APP_URL` — public web app origin for widget redirects and CORS.
- `NEXT_PUBLIC_ADMIN_URL` — admin origin included in CORS when configured.

Notes

- The package relies on workspace packages (`@inner-avatar/ai`, `@inner-avatar/db`) and expects a workspace build in CI or in the Docker builder stage.
- See `docs/chatgpt-mcp-app.md` and `.github/workflows/chatgpt-app-deploy.yml` for CI and deployment details.
