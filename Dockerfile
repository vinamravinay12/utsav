# One container serves the API and the built web client from the same origin,
# so the browser needs no CORS and the strict same-origin CSP holds.

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/server/package.json ./packages/server/
COPY packages/client/package.json ./packages/client/
RUN npm ci
COPY tsconfig.base.json ./
COPY packages ./packages
# Building the client and server also builds `core`, which both reference.
RUN npm run build -w @utsav/core -w @utsav/server -w @utsav/client \
  && find packages/core/dist packages/server/dist -name '*.test.*' -delete \
  && rm -rf packages/core/dist/test-utils packages/server/dist/test-utils

FROM node:24-alpine AS runtime
ENV NODE_ENV=production \
    STATIC_DIR=/app/packages/client/dist
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/server/package.json ./packages/server/
COPY packages/client/package.json ./packages/client/
RUN npm ci --omit=dev --workspace @utsav/server --include-workspace-root=false && npm cache clean --force
COPY --from=build /app/packages/core/dist ./packages/core/dist
COPY --from=build /app/packages/server/dist ./packages/server/dist
COPY --from=build /app/packages/client/dist ./packages/client/dist
USER node
# Cloud Run supplies PORT; config.ts reads it and falls back to 8080.
EXPOSE 8080
CMD ["node", "packages/server/dist/index.js"]
