# Classync — Agent Rules

## What this is
Discord bot + TA web dashboard for private academic help-seeking. Read docs/PRD.md for product
scope. Anything not in PRD.md "MVP" is out of scope unless a human says otherwise in this session.

## Repo map
- packages/core  (@classync/core): Prisma schema + client, domain services, zod schemas. ALL DB access lives here.
- apps/bot: discord.js v14. Thin adapters: parse interaction → call core service → reply. Owns ALL Discord I/O.
- apps/web: Next.js 15 App Router. Server components/actions call core services directly. NEVER imports discord.js.
- docs/: PRD.md (scope), DECISIONS.md (append-only log), PROGRESS.md (6-hour checkpoints), DEMO_SCRIPT.md.

## Installed versions (do not upgrade; APIs differ across majors)
<!-- paste `npm ls --depth=0` here after scaffolding -->
Gotchas: Prisma 6 (NOT 7: no prisma.config.ts, url stays in schema.prisma). Tailwind v4 (no tailwind.config.js,
use @import "tailwindcss" in globals.css). Auth.js v5 (import { auth } from "@/auth", not getServerSession).
discord.js v14: use `flags: MessageFlags.Ephemeral`, not `ephemeral: true`. Next 15: route `params` is a Promise.

## Hard rules
1. TypeScript strict. No `any`, no `@ts-ignore`, no non-null `!` on DB results. Validate every external input with zod.
2. Schema changes: ONLY the integrator edits packages/core/prisma/schema.prisma. Others request it in DECISIONS.md.
   After a change: `npm run db:push && npm run db:generate`. Never write raw SQL.
3. Discord IDs (guild, user, channel, message) are `String`. Never parse to number.
4. Business logic lives in packages/core/src/services/*.ts as plain async functions taking typed args.
   Bot commands and web actions must be < 40 lines each and contain no Prisma calls.
5. Web → Discord side effects go through the outbox: write Answer with deliveredAt=null; apps/bot/src/jobs/deliver.ts picks it up.
6. Privacy invariants (breaking these fails the product):
   - No function returns a named student's ItemStatus to anyone except that student.
   - Aggregates (counts per item/concept) are returned only when reporter count >= 5; else return null.
   - Identity reaches a TA only through HelpRequest. Never join Student into concept counts.
   - Student IDs are never sent to the LLM.
7. LLM calls go through packages/core/src/llm.ts only. Output is zod-validated; on failure retry once, then return null.
   Everything must work with no API key.
8. Bot: one file per command in apps/bot/src/commands/<name>.ts exporting { data, execute }. Register per-guild
   (instant) via `npm run register`, never global (1h propagation). Wrap every execute in try/catch → ephemeral error.
   DM failures (closed DMs) are logged and skipped, never thrown; batch delivery continues.
9. Web: server components by default; "use client" only for polling/forms. Mutations are server actions in
   apps/web/src/actions/*.ts. Use shadcn/ui components; do not add another UI library.
10. Dates stored UTC. Display with date-fns in Asia/Jakarta.
11. No new dependencies without asking a human. Allowed: prisma, @prisma/client, zod, discord.js, node-cron, next,
    react, next-auth, tailwindcss, shadcn/ui deps, date-fns, tsx, dotenv.
12. Env vars are declared in .env.example with a comment. Never hardcode tokens or IDs. Never commit .env.
13. Files > 250 lines get split. Functions > 50 lines get split.

## Definition of done for any task
- `npm run typecheck` passes at repo root.
- You ran the feature (bot: real Discord test server; web: `npm run dev`) and describe exactly what you observed.
- You did NOT claim something works that you did not run. If you could not run it, say "UNVERIFIED".
- One entry appended to docs/DECISIONS.md if you chose between alternatives.

## Working style
- Read before writing. Grep for an existing service before creating one.
- Do the task as scoped. Do not refactor neighbouring code. Do not add features "while you're here".
- If the task is unclear or conflicts with PRD.md, stop and ask; do not guess.
