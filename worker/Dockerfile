FROM node:18.19.1-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY src ./src

FROM alpine:3.18

RUN apk add --no-cache nodejs npm tzdata dumb-init

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder --chown=appuser:appgroup /usr/src/app ./

USER appuser

EXPOSE 3001

ENV TZ="America/Sao_Paulo"

ENTRYPOINT ["/usr/bin/dumb-init", "--"]

CMD [ "npm", "start" ]