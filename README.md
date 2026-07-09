# Time Since

A multi-purpose timer platform built with Next.js and MongoDB. Track elapsed time, countdowns, milestones, streaks, and journal entries — with per-user accounts and a hospital-monitor-inspired UI.

## Features

- **Elapsed & countdown timers** — Create, edit, archive, favorite, pin, duplicate, and search timers
- **Mandatory authentication** — Login/signup required; sessions persist via httpOnly JWT cookie
- **Milestones & streaks** — Custom milestones, pause/resync with streak history, heatmap visualization
- **Journal entries** — Per-timer notes with full CRUD
- **Analytics & export** — Dashboard stats, activity heatmap, JSON/CSV export
- **Public sharing** — Read-only shared timer pages at `/share/[shareId]`
- **Themes & preferences** — Multiple color themes, languages, grid/list/compact views, reduced motion

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS 4, Framer Motion
- **Database:** MongoDB + Mongoose
- **Auth:** bcrypt password hashing, custom JWT in httpOnly cookie

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

API routes under `/api/timers`, `/api/entries`, `/api/analytics`, and `/api/export` require authentication. `/api/share/*` and `/api/auth/*` are public.

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
```

| Variable              | Required | Description                                            |
| --------------------- | -------- | ------------------------------------------------------ |
| `WEBSITE_ENV`         | Yes      | `dev` or `prod` — selects MongoDB credentials          |
| `MONGODB_URI_DEV`     | Dev      | MongoDB connection string for development              |
| `MONGODB_DB_NAME_DEV` | Dev      | Database name for development                          |
| `MONGODB_URI`         | Prod     | MongoDB connection string for production               |
| `MONGODB_DB_NAME`     | Prod     | Database name for production                           |
| `JWT_SECRET`          | Prod     | Secret for signing session tokens                      |
| `EMAIL_HOST`          | Yes      | SMTP host (e.g. `smtp.gmail.com`)                      |
| `EMAIL_PORT`          | Yes      | SMTP port (587 for TLS)                                |
| `EMAIL_USER`          | Yes      | Gmail address                                          |
| `EMAIL_PASS`          | Yes      | Gmail app password (spaces are stripped automatically) |
| `EMAIL_FROM`          | Yes      | Sender address shown in emails                         |

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

## Scripts

| Command          | Description               |
| ---------------- | ------------------------- |
| `npm run dev`    | Start development server  |
| `npm run build`  | Production build          |
| `npm start`      | Start production server   |
| `npm run lint`   | Run ESLint                |
| `npm run format` | Format code with Prettier |

## Project Structure

```
src/
├── app/
│   ├── api/           # REST API routes (auth, timers, entries, analytics, export, share)
│   ├── components/    # UI components (Dashboard, TimerCard, modals, etc.)
│   ├── dashboard/     # Protected dashboard page
│   ├── login/         # Public login page
│   ├── providers/     # AuthProvider, ThemeProvider
│   └── share/         # Public shared timer page
├── components/auth/   # LoginForm, ProtectedRoute, PublicRoute
├── hooks/             # useTimerTick, useDebounce, useLocalStorage
├── lib/               # Auth, MongoDB, API clients, utilities
├── models/            # Mongoose models (User, Timer, Entry)
└── middleware.ts      # Route protection & session checks
```

## Auth Flow

1. Unauthenticated users are redirected to `/login` by middleware and client-side route guards.
2. **Signup** creates an account and emails a 6-digit verification code. Users verify at `/verify-email` before accessing the app.
3. **Login** requires a verified email. Unverified users are redirected to `/verify-email`.
4. **Forgot password** sends a reset code via email; users set a new password at `/reset-password`.
5. Login/register (after verification) sets an httpOnly `timer_session` cookie (30-day expiry).
6. On page load, `AuthProvider` validates the session via `GET /api/auth/me`.
7. Logout or session expiry clears the cookie and redirects to `/login`.
8. Timer data is scoped per user — all CRUD operations enforce ownership server-side.
