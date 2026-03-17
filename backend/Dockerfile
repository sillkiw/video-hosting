# syntax=docker/dockerfile:1

FROM golang:1.25.6-bookworm AS builder

WORKDIR /app/backend

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/video-hosting ./cmd/video-hosting

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    ffmpeg \
    wget \
 && rm -rf /var/lib/apt/lists/*

RUN wget -O /tmp/gpac.deb https://gpac.io/builds/gpac_latest_head_linux64.deb \
    && apt-get update \
    && apt-get install -y /tmp/gpac.deb \
    && rm -f /tmp/gpac.deb \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /out/video-hosting /app/video-hosting
COPY backend/configs /app/configs

RUN mkdir -p /data/videos

EXPOSE 8080

CMD ["/app/video-hosting", "-config", "/app/configs/config.yaml"]