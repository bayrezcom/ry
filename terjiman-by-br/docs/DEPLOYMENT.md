# Deploying the Terjiman backend

The backend is a single stateless Node container. It needs no database, no
volume and no vendor-specific service — anything that runs a Dockerfile will
host it.

Only the backend is deployed. The mobile app is built with EAS and distributed
through the app stores; it just needs `EXPO_PUBLIC_API_URL` pointed at whatever
URL you end up with here.

## 1. Docker (any Linux host)

```bash
cd backend
cp .env.example .env        # set AI_API_KEY at minimum
docker compose up -d --build
curl http://localhost:3000/api/health
```

The image is a three-stage build (build → production deps → runtime), runs as
the unprivileged `node` user, and carries a `HEALTHCHECK` that polls
`/api/health`.

To run it without compose:

```bash
docker build -t terjiman-backend ./backend
docker run -d --name terjiman-backend -p 3000:3000 \
  -e AI_PROVIDER=openai \
  -e AI_API_KEY=sk-... \
  -e CORS_ORIGIN='*' \
  --restart unless-stopped \
  terjiman-backend
```

## 2. Coolify

Coolify is the expected target, but nothing here depends on it.

### Create the application

1. **Project → New Resource → Application.**
2. Source: **Public** or **Private Repository (GitHub App)**, pointing at this
   repository.
3. Branch: your deployment branch.
4. Build Pack: **Dockerfile**.
5. **Base Directory**: `terjiman-by-br/backend`
   **Dockerfile Location**: `Dockerfile` (relative to the base directory).
6. **Port**: `3000`.

### Environment variables

Add these under the application's **Environment Variables** tab. Mark
`AI_API_KEY` as a secret — never put it in the repository.

```
AI_PROVIDER=openai
AI_MODEL=gpt-4o
AI_API_KEY=sk-...
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
LOG_LEVEL=info
TRUST_PROXY=true
MAX_TEXT_LENGTH=5000
MAX_AUDIO_BYTES=10485760
RATE_LIMIT_MAX=60
RATE_LIMIT_WINDOW_MS=60000
CORS_ORIGIN=*
```

`TRUST_PROXY=true` matters: Coolify puts Traefik in front of the container, so
without it every request looks like it comes from the proxy and rate limiting
would throttle all users as one.

### Domain and HTTPS

1. Set **Domains** to `https://api.your-domain.com`.
2. Point an `A` record at the server's IP.
3. Coolify requests a Let's Encrypt certificate automatically once DNS
   resolves. Leave **Force HTTPS** on.

### Health check

Coolify can use the container's built-in `HEALTHCHECK`, or configure it
explicitly:

- Path: `/api/health`
- Port: `3000`
- Expected status: `200`

`/api/health` is exempt from rate limiting, so uptime monitors never trip it.

It reports `status: "degraded"` and `aiConfigured: false` when `AI_API_KEY` is
missing — the process still starts, so a bad deploy shows up as degraded rather
than a crash loop.

### Deploy

Press **Deploy**. Then:

```bash
curl https://api.your-domain.com/api/health
```

```json
{"success":true,"status":"ok","aiConfigured":true,"supportsVoiceInput":true,"maxTextLength":5000,"languages":14}
```

## 3. Point the app at it

Set the URL for each EAS build profile in `mobile/eas.json`:

```json
{
  "build": {
    "preview":    { "env": { "EXPO_PUBLIC_API_URL": "https://api.your-domain.com" } },
    "production": { "env": { "EXPO_PUBLIC_API_URL": "https://api.your-domain.com" } }
  }
}
```

Then build:

```bash
cd mobile
eas build --platform android
eas build --platform ios
```

`EXPO_PUBLIC_*` values are inlined into the JavaScript bundle at build time, so
a URL change needs a new build. That is fine — it is a public URL, not a
secret. Nothing secret is ever exposed to the app.

## 4. Locking down CORS

`CORS_ORIGIN=*` is right for a native app: React Native does not enforce CORS,
and the header is meaningless to it. Tighten it only when a browser client is
added:

```
CORS_ORIGIN=https://app.your-domain.com,https://your-domain.com
```

## 5. Operating notes

**Logs.** Structured pino JSON on stdout. Failures log an error code, the
route, and provider detail; `authorization` and `x-api-key` headers are
redacted. Client responses only ever carry a stable code and a safe sentence.

**Scaling.** The container is stateless — run as many as you like behind the
proxy. The one caveat is rate limiting, which is per-process and in memory:
with N containers the effective limit is N × `RATE_LIMIT_MAX`. For a shared
limit, configure `@fastify/rate-limit` with its Redis store in
`src/middleware/rateLimit.ts`.

**Cost control.** `MAX_TEXT_LENGTH` caps request size and `RATE_LIMIT_MAX` caps
frequency. Both are enforced before any upstream call, so rejected requests
cost nothing.

**Rotating the key.** Update `AI_API_KEY` and redeploy. No mobile release is
needed — the app never held the key.

**Upgrading.** `git pull` and redeploy; Coolify rebuilds the image. There is no
database and no migration step.
