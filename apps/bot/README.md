# Classync Discord bot

The bot implements the MVP Discord flow in the PRD: server setup, private student tasks and consent, TA requests/answers, outbox delivery, and 24-hour reminders. It deliberately does **not** auto-ingest announcements (B6 is Late MVP).

## Prerequisites

- Node.js 20+
- A Neon PostgreSQL connection configured as `DATABASE_URL`
- A Discord application with a bot user

Create a repository-root `.env` from `.env.example`. The bot requires `DATABASE_URL`, `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, and `DISCORD_GUILD_ID`.

In the Discord Developer Portal, invite the bot with the `bot` and `applications.commands` scopes. Give it permission to send messages, send DMs, and manage messages (pinning is best-effort if this is unavailable). No Message Content Intent is needed for B1–B5.

## Run locally

From the repository root:

```bash
npm install
npm run db:push
npm run db:generate
npm run register
npm run dev:bot
```

`npm run register` registers the three guild-scoped slash commands immediately in `DISCORD_GUILD_ID`.

## Command guide

| Command | Who can use it | Purpose |
| --- | --- | --- |
| `/setup channel` | Manage Server | Registers the announcement channel and makes the caller a TA. |
| `/setup add-ta` | Manage Server | Adds another TA. |
| `/tasks` | Any server member | Presents consent, then a private task list. Choose a task to mark it in progress, done, or stuck. |
| `/ta add-item` | Registered TA | Adds an item. Due dates are Jakarta-local (`YYYY-MM-DD` or `YYYY-MM-DD HH:mm`). |
| `/ta queue` | Registered TA | Lists explicit, open help requests and requester display names. |
| `/ta answer` | Registered TA | Uses concept autocomplete, writes an answer to the outbox, then the worker delivers it. |

Discord allows at most five component rows per message. `/tasks` therefore lists up to ten tasks, then uses a task selector to open the status buttons for the selected item. This preserves the complete per-item flow within Discord's component limit.

## Privacy and delivery behavior

- A `Student` row is not created until **I agree** is clicked.
- Stuck counts are only displayed once at least five students report the same concept. Requester names are visible only after an explicit **Request TA help** confirmation.
- The outbox worker starts immediately and repeats every 10 seconds. It DMs requesters, posts and attempts to pin the answer in the configured announcement channel, then stamps delivery.
- The reminder job runs every 15 minutes. It sends one DM per student/item for tasks due in the next 24 hours, with **Done** and **Still stuck** buttons.
- Closed DMs and pin failures are logged and do not abort delivery to other students.

## Validate

```bash
npm run typecheck
```

For an end-to-end check, use `/setup channel`, add an item, consent with `/tasks`, then exercise the status and TA-help buttons. Add an answer with `/ta answer` and wait up to 10 seconds for the outbox worker.
