# syntax=docker/dockerfile:1

FROM golang:1.25.6-bookworm AS builder

WORKDIR /app/backend

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ ./

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -o /out/video-hosting ./cmd/video-hosting

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    ffmpeg \
 && rm -rf /var/lib/apt/lists/*

RUN install -m 0755 -d /etc/apt/keyrings \
    && curl -fsSL https://dist.gpac.io/gpac/linux/gpg.asc -o /etc/apt/keyrings/gpac.asc \
    && chmod a+r /etc/apt/keyrings/gpac.asc \
    && printf "Types: deb\nURIs: https://dist.gpac.io/gpac/linux/debian\nSuites: bookworm\nComponents: nightly\nSigned-By: /etc/apt/keyrings/gpac.asc\n" > /etc/apt/sources.list.d/gpac.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends gpac \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /out/video-hosting /app/video-hosting
COPY backend/configs /app/configs

RUN mkdir -p /data/videos/raw /data/videos/dash

EXPOSE 8080

CMD ["/app/video-hosting", "-config", "/app/configs/config.yaml"]