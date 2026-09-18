# Classync

> Early warning for students about to fall behind — before the grade does.

Discord bot + TA web dashboard for private academic help-seeking. Built for IFest 2026 Hackathon by Team BudakGPT.

## Stack

- **Bot:** discord.js v14, TypeScript, node-cron
- **Web:** Next.js 15 App Router, Tailwind v4, Auth.js v5 (Discord OAuth)
- **Core:** Prisma 6, PostgreSQL (Neon), Zod
- **Web dashboard link:** `WEB_URL` (used in bot embeds; defaults to localhost)
- **Monorepo:** npm workspaces

## Quick Start

### Prerequisites
- Node.js ≥ 20
- A Neon (or any PostgreSQL) database
- A Discord application with bot token

### 1. Clone & install
```bash
git clone https://github.com/BudakGPT/Classync.git
cd Classync
npm install
```

### 2. Environment variables
```bash
cp .env.example .env
# Fill in all values in .env
```

Required variables:
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `DISCORD_TOKEN` | Bot token from Discord Developer Portal |
| `DISCORD_CLIENT_ID` | Application client ID |
| `DISCORD_CLIENT_SECRET` | OAuth2 client secret |
| `DISCORD_GUILD_ID` | Your test server ID |
| `AUTH_SECRET` | Random string — run `openssl rand -base64 32` |
| `WEB_URL` | Public dashboard URL for links in bot embeds (default `http://localhost:3000`) |

### 3. Set up the database
```bash
npm run db:push       # Push schema to DB
npm run db:generate   # Generate Prisma client
npm run db:seed       # Seed demo data
```

### 4. Register bot commands
```bash
npm run register      # Registers slash commands to your test guild instantly
```

### 5. Run locally
```bash
# Terminal 1 — Bot
npm run dev:bot

# Terminal 2 — Web dashboard
npm run dev:web
```

Web dashboard runs at http://localhost:3000

## Discord Setup (one-time)

1. Invite the bot to your server with scopes: `bot applications.commands`
2. In Discord, run: `/setup channel:#announcements` (or `/setup auto` to provision a full class server)
3. You are now the Classync owner and a TA. Add colleagues with `/setup add-ta`. Students use `/tasks`.
4. Open the dashboard, sign in with Discord, and pick the server.

## Demo Script

See [`docs/PRD.md §7`](docs/PRD.md) for the full 7-step demo script.

1. TA runs `/ta add-item` → the task appears in `/tasks` and on the dashboard
2. Student opens `/tasks` → consents → marks status
3. Five students mark Stuck with same label → "5 students flagged this"
4. One student taps Request TA help → appears in queue + dashboard
5. TA answers from dashboard → DMs arrive, answer pinned in channel
6. Sixth student hits same concept → sees stored answer immediately
7. Item aggregate for another item shows privacy floor live

## Team

Team BudakGPT — IFest 2026 — Universitas Indonesia

- **Helven Marcia** — Integrator
- **Erik Wilbert** — Bot dev  
- **Haekal Handrian** — Web dev
- **Malik Alifan Kareem** — Pitch / QA