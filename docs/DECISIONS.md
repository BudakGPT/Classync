## Classync — Demo Script & Decisions Log
\nAppend-only. One entry per decision made during Hack Day.

| Time | Who | Decision | Reason |
|---|---|---|---|
| 18 Sep 09:00 | Helven | Removed Fastify — using Next.js route handlers instead | One fewer process at 3 AM |
| 18 Sep 09:00 | All | LLM label merging → deterministic normalization + select | Invisible in demo, removes failure point |
| 18 Sep 09:00 | All | Cut: quiz confirm, /split, /reanswer, class-section roles, audit log, /help | 24h from scratch; none affects core loop |
| 18 Sep 12:50 | Helven | `seed.ts` moved out of core's build tsconfig into `tsconfig.seed.json`, chained into `npm run typecheck` | Fixes TS6059 (rootDir). Alternative was dropping `prisma/**/*` from typecheck entirely — rejected: seed.ts is 209 lines and `m13` reseeds from it for the video at 05:00, so silent breakage there is unacceptable |
| 18 Sep 12:50 | Helven | Bot error reply object marked `as const` | `flags: MessageFlags.Ephemeral` widened to the enum and failed `BitFieldResolvable`. Alternative was annotating as `InteractionReplyOptions` — `as const` is smaller and needs no extra import |
| 18 Sep 12:50 | Helven | Auto-ingest (B6) gated behind `ENABLE_AUTO_INGEST`, default false | It fires on every `messageCreate` and is the only feature that can fail on stage; `/ta add-item` is the scripted fallback. Alternative was commenting the listener out — rejected: a flag re-enables it at 18:00 with zero code change, and missing/unset env fails safe to disabled |

