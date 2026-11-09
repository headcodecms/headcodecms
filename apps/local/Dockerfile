# Headcode CMS (local) on Node. One process; database and images live in
# /app/data, so mount a volume there and back it up.
#
#   docker build -t headcode \
#     --build-arg NEXT_PUBLIC_SITE_URL=https://www.example.com \
#     --build-arg NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS=draft.example.com .
#   docker run -p 3074:3074 -v headcode-data:/app/data \
#     -e BETTER_AUTH_SECRET=... -e ALLOWED_MCP_TOKENS=... headcode
FROM node:24-slim AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# Public values are inlined at build time.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3074
ARG NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS=draft.localhost
ARG NEXT_PUBLIC_HEADCODE_VERSION=auto
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS=$NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS \
    NEXT_PUBLIC_HEADCODE_VERSION=$NEXT_PUBLIC_HEADCODE_VERSION
RUN pnpm build

FROM node:24-slim
WORKDIR /app
RUN corepack enable
COPY --from=build /app /app
ENV NODE_ENV=production \
    PORT=3074
VOLUME /app/data
EXPOSE 3074
# Starts the server, then applies migrations and seeds (scripts/start.mts).
CMD ["node", "scripts/start.mts"]
