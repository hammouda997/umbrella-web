# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_USE_MOCK=false
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_USE_MOCK=$NEXT_PUBLIC_USE_MOCK
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3010
RUN groupadd -r umbrella && useradd -r -g umbrella umbrella
COPY --from=build --chown=umbrella:umbrella /app/package.json /app/package-lock.json ./
COPY --from=build --chown=umbrella:umbrella /app/node_modules ./node_modules
COPY --from=build --chown=umbrella:umbrella /app/.next ./.next
COPY --from=build --chown=umbrella:umbrella /app/public ./public
COPY --from=build --chown=umbrella:umbrella /app/next.config.mjs ./next.config.mjs
USER umbrella
EXPOSE 3010
CMD ["npm", "run", "start"]
