# Z-Chat — Agent Instructions

## Quick start
```bash
npm run install:all   # install root + frontend + backend deps
npm run dev           # concurrently: Vite :5173 + backend :3001
npm test              # Vitest unit tests (16 tests)
npm run test:e2e      # Playwright E2E (4 tests, auto-starts servers)
npm run build         # Vite production build → frontend/dist/
```

## Architecture
- **Frontend** (`frontend/`): React 18 + Vite + Tailwind. Entry: `src/main.jsx` → `App.jsx` (BrowserRouter, ErrorBoundary, ThemeProvider, AuthProvider, GhostModeProvider)
- **Backend** (`backend/`): Express + ws. Entry: `src/server.js` (health endpoint + JWT token endpoint + WebSocket relay)
- **Database** (`database/`): Postgres/Supabase schema (run with `supabase db push`)
- E2EE uses tweetnacl box encryption with nonce. Keys stored in IndexedDB via `idb` library.

## Testing quirks
- **Vitest + jsdom + fake-indexeddb**: The `idb` library reads `globalThis.indexedDB` at call time. jsdom's `window.indexedDB` property must be overwritten with `Object.defineProperty` (simple assignment doesn't work). See `src/__tests__/setup.js` — all IDB globals are defined there.
- **Test files use .jsx extension** even for pure-JS tests. Vitest can't parse JSX-compatible syntax in .js files with the current config.
- **E2E tests** (`e2e/zchat.spec.js`): Playwright config auto-starts Vite + backend via `webServer`. Uses `reuseExistingServer: !process.env.CI` so you can pre-start servers manually during development.

## Build & deploy
- **Vercel**: `frontend/vercel.json` — SPA rewrites, Vite framework, expects `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` as Vercel secrets (`@supabase_url`, `@supabase_anon_key`)
- **Render**: `render.yaml` blueprint — backend service, rootDir=backend, node entry `src/server.js`, auto-generates `JWT_SECRET`
- Vite proxies `/api/*` → `localhost:3001` in dev. Production must serve `/api` separately or from the same origin.

## Conventions
- `frontend/src/utils/` for pure utility functions
- `frontend/src/lib/` for lib wrappers (crypto, store, audio, supabase client)
- `frontend/src/hooks/` for React hooks
- `frontend/src/pages/` for route-level page components
- `frontend/src/components/` organized by feature (Chat, UI, Settings, Auth)
- Messages use optimistic UI: render before WebSocket ACK, status transitions: sending → sent → delivered → read
- Ephemeral messages use 3s countdown + Canvas particle dissolve effect
- WebSocket relay is zero-knowledge: only encrypted ciphertext passes through backend
- `react-window` listed in deps but **not used** — MessageList uses plain scrollable div (react-window was removed)

## Deploy flow
1. Push to GitHub
2. Import frontend repo to Vercel (framework auto-detects Vite, uses frontend/vercel.json)
3. Create Render Web Service pointing to repo/backend, uses render.yaml
4. (Optional) `supabase db push` with database/schema.sql against Supabase project
