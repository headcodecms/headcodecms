# Self-hosted (e.g. Coolify). Environment as on Vercel; see README.md.
FROM node:24-bookworm-slim
RUN npm install -g pnpm@11.10.0
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ENV NODE_ENV=production
RUN pnpm build
EXPOSE 3082
CMD ["pnpm", "start"]
