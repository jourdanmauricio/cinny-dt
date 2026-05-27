# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A customized fork of [Cinny](https://github.com/cinnyapp/cinny) — a Matrix chat client — adapted for the **Dulce Terciopelo** platform (`dulceterciopelo.com`). The homeserver is locked to `synapse.dulceterciopelo.com` and registration is handled externally. The key custom addition is an OAuth code-exchange flow at startup that calls a backend API to obtain Matrix tokens.

## Commands

```bash
npm start          # Dev server on http://localhost:8080
npm run build      # Production build to dist/
npm run lint       # ESLint + Prettier check
npm run fix:prettier  # Auto-fix formatting
npm run typecheck  # TypeScript type check (no emit)
```

No test suite exists in this project.

## Environment & config

- **`.env.local`** — set `VITE_API_URL` to the backend base URL (e.g., `https://api.dulceterciopelo.com`). This is used for the OAuth token exchange.
- **`public/config.local.json`** — used in dev mode (vite copies it as `config.json`).
- **`public/config.json`** — used in production builds; locked to `synapse.dulceterciopelo.com`, no custom homeservers.
- **`build.config.ts`** — controls the `base` path for deployment subdirectory (default `/`).

## Architecture

### Entry point & OAuth flow

`src/index.tsx` boots the app. On load, if a `?code=` query param is present, it exchanges it with `VITE_API_URL/matrix/exchange` to get Matrix credentials, which are saved via `setFallbackSession` in `src/app/state/sessions.ts` (stored in `localStorage` under `cinny_*` keys).

### Matrix client lifecycle

`src/client/initMatrix.ts` manages the `matrix-js-sdk` client:
- `initClient()` — creates the client with IndexedDB sync/crypto stores and Rust-based E2EE (`initRustCrypto`)
- `startClient()` — starts sync with lazy member loading
- `logoutClient()` / `clearCacheAndReload()` — teardown helpers

The client is provided to the React tree via `MatrixClientProvider` (context hook at `src/app/hooks/useMatrixClient.ts`).

### App layer (`src/app/`)

| Directory | Purpose |
|-----------|---------|
| `pages/` | Top-level route pages: `auth/` (login, register, reset-password) and `client/` (home, direct, space, inbox, explore) |
| `features/` | Self-contained feature modules with their own logic and sub-components: `room`, `room-nav`, `settings`, `room-settings`, `space-settings`, `search`, `call`, `lobby`, etc. |
| `components/` | Shared, reusable UI components (message rendering, editor, emoji board, media viewers, modals, etc.) |
| `state/` | Jotai atoms for global client state (rooms, navigation, sessions, modals). Many atoms persist to `localStorage`. |
| `hooks/` | React hooks wrapping Matrix SDK events, router helpers, media queries, etc. |
| `utils/` | Pure utility functions. |
| `plugins/` | Standalone plugin implementations: `markdown` (Slate-based), `custom-emoji`, `call` (Element Call embed), `text-area`. |
| `styles/` | Vanilla-extract CSS token files. |

### Styling

Uses **vanilla-extract** (CSS-in-TypeScript, `.css.ts` files) and the **folds** component library for all UI primitives (Box, Text, Button, Icon, etc.). Global CSS tokens are in `src/config.css.ts` and `src/colors.css.ts`.

### State management

- **Jotai** atoms for synchronous global state (room list, nav, modal open/close, uploads).
- **@tanstack/react-query** for async server state (Matrix API calls).
- **localStorage** for session persistence and user preferences.

### Service Worker

`src/sw.ts` handles PWA caching. `src/sw-session.ts` keeps the SW updated with the current Matrix access token (for authenticated media fetching).
