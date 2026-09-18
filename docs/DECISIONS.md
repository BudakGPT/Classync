## Classync — Demo Script & Decisions Log
\nAppend-only. One entry per decision made during Hack Day.

| Time | Who | Decision | Reason |
|---|---|---|---|
| 18 Sep 09:00 | Helven | Removed Fastify — using Next.js route handlers instead | One fewer process at 3 AM |
| 18 Sep 09:00 | All | LLM label merging → deterministic normalization + select | Invisible in demo, removes failure point |
| 18 Sep 09:00 | All | Cut: quiz confirm, /split, /reanswer, class-section roles, audit log, /help | 24h from scratch; none affects core loop |
| 18 Sep 14:40 | Helven (agent) | Schema: add `MatchState` enum, `Match` model, `Student.helperOptIn`, back-relations on Student/Item/Concept (peer-matching handoff §2). No message table. | Relayed text is never stored; privacy invariant, not a shortcut |
| 18 Sep 14:40 | Helven (agent) | Peer help runs as a bot-relayed DM conversation, not a private Discord thread | A thread exposes both members' identities the moment they are added; relay keeps the receiver anonymous until they choose to reveal |
| 18 Sep 14:40 | Helven (agent) | `/tasks` status buttons, Stuck picker, Request TA help and Privacy confirm moved from an in-command collector to a component router (`apps/bot/src/interactions/router.ts`, prefix before first `:`) | This branch had no button flow; the peer-match trigger and DM buttons need a persistent router, and the collector-based consent could not handle DM taps |
| 18 Sep 14:40 | Helven (agent) | `acceptMatch`/`resolveMatch` return only the `Match`; the bot resolves the other side via `getActiveMatchForUser` | Keeps `getActiveMatchForUser` the single path that returns both Discord IDs (handoff §3 privacy check) |
| 18 Sep 15:05 | Helven (agent) | `packages/core/src/index.ts` re-exports every service by name instead of `export *`; core stays CommonJS (no `"type": "module"`) | Since 5142804 the ESM bot could not start at all (`does not provide an export named getItemsByGuild`): Node's CJS lexer only sees esbuild's named-export annotation. Restoring `"type": "module"` would re-break the Vercel build |
