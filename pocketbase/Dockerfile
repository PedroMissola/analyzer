FROM alpine:3.18 AS downloader
ARG PB_VERSION="0.22.18" # Você pode atualizar esta versão se precisar
ENV PB_VERSION=${PB_VERSION}
RUN apk add --no-cache wget unzip ca-certificates
RUN wget -O /tmp/pb.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip"
RUN unzip /tmp/pb.zip -d /app

FROM alpine:3.18
RUN apk add --no-cache ca-certificates

RUN addgroup -g 1000 pb && adduser -u 1000 -G pb -s /bin/sh -D pb

WORKDIR /pb

COPY --from=downloader /app/pocketbase /pb/pocketbase
RUN chmod +x /pb/pocketbase

RUN mkdir -p /pb/pb_data /pb/pb_hooks && chown -R pb:pb /pb

USER pb

EXPOSE 8090
VOLUME /pb/pb_data

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb/pb_data"]