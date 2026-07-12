# Z-Chat — Private Ephemeral Messenger

Zero-budget, Signal-grade E2EE messenger with cinematic dissolve effect.
Cyber-Phantom aesthetic with glassmorphism UI, tweetnacl encryption, and WebSocket relay.

## Quick Start

```bash
npm run install:all
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend:** ws://localhost:3001
- **Health:** http://localhost:3001/health

## Architecture

- **React + Vite** frontend with Tailwind CSS Cyber-Phantom theme
- **Express + ws** backend WebSocket relay (zero-knowledge)
- **tweetnacl** E2E box encryption with nonce replay protection
- **IndexedDB** key persistence and message cache
- **Double Ratchet** simulated forward secrecy
- **Supabase-ready** schema (optional deployment target)

## Key Features

- E2EE (tweetnacl box encryption)
- Optimistic UI (messages render before server ACK)
- Ephemeral messages with self-destruct timer
- Canvas dissolve particle effect (signature feature)
- Message status tracking (sending → sent → delivered → read)
- Glassmorphism + neon Cyber-Phantom design system
- Offline message store with reconnect delivery
- Typing indicator (3-glowing-orbs animation)
- Encryption fingerprint verification

## Testing

```bash
npm test           # Vitest unit + integration tests
npm run test:e2e   # Playwright E2E tests
```

## Deploy

1. Configure Supabase project (optional)
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `frontend/.env`
3. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`
4. Run `npm run build` → deploy frontend to Vercel
5. Deploy backend to Render (WebSocket)
6. Run `supabase db push` for schema migration