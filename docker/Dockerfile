FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git curl

COPY src/frontend/package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -S cruzazul && adduser -S cruzazul -G cruzazul && \
    apk add --no-cache tzdata ca-certificates && \
    cp /usr/share/zoneinfo/America/Santiago /etc/localtime && \
    echo "America/Santiago" > /etc/timezone && \
    update-ca-certificates

COPY --from=builder /app/node_modules ./node_modules
COPY src/frontend/ .
COPY --chmod=755 src/scripts/ /usr/local/bin/

RUN mkdir -p /var/log/cruzazul && chown -R cruzazul:cruzazul /app /var/log/cruzazul

USER cruzazul

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

ENV NODE_ENV=production \
    PORT=3000 \
    TZ=America/Santiago

CMD ["node", "server.js"]
