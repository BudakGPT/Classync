# Classync — Hackathon Execution & AI Context Document

IFest 2026 Hack Day, 18–19 Sep 2026. Team BudakGPT. This file is the single source of truth for the 24 hours. When it conflicts with `classync_context.md` or `classync_early_handoff.md`, this file wins. When it conflicts with the submitted exsum (`classync_proposal.md`), the exsum's *promises* win but this file's *scope cuts* still apply (a cut is documented in PROGRESS.md, not hidden).

---

## 0. Findings from the existing docs

1. **The product is specific, not blurry.** The exsum promises a Discord bot for private academic help-seeking: checklist → "stuck" → concept clustering → explicit help request → TA answers once → delivered to all → answer persists. That is what judges scored. Do not pivot the product. Sharpen the pitch.
2. **`classync_context.md` §5 and §13 are hallucinated.** They claim 13 features are "Done" and reference files (`README.md`, `docs/BOT.md`, `schema.prisma`) that do not exist. Delete those sections before the repo is created. Agents that read it will assume a codebase exists. A committee checkpoint reading "already built" contradicts guidebook rule 7 (code must start at Hack Day).
3. **Guidebook rules that dictate the workflow:**
   - Code starts from scratch after the official start. Docs, accounts and planning are not code.
   - Invite the committee GitHub account as collaborator at the start.
   - Progress checked every 6 hours; progress and flowchart changes must be documented → `docs/PROGRESS.md` entries at T-18, T-12, T-6, T-0.
   - Deliverables: repo with clear install guide, pitch deck, demo video ≤ 5 min, deployment optional. Then 10 min pitch + 5 min Q&A.
4. **Local environment:** Node 26, npm 12, no pnpm, no Docker, no psql → npm workspaces + hosted Postgres (Neon).

---

## 1. The Impact Pivot (pitch, not product)

If the pitch opens with the checklist, judges hear "reminder bot with extra steps". Open with the invisible student.

**Angle A — "The LMS can't see who is stuck. Discord can, without watching anyone."**
An LMS knows who submitted; it has no idea who is silently drowning three days before the deadline. The class already lives in Discord, so that is the only place a one-tap, zero-social-cost signal can exist. Then: "we compute, we don't surveil". Show the schema on a slide: no message table, no per-student view for anyone but that student. Theme fit + Q&A defence in one.

**Angle B — "One answer, fourteen students, and the next cohort."**
The TA is the scarcest resource in the class. Today they answer the same DM fourteen times and nothing accumulates. Classync collapses forty taps into four concepts and turns one reply into a delivered, pinned, reusable answer. Receiver & Provider made literal. Demo it live: one `/ta answer`, several phones buzz.

**Angle C — "Built for the student with no friends in the class."**
Students with a network already have an informal Classync. The product exists for those locked out of it. Bottom-up adoption is the feasibility argument: a TA installs it in 60 seconds, no lecturer, no institution.

Pitch order: A → B → live demo → C as closer. Stay honest on the 5-reporter threshold ("a design floor, not an anonymity guarantee") because the exsum says so.

---

## 2. Architecture & MVP

### Stack (final)

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript everywhere, strict | One type system shared by bot and web; one agent mental model |
| Monorepo | npm workspaces (`apps/bot`, `apps/web`, `packages/core`) | No pnpm installed; no Turborepo needed |
| DB | PostgreSQL on Neon + Prisma 6 | No Docker; Prisma schema is the typed source of truth agents cannot hallucinate around |
| Bot | discord.js v14, `tsx`, node-cron in-process | Outbound websocket only; runs on a laptop for the demo |
| Web | Next.js 15 App Router + Tailwind v4 + shadcn/ui + Auth.js v5 (Discord provider) | Server components call core directly; no API layer to integrate |
| LLM | Optional; Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) behind one function with a no-key fallback | Announcement parsing and label merge only, as promised in the exsum |

**Deviation from exsum:** no Fastify. Next.js route handlers/server actions are the HTTP API. One fewer process at 3 AM.

**Pin these (agents hallucinate across majors):** `prisma@6` (not 7), Tailwind v4 (no `tailwind.config.js`), Auth.js v5 (not NextAuth v4 imports), discord.js v14 `MessageFlags.Ephemeral`, Next 15 `params` is a Promise. Paste `npm ls --depth=0` into CLAUDE.md after scaffolding.

### Repository layout

```
classync/
  CLAUDE.md
  docs/PRD.md  docs/PROGRESS.md  docs/DEMO_SCRIPT.md  docs/DECISIONS.md
  packages/core/               @classync/core: prisma schema + client + services + zod
    prisma/schema.prisma
    prisma/seed.ts
    src/services/{guilds,items,status,concepts,requests,answers}.ts
    src/llm.ts
  apps/bot/                    discord.js — commands/, interactions/, jobs/ — owns ALL Discord I/O
  apps/web/                    Next.js — never imports discord.js
```

**The boundary rule:** the bot owns all Discord I/O. The web never touches Discord. When the web needs a Discord side effect (TA answers from the dashboard), it writes an `Answer` with `deliveredAt = null`; a bot job polls every 10 s and delivers. That outbox is the entire web↔bot contract.

### MVP

**Bot — three top-level commands:**
1. `/setup channel:#announcements` (Manage Server). Creates Guild, stores channel, records installer as TA. `/setup add-ta @user`.
2. `/tasks` (student, ephemeral). Items with buttons: In progress / Done / Stuck. Stuck → select existing concept label or type new (modal). Shows "N others flagged this" only when N ≥ 5. Separate "Request TA help" button with explicit identity warning. Privacy button (revoke + delete). First use asks consent.
3. `/ta add-item | queue | answer` (TA only). `answer` writes Answer, DMs every open requester, marks requests answered, posts the answer as a reply in the announcement channel (pin).

**Web — three features (TA only, Discord login):**
1. Guild overview: item count, consented students, open requests, difficulty list (concepts ranked by open requests, answered/unanswered, red/yellow/green).
2. Answer from the browser → outbox → bot delivers → dashboard polls every 5 s and shows "Delivered to N".
3. Item detail aggregate (done / in progress / stuck) rendered only when ≥ 5 students have a status. Demonstrates the privacy floor live.

**Also MVP (cheap, and they answer judges' questions):**
- Reminders: node-cron job DMs each consented student 24 h before `dueAt` if status ≠ DONE, with "Still stuck?" buttons. This is the funnel into the stuck signal and the answer to "what if nobody taps".
- Knowledge base view (web): every Answer grouped by item. Makes "answers accumulate" visible.
- Difficulty heat map (web): per item, concepts × last 7 days, coloured by open requests. The hero image of the deck. Seed data must have timestamps spread over several days.

**Late MVP (T-13 → T-9, only after answer delivery works):** auto-ingest. Bot listens to the registered channel only, sends text to the LLM, creates the Item and replies with a card + "Correct" button. Without a key: title = first line, no due date. `/ta add-item` stays as the fallback in the demo script. Record it in the video so the live demo can fall back without losing the story.

**Stretch:** LLM merge suggestions for labels (deterministic normalization + select menu is enough for the demo and a cleaner pitch).

**Cut (record in PROGRESS.md):** quiz/exam confirm modal, `/split`, `/reanswer`, class-section roles, audit log, `/help`.

### Data model — `packages/core/prisma/schema.prisma`

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"  url = env("DATABASE_URL") }

model Guild {
  id                    String    @id @default(cuid())
  discordGuildId        String    @unique
  name                  String
  announcementChannelId String?
  taUserIds             String[]  // Discord user IDs allowed to use /ta and the dashboard
  installedAt           DateTime  @default(now())
  items                 Item[]
  students              Student[]
}

model Student {
  id            String       @id @default(cuid())
  guildId       String
  discordUserId String       // Discord snowflakes are ALWAYS String
  consentedAt   DateTime?
  revokedAt     DateTime?
  guild         Guild        @relation(fields: [guildId], references: [id], onDelete: Cascade)
  statuses      ItemStatus[]
  helpRequests  HelpRequest[]
  @@unique([guildId, discordUserId])
}

enum ItemKind { ASSIGNMENT QUIZ EXAM READING }

model Item {
  id              String       @id @default(cuid())
  guildId         String
  title           String
  description     String?
  dueAt           DateTime?
  kind            ItemKind     @default(ASSIGNMENT)
  sourceMessageId String?
  createdAt       DateTime     @default(now())
  guild           Guild        @relation(fields: [guildId], references: [id], onDelete: Cascade)
  concepts        Concept[]
  statuses        ItemStatus[]
}

enum StatusState { NONE IN_PROGRESS DONE STUCK }

model ItemStatus {
  id        String      @id @default(cuid())
  itemId    String
  studentId String
  state     StatusState @default(NONE)
  conceptId String?
  updatedAt DateTime    @updatedAt
  item      Item        @relation(fields: [itemId], references: [id], onDelete: Cascade)
  student   Student     @relation(fields: [studentId], references: [id], onDelete: Cascade)
  concept   Concept?    @relation(fields: [conceptId], references: [id], onDelete: SetNull)
  @@unique([itemId, studentId])
}

model Concept {
  id           String        @id @default(cuid())
  itemId       String
  label        String        // normalized: trimmed, lowercased, punctuation stripped
  aliases      String[]
  createdAt    DateTime      @default(now())
  item         Item          @relation(fields: [itemId], references: [id], onDelete: Cascade)
  statuses     ItemStatus[]
  helpRequests HelpRequest[]
  answers      Answer[]
  @@unique([itemId, label])
}

enum RequestState { OPEN ANSWERED CLOSED }

model HelpRequest {
  id        String       @id @default(cuid())
  conceptId String
  studentId String
  state     RequestState @default(OPEN)
  createdAt DateTime     @default(now())
  concept   Concept      @relation(fields: [conceptId], references: [id], onDelete: Cascade)
  student   Student      @relation(fields: [studentId], references: [id], onDelete: Cascade)
  @@unique([conceptId, studentId])
}

model Answer {
  id              String    @id @default(cuid())
  conceptId       String
  authorUserId    String
  body            String
  createdAt       DateTime  @default(now())
  deliveredAt     DateTime? // null = outbox; bot delivers and stamps
  deliveredCount  Int       @default(0)
  pinnedMessageId String?
  concept         Concept   @relation(fields: [conceptId], references: [id], onDelete: Cascade)
}
```

Absent by design: message table, per-student score, any service that returns a named student's status to anyone but that student. Put the schema on a slide.

---

## 3. CLAUDE.md (paste at repo root in the first commit)

```markdown
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
<paste `npm ls --depth=0` here after scaffolding>
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
```

Rule 2 prevents three agents producing three divergent migrations. The "UNVERIFIED" rule exists because one hallucinated status doc already happened.

---

## 4. The 24-hour timeline

Roles (fixed for 24 h):
- **Integrator (Helven):** owns `main`, schema, CLAUDE.md, merges, PROGRESS.md. Reviews every diff touching `packages/core`. Writes the core services first.
- **Bot dev (Erik):** `apps/bot`: `/setup`, `/tasks`, `/ta`, deliver job, reminders, auto-ingest.
- **Web dev (Haekal):** `apps/web`: Discord login + TA gate, overview, heat map, answer form + polling, item aggregate, knowledge base.
- **Pitch/QA (Malik):** student interviews, seed data, demo script, test server + alt accounts, deck, video, README verification. Runs the demo script on `main` after every merge.

Each dev runs one Claude Code session per task. Tasks are 30–90 min chunks with acceptance criteria. Never "build the bot".

### Before the start (no code)
- Discord application + bot token + invite URL (`bot applications.commands`) + test server. Message Content intent only if attempting auto-ingest.
- Neon account + empty DB. Vercel account. GitHub org/repo name agreed (create the repo at start, not before).
- Six Discord accounts total (5 stuck reporters + 1 TA for the threshold demo).
- Claude Code installed and logged in on all four laptops.
- PRD.md finalized from this document + exsum. Delete §5/§13 of `classync_context.md`.
- Seed announcement texts (Indonesian) and DEMO_SCRIPT.md written.
- **Interviews (Malik, tonight or during T-24 → T-20):** 5–6 close friends, 10 min each, voice or chat. Stories first, product last. Capture verbatim quotes and consent to use them with a first name or initial.
  1. Last time you were stuck on an assignment, what did you do first?
  2. Did you ask the TA or dosen? If not, why not? (let the silence work)
  3. Who did you end up asking? What if that person hadn't been available?
  4. How do you find out about deadlines now? Ever missed one because it scrolled away?
  5. One-sentence product description: "a private 'stuck' button in the class Discord; the TA sees which topics are hot, not who tapped." First reaction? Note if they raise privacy unprompted.
  6. Would you tap it? What would stop you?
  Slide output: "we asked N students": how many didn't ask the TA, how many asked a friend instead, 2–3 quotes. Frame it as "six students, not a study".

### Schedule

| Window | Mode | Work | Gate |
|---|---|---|---|
| T-24 → T-23 | Human | Create repo, invite committee GitHub account. Commit CLAUDE.md, PRD.md, schema.prisma, .env.example. Scaffold workspaces with one agent session while others watch. | `npm run typecheck` green on all four laptops; everyone runs web + bot locally |
| T-23 → T-21 | Agent, integrator reviews | Walking skeleton: `/setup` writes Guild, `/tasks` reads it back ephemerally, web logs in with Discord and lists guilds where user is TA. Seed: 1 guild, 3 items, 8 students, 1 concept with 6 stuck + 3 open requests. | One row travels Discord → DB → browser. Do not parallelize before this. |
| T-21 → T-15 | Agents autonomous, parallel | Bot: `/tasks` buttons, stuck flow, concept select, request help. Web: overview + difficulty list. Core: services with privacy invariants. Merge every 2 h. QA runs demo script per merge. | **T-18 checkpoint:** PROGRESS.md entry 1 |
| T-15 → T-13 | Human | Integration checkpoint. Full demo script with real accounts. Fix. No new work. | Demo steps 1–6 pass end to end |
| T-13 → T-9 | Agents, parallel | `/ta answer` + DM batch + pin. Web answer via outbox + bot deliver job + 5 s polling. Item aggregate view. Then bot: reminders, then auto-ingest. Web: heat map, then knowledge base. Sleep rotation: two sleep 2 h, then swap. | **T-12 checkpoint:** PROGRESS.md entry 2 + updated flowchart |
| T-9 → T-7 | Agents, small scoped | Finish whatever of reminders / auto-ingest / heat map / knowledge base is not done. Pitch/QA builds deck with interview quotes. | Not merged by T-7 = deleted |
| **T-7** | **Feature freeze** | `main` locked to bug fixes. Agent writes README install guide; a teammate follows it on a clean clone. | Fresh clone runs from README alone |
| T-7 → T-4 | Human + agents for fixes | Bug bash against demo script on real accounts. Polish embeds and copy. Deploy web to Vercel. | **T-6 checkpoint:** PROGRESS.md entry 3 |
| T-4 → T-2 | Human | Reseed DB. Record demo video with live bot, ≤ 5 min, two takes. Finish deck. | Video exported and uploaded |
| T-2 → T-0.5 | Human | Three timed rehearsals of 10 min pitch. Q&A prep: surveillance, ticket bot, why not LMS, nobody taps. Tag release commit. | PROGRESS.md entry 4. Repo, deck, video ready |
| T-0.5 → T-0 | Nothing | Charge laptops. Reseed for live demo. Hotspot backup. Nobody touches `main`. | |

### Agents unattended vs human-reviewed
- **Unattended:** scaffolding, CRUD services from schema, UI from described layout, seed scripts, README, embed formatting, service tests.
- **Human reads every line:** `packages/core/src/services` touching privacy invariants, outbox delivery job, dashboard auth gate, command registration.

### Merge discipline
Feature branch per person. Commit at every green typecheck. Rebase on `main` before merge. Integrator merges. 5-minute standup at each checkpoint hour and at T-15, no more often.

### Pitch framing (decided)
- Headline: **early warning**, not help-seeking. "Classync catches the students who are about to fall behind, before the grade does."
- Order: invisible-student problem with interview quotes → "one answer, many students, next cohort" → live demo → "built for the student with no friends" closer.
- Say out loud: "AI does the plumbing, the human gives the answer." Differentiates from every chatbot team in the room.
- Do not pitch LLM label merging. Do pitch the schema as the privacy argument.
- Q&A prep: "what if nobody taps" → reminders are the funnel; "surveillance" → schema + exclusion list; "ticket bot" → clustering, batch, reuse; "why not LMS" → the LMS knows who submitted, not who is stuck.

### Demo script (the six steps that must work)
1. TA posts an announcement in the registered channel → parsed card appears (fallback: `/ta add-item`).
2. Student opens `/tasks` → ephemeral checklist, taps status.
3. Five students tap Stuck with the same label → "5 others flagged this" appears at the fifth.
4. One student taps Request TA help → appears in `/ta queue` and on the dashboard, ranked first.
5. TA answers from the dashboard → phones buzz with the DM; answer pinned in the channel; dashboard shows "Delivered to N".
6. A sixth student taps Stuck on the same concept → sees the stored answer immediately.
