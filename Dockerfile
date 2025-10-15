FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY docker-entrypoint.sh ./

RUN npm ci --no-audit --prefer-offline --no-fund
COPY . .

RUN npx prisma generate --schema=prisma/schema.prisma || true
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/docker-entrypoint.sh ./

RUN npm ci --omit=dev --no-audit --prefer-offline --no-fund

EXPOSE 3000
RUN chmod +x ./docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]