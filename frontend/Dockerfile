# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /src
RUN chown -R node:node /src && chmod -R 770 /src

# --- development for local ---
FROM base AS development
COPY ["package.json", "package-lock.json*", "./"]
# キャッシュディレクトリを指定
RUN \
  --mount=type=cache,target=/root/.npm \
  --mount=type=cache,target=/workspace/node_modules \
  npm install
COPY . .
EXPOSE 3000
ENTRYPOINT ["npm", "run", "dev"]

# --- builder ---
FROM base AS builder
COPY --chown=node:node . .
COPY --chown=node:node tsconfig.json .
COPY --chown=node:node next.config.ts .
USER node
RUN npm install
RUN npm run build

# --- Production Stage ---
FROM base AS production
LABEL org.label-schema.name="frontend-prod"
ENV NODE_ENV=production
COPY --chown=node:node --from=builder /src/.next ./.next
COPY --chown=node:node --from=builder /src/public ./public
COPY --chown=node:node ./package*.json ./
RUN npm install --omit=dev
USER node
ENTRYPOINT ["npm", "run", "start"]
EXPOSE 3000