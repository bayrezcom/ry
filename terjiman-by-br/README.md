<h1 align="center">تەرجىمان by BR</h1>
<p align="center"><strong>Terjiman by BR</strong> — an AI translator for iOS and Android, built for Uyghur first.</p>

---

## Overview

Terjiman by BR is a focused translation utility — not a chatbot. The whole app
is one gesture: **text → Translate → result**. It targets high-quality
translation between Uyghur, Turkish, English, Arabic and Chinese, with ten more
languages available from day one.

Uyghur is the priority language. That shows up in three concrete places: a
translator prompt that tells the model exactly how Uyghur differs from Arabic,
Persian, Turkish and Uzbek; a deterministic script check that corrects the model
when it labels Uyghur text as Arabic; and per-element RTL rendering with a real
Arabic-script font.

AI provider keys never touch the device. The app talks only to your backend,
which holds the credentials.

## Features

**Translation**
- 14 languages, Auto Detect, and an intelligent swap that never produces an
  impossible pair
- Loading, error, empty and offline states everywhere
- Cancel an in-flight translation; duplicate submits are dropped
- Copy, native share (with an optional signature), and device text-to-speech
- Voice input: record → transcribe on the backend → text lands in the input box

**Uyghur & RTL**
- Uyghur Arabic script rendered in Noto Sans Arabic, Latin in Inter, chosen
  per string
- Direction resolved per text block, so `English → Uyghur` and
  `Uyghur → English` both align correctly, including mixed content
- Icons that must not mirror (the swap glyph) stay put; directional icons flip

**On device**
- History (last 100 translations) and favorites, stored locally — no account,
  no cloud database, available offline
- Settings: default languages, app language, light/dark/system, haptics, voice
- Interface localized in English, Turkish, Uyghur and Arabic

**Backend**
- `POST /api/translate`, `POST /api/detect-language`, `POST /api/transcribe`,
  `GET /api/health`, `GET /api/languages`
- Provider abstraction: OpenAI and Anthropic today, one class to add another
- Rate limiting, CORS, input limits, and errors that never leak provider detail

## Architecture

```
terjiman-by-br/
├── backend/                    Node 22 · TypeScript · Fastify 5
│   ├── src/
│   │   ├── routes/             translate · detect · transcribe · health
│   │   ├── services/
│   │   │   ├── ai/             AIProvider · OpenAIProvider · AnthropicProvider · MockProvider
│   │   │   ├── TranslationService.ts
│   │   │   ├── textCleanup.ts       strips model preambles, fences, stray quotes
│   │   │   └── scriptHeuristics.ts  Uyghur vs Arabic/Persian/Urdu detection
│   │   ├── prompts/translator.ts    the translation system prompt
│   │   ├── middleware/         rateLimit · errorHandler
│   │   ├── config/             env · languages
│   │   └── app.ts · server.ts
│   ├── tests/                  49 tests (vitest)
│   ├── Dockerfile · docker-compose.yml · .env.example
│
├── mobile/                     Expo SDK 57 · React Native 0.86 · TypeScript
│   ├── app/                    expo-router
│   │   ├── _layout.tsx         fonts, store hydration, themed navigator
│   │   ├── (tabs)/             index (Home) · history · settings
│   │   ├── favorites.tsx · about.tsx
│   ├── src/
│   │   ├── components/         AppText, Card, LanguageBar, ResultCard, …
│   │   ├── services/           api · storage · speech · share · network · feedback
│   │   ├── store/              zustand: settings · history · translation
│   │   ├── hooks/              useTheme · useI18n · useVoiceInput · useRecordActions
│   │   ├── constants/          languages · theme · config
│   │   ├── i18n/               en · tr · ug · ar
│   │   └── utils/              text (RTL) · languagePair (swap) · id
│   ├── __tests__/              54 tests (jest-expo)
│   └── app.json · eas.json · .env.example
│
└── docs/DEPLOYMENT.md          Docker & Coolify
```

Two packages, not a monorepo: the only shared data is the language list, which
is a single file on each side (`backend/src/config/languages.ts` and
`mobile/src/constants/languages.ts`). Adding a language is one line in each.

### How a translation flows

1. The app checks connectivity; offline never spends a request.
2. `POST /api/translate` with `{ sourceLanguage, targetLanguage, text }`.
3. If the source is `auto`, the backend runs a cheap detection call first, then
   corrects the result with the Uyghur script heuristic.
4. `TranslationService` builds the system prompt for that exact language pair
   and calls the configured provider.
5. The raw completion is cleaned (preamble, code fences, wrapping quotes the
   model added) and validated as non-empty.
6. The app renders it, stores it locally, and offers copy/share/listen.

## Requirements

- Node.js 20+ (22 recommended)
- npm 10+
- For device builds: an Expo account and EAS CLI (`npm install -g eas-cli`)
- An API key for OpenAI or Anthropic

## Installation

```bash
git clone <your-repo-url>
cd terjiman-by-br

# Backend
cd backend
npm install
cp .env.example .env      # add your AI_API_KEY

# Mobile
cd ../mobile
npm install
cp .env.example .env      # point EXPO_PUBLIC_API_URL at your backend
```

> The mobile package ships an `.npmrc` with `legacy-peer-deps=true`: the Expo 57
> tree pins `react@19.2.3` while a transitive `react-dom` asks for `^19.2.8`, so
> strict peer resolution fails on a plain `npm install`.

## Environment variables

### Backend (`backend/.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `AI_PROVIDER` | `openai` | `openai`, `anthropic`, or `mock` (tests only) |
| `AI_MODEL` | provider default | `gpt-4o` / `claude-sonnet-4-5` when empty |
| `AI_API_KEY` | — | **Required.** Server-side only |
| `AI_BASE_URL` | provider default | Override for Azure OpenAI, a gateway, a proxy |
| `AI_TRANSCRIBE_MODEL` | `whisper-1` | Speech-to-text model (OpenAI only) |
| `AI_TIMEOUT_MS` | `60000` | Upstream call timeout |
| `PORT` | `3000` | Listen port |
| `HOST` | `0.0.0.0` | Listen address |
| `LOG_LEVEL` | `info` | pino level |
| `TRUST_PROXY` | `true` | Keep true behind a reverse proxy so rate limiting sees real IPs |
| `MAX_TEXT_LENGTH` | `5000` | Characters per request |
| `MAX_AUDIO_BYTES` | `10485760` | Upload cap for `/api/transcribe` |
| `RATE_LIMIT_MAX` | `60` | Requests per window per IP |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Window length |
| `CORS_ORIGIN` | `*` | `*` or a comma-separated allowlist |

### Mobile (`mobile/.env`)

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Backend base URL — the only server value the app knows |

Without it, a development build falls back to the Metro host's LAN address on
port 3000, so a physical device can reach a backend on your machine.

## Running locally

**Backend**

```bash
cd backend
npm run dev          # tsx watch, http://localhost:3000
curl localhost:3000/api/health
```

**Mobile**

```bash
cd mobile
npx expo start       # then press i / a, or scan the QR code
```

Simulators and emulators reach `http://localhost:3000`. A physical device needs
your machine's LAN IP:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.20:3000 npx expo start
```

## Checks

```bash
cd backend  && npm run typecheck && npm test    # 49 tests
cd ../mobile && npm run typecheck && npm test    # 54 tests
cd mobile && npx expo-doctor                     # 21/21 checks
cd mobile && npx expo export --platform android  # full Metro bundle
```

## AI provider configuration

The provider is chosen entirely by environment variable — the mobile app never
learns which model or provider served a translation.

```bash
AI_PROVIDER=openai      AI_MODEL=gpt-4o             AI_API_KEY=sk-...
AI_PROVIDER=anthropic   AI_MODEL=claude-sonnet-4-5  AI_API_KEY=sk-ant-...
```

Both providers are called over their REST APIs with `fetch`, so no vendor SDK
is installed for a provider you are not using.

**Adding a provider:** implement `AIProvider` (`complete`, `transcribe`,
`supportsTranscription`) in `backend/src/services/ai/`, add one `case` to
`createProvider.ts`, and add the name to `readProvider()` in `config/env.ts`.
Nothing else changes.

**Voice input** needs a provider with speech-to-text. OpenAI has it; Anthropic
does not, so `/api/transcribe` answers `501 TRANSCRIPTION_UNSUPPORTED` and the
app shows a friendly message. Text translation is unaffected either way.

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for Docker and Coolify.

Quick version:

```bash
cd backend
docker compose up -d --build
```

## Mobile builds

```bash
cd mobile
eas login
eas build:configure

eas build --platform android      # AAB for Play
eas build --platform android --profile preview   # installable APK
eas build --platform ios
```

Set `EXPO_PUBLIC_API_URL` for each profile in `eas.json` before building —
`preview` and `production` currently point at `https://api.example.com`.

App identity: name `Terjiman by BR`, iOS display name `تەرجىمان by BR`, slug
`terjiman-by-br`, bundle id and Android package `com.bayrez.terjiman`.
Replace the placeholder `extra.eas.projectId` in `app.json` with the id
`eas build:configure` gives you.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `PROVIDER_NOT_CONFIGURED` / Settings shows "Unavailable" | `AI_API_KEY` is empty. The server still boots and `/api/health` reports `degraded`. |
| Translations fail only on a physical device | `localhost` is the phone. Set `EXPO_PUBLIC_API_URL` to your LAN IP. |
| `npm install` fails with `ERESOLVE` in `mobile/` | Keep the bundled `.npmrc` (`legacy-peer-deps=true`), or install with `--legacy-peer-deps`. |
| Voice button does nothing | Voice needs `AI_PROVIDER=openai`; Anthropic has no speech-to-text. Check `supportsVoiceInput` in `/api/health`. |
| "Listen" does nothing for Uyghur | Few devices ship a Uyghur TTS voice. The app fails gracefully and says so; other languages still work. |
| Uyghur text renders in boxes | Fonts did not load. `npx expo start -c` clears the Metro cache. |
| `429` responses under load | `RATE_LIMIT_MAX` per IP per minute. Raise it, or set `TRUST_PROXY=true` so real IPs are seen. |

## Privacy

- Text you translate is sent over HTTPS to your backend, which forwards it to
  the configured AI provider and returns the translation.
- The backend does not persist translation text; it processes the request and
  responds. Ordinary request logs record route, status and timing, not content.
- History and favorites live only on the device, in AsyncStorage.
- AI credentials exist only in the backend environment, never in the app.
- No account, no analytics SDK, no tracking in the MVP.

The in-app Privacy Policy and Terms describe exactly this. They are honest
placeholders written for a self-hosted MVP — have a lawyer review them, and
review the AI provider's own data-retention terms, before shipping to a store.

## Roadmap

Deliberately not in the MVP, but the architecture leaves room:

- Accounts, cloud history sync (`storage.ts` is the seam; the data layer is
  already record-shaped for Postgres/Supabase)
- Usage limits and a premium tier (`AIProvider` already abstracts model choice,
  so a plan can select a different model)
- Conversation mode, camera/image translation, document translation
- Pronunciation, transliteration, saved phrasebooks
- Domain modes (business, medical, tourism) — the prompt builder already takes
  a `formality` hint and can take a domain the same way
- Web app and browser extension against the same API

## Notes and limitations

- **Uyghur UI strings were hand-written, not machine-translated, but have not
  been reviewed by a native speaker.** Same for Arabic. Get a native review of
  `src/i18n/ug.ts` and `src/i18n/ar.ts` before a public release.
- RTL is per-element (`writingDirection` + `textAlign`), not `I18nManager.forceRTL`.
  This avoids the forced app restart and never mirrors the layout wrongly; the
  trade-off is that the navigation chrome itself stays LTR.
- The app icon is original placeholder artwork. See `mobile/assets/brand/README.md`.
- Rate limiting is in-memory, which is correct for one container. Scaling out
  horizontally needs the plugin's Redis store.
- `eas.json` has placeholder API URLs and `app.json` a placeholder EAS project id.

---

<p align="center"><sub>Terjiman by BR — built by BAYREZ.</sub></p>
