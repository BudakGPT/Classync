# Classync Discord bot

The bot implements private task statuses, consent, explicit TA escalation, and clustered discussion rooms. It deliberately does **not** auto-ingest announcements (B6 is Late MVP).

## Prerequisites

- Node.js 20+
- A Neon PostgreSQL connection configured as `DATABASE_URL`
- A Discord application with a bot user

Create a repository-root `.env` from `.env.example`. The bot requires `DATABASE_URL`, `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, and `DISCORD_GUILD_ID`.

In the Discord Developer Portal, invite the bot with the `bot` and `applications.commands` scopes. No Message Content Intent is needed.

| Permission | Why it is needed |
| --- | --- |
| `View Channel`, `Send Messages`, `Embed Links` | Private command responses, room opening posts, and canonical answers. |
| `Create Public Threads`, `Send Messages in Threads` | Creates and replies in topic rooms. |
| `Manage Threads` | Locks, archives, and explicitly reopens rooms. |
| `Manage Messages` | Pins the canonical room answer; pinning is best-effort. |
| `Manage Channels` | Needed only for `/setup create-forum`; not needed when an owner configures an existing forum. |

## Run locally

Run dependency installation once from the repository root:

```bash
npm install
```

### PowerShell (Windows)

Prisma runs from the `packages/core` workspace, so load the repository-root `.env` into the current shell before running `db:push`:

```powershell
$envLine = Get-Content -LiteralPath .env |
  Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } |
  Select-Object -First 1

if (-not $envLine) { throw "DATABASE_URL is missing from the repository-root .env" }

$env:DATABASE_URL = ($envLine -replace '^\s*DATABASE_URL\s*=\s*', '').Trim().Trim('"')

npm run db:push
npm run db:generate
npm run register
npm run dev:bot
```

### macOS / Linux

```bash
set -a
. ./.env
set +a

npm run db:push
npm run db:generate
npm run register
npm run dev:bot
```

`npm run db:push` applies the Prisma schema to the Neon database; `npm run db:generate` only regenerates the local Prisma Client. `npm run register` registers the guild-scoped slash commands immediately in `DISCORD_GUILD_ID`.

### After a schema or command change

- For a Prisma schema change, repeat `db:push`, then `db:generate`, and restart the bot.
- For a slash-command change, also run `npm run register` before restarting the bot.

## Command guide

| Command | Who can use it | Purpose |
| --- | --- | --- |
| `/setup channel` | First caller: Manage Server; afterwards: Classync Owner | Registers announcements and claims Classync ownership. |
| `/setup forum` | Classync Owner | Uses an existing forum, or a text/announcement channel as thread fallback. |
| `/setup create-forum` | Classync Owner | Creates and configures `#classync-help`. |
| `/setup add-ta`, `/setup remove-ta`, `/setup list-ta`, `/setup transfer-owner` | Classync Owner | Manages TA access, lists registered TAs, and transfers ownership. |
| `/tasks` | Students (not registered TAs) | Presents consent, then active private tasks for reporting Stuck, optionally joining a topic room, or explicitly requesting TA help. Tasks past their due date are hidden. |
| `/ta add-item` | Registered TA | Adds an item. Due dates are Jakarta-local (`YYYY-MM-DD` or `YYYY-MM-DD HH:mm`). |
| `/ta queue` | Registered TA | Lists explicit help requests and topic-room state; names appear only for explicit requests. |
| `/ta answer` | Registered TA | Stores a canonical answer, posts it to the room, and notifies explicit requesters. |
| `/ta archive-room`, `/ta reopen-room` | Registered TA | Locks/archives a solved room, or explicitly reopens it. |

Discord allows at most five component rows per message. `/tasks` therefore lists up to ten tasks, then uses a task selector to open the status buttons for the selected item. This preserves the complete per-item flow within Discord's component limit.

## Privacy and delivery behavior

- A `Student` row is not created until **I agree** is clicked.
- A private **Stuck** report never names, joins, or exposes a student. At five unique reporters for an item/concept, the bot creates one anonymous topic room. It never exposes a sub-threshold count.
- **Join discussion** is voluntary and first explains that membership/messages are visible to participants; it does not alter a private status or create a help request. Revoking consent cannot erase messages voluntarily posted in Discord.
- Requester names are visible only after an explicit **Request TA help** confirmation. The outbox worker starts immediately and repeats every 10 seconds; it posts/pins a canonical answer in the topic room and DMs only explicit requesters.
- The reminder job runs every 15 minutes. It sends one DM per student/item for tasks due in the next 24 hours, with a **Still stuck** button.
- Closed DMs and pin failures are logged and do not abort delivery to other students.

## Validate

```bash
npm run typecheck
```

For an end-to-end check, use `/setup channel`, add an item, consent with `/tasks`, then exercise the status and TA-help buttons. Add an answer with `/ta answer` and wait up to 10 seconds for the outbox worker.
