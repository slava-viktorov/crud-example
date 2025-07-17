ARG NODE_VERSION=lts-alpine

# --- Builder stage ---
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --only=production

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG API_URL
ENV API_URL=$API_URL

COPY . .

RUN npm run build

# --- Production stage ---
FROM node:${NODE_VERSION} AS production

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
# COPY --from=builder /app/next.config.js ./

EXPOSE 3000

CMD ["npm", "run", "start"]

# --- Development stage ---
FROM node:${NODE_VERSION} AS development

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --include=dev

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# --- Test stage ---
FROM development AS test

CMD ["npm", "run", "test"] 