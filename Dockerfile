# Stage 1 — base: Node.js with pnpm
FROM node:20-slim AS base
RUN corepack enable
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Stage 2 — build: install deps, compile, isolate production
FROM base AS build
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run --filter=@agent-crm/api build
RUN pnpm deploy --filter=@agent-crm/api --prod --legacy /prod/api

# Stage 3 — production: lean runtime image
FROM base AS production
WORKDIR /app
COPY --from=build /prod/api .
COPY --from=build /app/apps/api/dist ./dist
EXPOSE 3001
USER node
CMD ["node", "dist/main.js"]
