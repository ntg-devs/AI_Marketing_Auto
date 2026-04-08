# STAGE 1: Build
FROM golang:1.25-alpine AS builder

RUN apk add --no-cache git

WORKDIR /app

# 1. Copy go.mod and go.sum from backend root
COPY go.mod go.sum ./
RUN go mod download

# 2. Copy source code
COPY . .

# 3. Build API Server
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server ./cmd/api/main.go

# 4. Build Background Worker
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/worker ./cmd/worker/main.go

# STAGE 2: Run
FROM alpine:3.18

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# Copy binaries from builder
COPY --from=builder /app/server .
COPY --from=builder /app/worker .

# Copy any extra resources if needed (e.g. spec folder)
COPY --from=builder /app/spec ./spec 

EXPOSE 8080

# Default entrypoint (can be overridden by docker-compose cmd)
ENTRYPOINT ["./server"]