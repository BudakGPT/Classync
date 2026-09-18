# Classync — PRD (Hack Day scope)

Agents: read this file and `CLAUDE.md` at the start of every session. Anything not listed under **MVP** or **Late MVP** is out of scope. Do not build from `classync_context.md` or `classync_early_handoff.md`; they are background only.

## 1. One paragraph

Classync is a Discord bot plus a TA web dashboard. Announcements in a class server become a private per-student checklist. A student can mark an item "stuck" with a concept label, privately. Similar labels cluster. Once five or more students are stuck on the same concept, each of them sees the count, never the names. A student may separately and explicitly request TA help, which reveals their identity to the TA only. The TA sees concepts ranked by demand, answers once, and the answer is delivered privately to every requester, pinned in the channel, and kept for the next student who hits the same concept.

Theme: *Tech for Human Connections*, sub-theme *Receiver & Provider*. Headline: an early-warning system that catches students who are about to fall behind, before the grade does.

## 2. Users

| Persona | Need |
|---|---|
| Student without a network in the class | A way to get help that costs no social capital |
| Quietly stuck student | Private signal, proof they are not alone |
| TA / asisten (installs and owns the bot) | See what the class is stuck on, answer once, stop repeating DMs |

There is no lecturer role. The product is installed by a TA with Manage Server and needs no institutional approval.

## 3. Privacy invariants (product-defining; a feature that breaks one is a bug)

1. A student's `ItemStatus` is visible only to that student.
2. Counts per concept or item are shown only when reporters ≥ 5; otherwise nothing is shown.
3. Identity reaches a TA only through an explicit `HelpRequest`. Tapping "stuck" reveals nothing to anyone.
4. Help requests never appear in any grading context and there is no lecturer view.
5. The bot reads only the registered announcement channel and deliberate interactions. No other channel is read.
6. Student IDs are never sent to the LLM.
7. Consent is asked on first use, revocable via a Privacy button, and revocation deletes the student's data.

## 4. MVP features and acceptance criteria

### Bot (discord.js v14, three top-level commands)

**B1 `/setup`** (requires Manage Server)
- `/setup channel:#announcements` creates or updates the `Guild` row with `discordGuildId`, `announcementChannelId`, and adds the caller to `taUserIds`.
- `/setup add-ta user:@x` appends the user to `taUserIds`.
- Replies ephemerally with what was configured.

**B2 `/tasks`** (any member, ephemeral)
- First use: consent embed with "I agree" button. Nothing else works until agreed. Sets `Student.consentedAt`.
- Lists the guild's items (title, due date, kind, my current status), newest first, max 10.
- Per item, buttons: **In progress**, **Done**, **Stuck**. Clicking updates `ItemStatus` and re-renders.
- **Stuck** opens a select menu of existing concept labels for that item plus "Type a new one" (modal). Label is normalized (trim, lowercase, strip punctuation). Existing match reuses the `Concept`; otherwise creates one.
- After saving stuck: if reporters on that concept ≥ 5, show "N others flagged this". Otherwise show "Saved privately."
- If an `Answer` exists for that concept, show it immediately ("A TA already answered this: …").
- Separate **Request TA help** button, with a confirmation step stating "Your name will be visible to the TA for this item only." Creates `HelpRequest`.
- **Privacy** button: revoke consent and delete all my data in this guild (statuses, requests). Confirmation step required.

**B3 `/ta`** (only `taUserIds`; others get an ephemeral refusal)
- `/ta add-item title: due: kind:` creates an `Item`. `due` accepts `YYYY-MM-DD` or `YYYY-MM-DD HH:mm` in Asia/Jakarta.
- `/ta queue` lists concepts with open requests, ranked by open-request count desc then earliest request, showing item title, label, count, requester display names.
- `/ta answer concept: body:` (concept via autocomplete) creates `Answer`, DMs every OPEN requester, marks their requests ANSWERED, posts the answer as a message in the announcement channel and stores `pinnedMessageId`. Closed DMs are skipped and counted, never thrown.

**B4 Deliver job** (in the bot process, every 10 s)
- Finds `Answer` rows with `deliveredAt = null`, delivers exactly as B3 does, stamps `deliveredAt` and `deliveredCount`. Idempotent: an answer is never delivered twice.

**B5 Reminders** (node-cron, every 15 min)
- For each item with `dueAt` within the next 24 h, DM each consented student whose status is not DONE: title, due time, buttons **Done** and **Still stuck**. One reminder per student per item (track via `ItemStatus.updatedAt` or a `remindedAt` column added by the integrator).

### Web (Next.js 15, TA only)

**W1 Login and guild list**
- "Sign in with Discord" via Auth.js. After login, list guilds where the user's Discord ID is in `taUserIds`. Others see "You are not a TA in any Classync server."

**W2 Guild overview** `/g/[guildId]`
- Tiles: items, consented students, open help requests, answers delivered.
- Difficulty list: concepts ranked by open requests; each row shows item, label, open count, answered/unanswered, colour band (≥5 red, 3–4 yellow, else green).
- **Heat map**: items × last 7 days, cell colour = stuck reports that day. Uses `ItemStatus.updatedAt`.
- Page polls every 5 s (small client component calling `router.refresh()`).

**W3 Answer from the browser** `/g/[guildId]/concepts/[conceptId]`
- Shows the concept, open requester names, prior answers.
- Form: answer body → server action creates `Answer` with `deliveredAt = null`. UI shows "Delivering…" then "Delivered to N" once the bot stamps it.

**W4 Item aggregate** `/g/[guildId]/items/[itemId]`
- Done / in progress / stuck counts, rendered only when ≥ 5 students have any status on the item; otherwise "Not enough reports yet (privacy floor: 5)".

**W5 Knowledge base** `/g/[guildId]/answers`
- Every answer grouped by item, with concept label and delivered count.

### Late MVP (only after B1–B4 and W1–W3 pass the demo script)

**B6 Auto-ingest**
- `messageCreate` handler filtered to `announcementChannelId` only. Sends message text (no author identity) to `core/llm.ts`; expects `{ title, dueAt?, kind }` validated by zod. Creates `Item` with `sourceMessageId`, replies with a card and a **Correct** button (opens modal to edit title/due).
- No API key or invalid LLM output: title = first line, no due date, kind = ASSIGNMENT.

### Cut for Hack Day (documented in PROGRESS.md; do not build)
Quiz/exam confirmation modal, `/split`, `/reanswer`, class-section roles, audit log, `/help`, LLM label merging, calendar, language toggle, share links, roster import, any per-student status view for TAs.

## 5. Data model

Authoritative schema: `packages/core/prisma/schema.prisma` (copied from `hackathon_execution.md` §2). Seven models: Guild, Student, Item, ItemStatus, Concept, HelpRequest, Answer. Discord IDs are strings. Only the integrator edits the schema.

## 6. Seed data (`packages/core/prisma/seed.ts`)

- 1 guild (the team's test server ID from env), 3 items due in 1, 3 and 6 days.
- 12 students; 4 of them are the team's real Discord IDs (from env), the rest fake.
- Item 1: concept "soal nomor 2" with 6 STUCK statuses spread over the last 5 days (varied `updatedAt`), 3 OPEN help requests including one from a real account.
- Item 2: concept "install docker" with 3 STUCK (below threshold, must render as "not enough reports").
- Item 3: no statuses.
- 1 delivered answer on a third concept of item 1 (for the knowledge base and the "already answered" path).

## 7. Demo script (must pass end to end before feature freeze)

1. TA posts an announcement in the registered channel → parsed card appears (fallback: `/ta add-item`).
2. Student opens `/tasks` → consents → checklist → taps In progress.
3. Five accounts tap Stuck with the same label → the fifth sees "5 others flagged this".
4. One account taps Request TA help → confirms → appears in `/ta queue` and at the top of the dashboard.
5. TA answers from the dashboard → DMs arrive on the phones → answer pinned in the channel → dashboard shows "Delivered to N".
6. A sixth account taps Stuck on the same concept → sees the stored answer immediately.
7. Open the item aggregate for item 2 → "Not enough reports yet" (privacy floor, live).

## 8. Glossary

- **Item**: an assignment, quiz, exam or reading with an optional due date.
- **Concept**: a normalized label for a difficulty on an item ("soal nomor 2").
- **Stuck**: private status; reveals nothing.
- **Help request**: explicit, identity-revealing escalation to the TA.
- **Outbox**: an `Answer` with `deliveredAt = null`, waiting for the bot.
- **Privacy floor**: five reporters before any count is shown.
