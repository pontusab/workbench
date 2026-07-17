# Workbench Standalone

Standalone Bun server for Workbench. Useful for any Docker-based deployment.

## Run Locally

```bash
docker compose up -d redis
REDIS_URL=redis://localhost:6379 bun run --filter @getworkbench/standalone dev
```

Open <http://localhost:3000>.

## Docker

Build from repo root:

```bash
docker build -f apps/standalone/Dockerfile -t workbench-standalone .
```

Run:

```bash
docker run --rm -p 3000:3000 \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -e QUEUE_NAMES=default \
  workbench-standalone
```

Health check:

```bash
curl http://localhost:3000/healthcheck
```

## Environment

| Variable | Default | Description |
| --- | --- | --- |
| `REDIS_URL` | none | Redis connection URL used by BullMQ. Ignored when `REDIS_SENTINELS` is set. |
| `REDIS_SENTINELS` | none | Comma-separated Redis Sentinel `host:port` list (port defaults to `26379`). Enables Sentinel mode. |
| `REDIS_SENTINEL_NAME` | none | Sentinel master group name (e.g. `mymaster`). Required with `REDIS_SENTINELS`. |
| `REDIS_SENTINEL_PASSWORD` | none | Password for the Sentinel nodes themselves. |
| `REDIS_USERNAME` | none | Username for the Redis server (ACL). |
| `REDIS_PASSWORD` | none | Password for the Redis server. |
| `REDIS_DB` | `0` | Redis database index. |
| `QUEUE_NAMES` | `default` | Comma-separated BullMQ queue names. |
| `PORT` | `3000` | HTTP port. |
| `BASE_PATH` | `/` | Dashboard base path. |
| `AUTH_USERNAME` | none | Basic auth username. Requires `AUTH_PASSWORD`. |
| `AUTH_PASSWORD` | none | Basic auth password. Requires `AUTH_USERNAME`. |
| `TITLE` | `Workbench` | Dashboard title. |
| `LOGO_URL` | none | Dashboard logo URL. |
| `READONLY` | `false` | Set to `true` to disable write actions. |
| `TAGS` | none | Comma-separated job data fields to expose as filters. |

Unauthenticated mode is allowed when `AUTH_USERNAME` and `AUTH_PASSWORD` are unset.

## Image Publishing

GitHub Actions builds the image on PRs that touch the standalone app or its dependencies. Version tags publish to GHCR:

```text
ghcr.io/<owner>/workbench-standalone:<version>
ghcr.io/<owner>/workbench-standalone:latest
```

## Deployment

Use the published GHCR image or build from this repo with Dockerfile path `apps/standalone/Dockerfile`.

Set at least `REDIS_URL` and `QUEUE_NAMES` — or, for Sentinel-managed Redis, `REDIS_SENTINELS` + `REDIS_SENTINEL_NAME`:

```bash
docker run --rm -p 3000:3000 \
  -e REDIS_SENTINELS=sentinel-1:26379,sentinel-2:26379 \
  -e REDIS_SENTINEL_NAME=mymaster \
  -e QUEUE_NAMES=default \
  workbench-standalone
```
