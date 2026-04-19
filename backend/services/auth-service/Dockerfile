FROM node:20-alpine3.20 AS base
RUN apk add --no-cache dumb-init
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm config set fetch-retry-maxtimeout 600000 && \
    npm config set fetch-retries 10 && \
    npm config set maxsockets 3
RUN npm install --legacy-peer-deps

FROM base AS production
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5001
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]