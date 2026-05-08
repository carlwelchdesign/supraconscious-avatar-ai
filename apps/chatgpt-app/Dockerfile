# Stage 1: install dependencies for workspace
FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare yarn@stable --activate
WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml .yarn ./
COPY apps/chatgpt-app/package.json ./apps/chatgpt-app/package.json
COPY packages/ai/package.json ./packages/ai/package.json
COPY packages/auth/package.json ./packages/auth/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/config/package.json ./packages/config/package.json

RUN yarn install
# Stage 2: build the chatgpt app
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare yarn@stable --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.yarnrc.yml ./
COPY --from=deps /app/.yarn ./.yarn
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/yarn.lock ./yarn.lock

COPY apps/chatgpt-app ./apps/chatgpt-app
COPY packages/ai ./packages/ai
COPY packages/auth ./packages/auth
COPY packages/db ./packages/db
COPY packages/types ./packages/types
COPY packages/ui ./packages/ui
COPY packages/config ./packages/config

RUN yarn --cwd apps/chatgpt-app build

# Stage 3: production runtime image
FROM node:20-alpine AS runtime
WORKDIR /app

COPY --from=builder /app/apps/chatgpt-app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/chatgpt-app/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=3002
EXPOSE 3002

CMD ["node", "dist/server.js"]
