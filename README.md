# Time Since

A multi-purpose timer platform built with Next.js and MongoDB. Track elapsed time, countdowns, milestones, streaks, and journal entries — with per-user accounts and a hospital-monitor-inspired UI.

## Features

- **Elapsed & countdown timers** — Create, edit, archive, favorite, pin, duplicate, and search timers
- **Mandatory authentication** — Login/signup required; sessions persist via httpOnly JWT cookie
- **Milestones & streaks** — Custom milestones, pause/resync with streak history, heatmap visualization
- **Journal entries** — Per-timer notes with full CRUD
- **Analytics & export** — Dashboard stats, activity heatmap, JSON/CSV export
- **Public sharing** — Read-only shared timer pages at `/share/[shareId]` (no edit controls; shows YouTube ambient when set)
- **Local sounds** — Preset ambient/alert sounds (rain, nature, chime, etc.) for focus and countdown completion
- **YouTube ambient** — Search and attach a YouTube video per timer; plays via official IFrame embed on focus and share views (not audio-only)
- **Themes & preferences** — Multiple color themes, languages, grid/list/compact views, reduced motion
- **Extras** — Breathing exercise, countdown confetti celebration, browser notifications
- **AI timer draft** — Describe a timer in natural language; review/edit a structured draft before creating (requires `GOOGLE_GENERATIVE_AI_API_KEY`)



## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS 4, Framer Motion
- **Database:** MongoDB + Mongoose
- **Auth:** bcrypt password hashing, custom JWT in httpOnly cookie
- **YouTube:** Data API v3 (search, server-side) + IFrame Player API (playback)



## Routes


| Route              | Access    | Description                           |
| ------------------ | --------- | ------------------------------------- |
| `/`                | Public    | Redirects to `/login` or `/dashboard` |
| `/login`           | Public    | Sign in / sign up                     |
| `/verify-email`    | Public    | Email verification after signup       |
| `/forgot-password` | Public    | Request password reset code           |
| `/reset-password`  | Public    | Enter code and set new password       |
| `/dashboard`       | Protected | Main timer dashboard                  |
| `/share/[shareId]` | Public    | Read-only shared timer view           |


API routes under `/api/timers`, `/api/entries`, `/api/analytics`, `/api/export`, `/api/youtube`, and `/api/ai` require authentication. `/api/share/*` and `/api/auth/*` are public.

## Getting Started



### 1. Install dependencies

```bash
npm install
```



### 2. Configure environment

Create a `.env` file in the project root:

```bash
# Environment: dev | prod
WEBSITE_ENV=dev

# Development database
MONGODB_URI_DEV=mongodb+srv://<user>:<pass>@<cluster>/
MONGODB_DB_NAME_DEV=timer-dev

# Production database (use when WEBSITE_ENV=prod)
# MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/
# MONGODB_DB_NAME=timer

# Required in production (WEBSITE_ENV=prod)
# JWT_SECRET=your-long-random-secret

# Email (Gmail SMTP) — required for signup verification & password reset
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM=your@gmail.com

# YouTube Data API v3 — optional; enables song search in create/edit
# Enable "YouTube Data API v3" in Google Cloud, then paste the API key (server-only)
YOUTUBE_API_KEY=your_youtube_api_key

# Google Gemini — optional; enables natural-language timer creation in Create Timer
# Get a free key at https://aistudio.google.com/apikey (server-only — never NEXT_PUBLIC_)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
# Optional model override (default: gemini-2.5-flash)
# GEMINI_MODEL=gemini-2.5-flash
```


| Variable                        | Required | Description                                                |
| ------------------------------- | -------- | ---------------------------------------------------------- |
| `WEBSITE_ENV`                   | Yes      | `dev` or `prod` — selects MongoDB credentials              |
| `MONGODB_URI_DEV`               | Dev      | MongoDB connection string for development                  |
| `MONGODB_DB_NAME_DEV`           | Dev      | Database name for development                              |
| `MONGODB_URI`                   | Prod     | MongoDB connection string for production                   |
| `MONGODB_DB_NAME`               | Prod     | Database name for production                               |
| `JWT_SECRET`                    | Prod     | Secret for signing session tokens                          |
| `EMAIL_HOST`                    | Yes      | SMTP host (e.g. `smtp.gmail.com`)                          |
| `EMAIL_PORT`                    | Yes      | SMTP port (587 for TLS)                                    |
| `EMAIL_USER`                    | Yes      | Gmail address                                              |
| `EMAIL_PASS`                    | Yes      | Gmail app password (spaces are stripped automatically)     |
| `EMAIL_FROM`                    | Yes      | Sender address shown in emails                             |
| `YOUTUBE_API_KEY`               | No       | Server-only key for YouTube search (`/api/youtube/search`) |
| `GOOGLE_GENERATIVE_AI_API_KEY`  | No       | Server-only Gemini key for AI timer draft                  |
| `GEMINI_MODEL`                  | No       | Model id (default `gemini-2.5-flash`)                      |




### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to `/login`. After signing in, you land on `/dashboard`.

### 4. Production build

```bash
npm run build
npm start
```

Set `WEBSITE_ENV=prod`, production MongoDB vars, and `JWT_SECRET` before deploying.

## YouTube ambient (optional)

Timers can store a YouTube **video ID** (plus title/thumbnail metadata) — not audio files.

1. Enable **YouTube Data API v3** in [Google Cloud Console](https://console.cloud.google.com/).
2. Create an API key and set `YOUTUBE_API_KEY` in `.env` (never use `NEXT_PUBLIC_` for this key).
3. In Create/Edit Timer, search and select a video under **YouTube ambient**.
4. Playback uses the official **IFrame Player** on focus view and public share pages. Local preset sounds remain for countdown alerts.

**Notes:** Default search quota is limited (~100 `search.list` calls/day). Embed-blocked or region-restricted videos may fail to play. Audio-only / background-only YouTube playback is not supported (YouTube ToS).

## AI timer creation (optional)

Create Timer → **Describe with AI** turns a sentence into a validated timer draft (title, mode, dates, category, sound, milestones). You always review and confirm before `POST /api/timers` runs.

1. Create a free API key in [Google AI Studio](https://aistudio.google.com/apikey) and set `GOOGLE_GENERATIVE_AI_API_KEY` in `.env` (never `NEXT_PUBLIC_`).
2. Optionally set `GEMINI_MODEL` (default `gemini-2.5-flash`). On quota or unavailable-model errors, the API tries `gemini-3-flash`. Do not use `*-flash-lite` — those are closed to new API users.
3. Without a key, the create flow still works via templates / scratch; AI returns 503.

Guards: auth required, 10 requests/user/hour, 1000-char prompt cap, structured JSON + domain validation, 20s timeout, token/cost logging to Mongo `AiUsage`.

Eval offline (and live if keyed):

```bash
npm run eval:ai
```

## Scripts


| Command          | Description                                      |
| ---------------- | ------------------------------------------------ |
| `npm run dev`    | Start development server                         |
| `npm run build`  | Production build                                 |
| `npm start`      | Start production server                          |
| `npm run lint`   | Run ESLint                                       |
| `npm run format` | Format code with Prettier                        |
| `npm run eval:ai`| Offline (+ optional live) AI parse-timer eval    |




## Project Structure

```
src/
├── app/
│   ├── api/           # REST API (auth, timers, entries, analytics, export, share, youtube, ai)
│   ├── components/    # UI (Dashboard, TimerCard, YouTube player/picker, modals, etc.)
│   ├── dashboard/     # Protected dashboard page
│   ├── login/         # Public login page
│   ├── providers/     # AuthProvider, ThemeProvider
│   └── share/         # Public shared timer page (read-only)
├── components/auth/   # LoginForm, ProtectedRoute, PublicRoute
├── hooks/             # useTimerTick, useDebounce, useCountdownCelebration, …
├── lib/               # Auth, MongoDB, API clients, AI parse-timer, youtube helpers, utilities
├── models/            # Mongoose models (User, Timer, Entry, AuthCode, AiUsage)
└── proxy.ts           # Route protection & session checks (network proxy)
```



## Auth Flow

1. Unauthenticated users are redirected to `/login` by the proxy layer and client-side route guards.
2. **Signup** creates an account and emails a 6-digit verification code. Users verify at `/verify-email` before accessing the app.
3. **Login** requires a verified email. Unverified users are redirected to `/verify-email`.
4. **Forgot password** sends a reset code via email; users set a new password at `/reset-password`.
5. Login/register (after verification) sets an httpOnly `timer_session` cookie (30-day expiry).
6. On page load, `AuthProvider` validates the session via `GET /api/auth/me`.
7. Logout or session expiry clears the cookie and redirects to `/login`.
8. Timer data is scoped per user — all CRUD operations enforce ownership server-side.

