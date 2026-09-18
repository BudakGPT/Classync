# Classync: PRD Handoff

**IFest 2026 Hackathon** | Grand Theme: *Tech for Human Connections* | Sub-theme: *Receiver & Provider*

A Discord bot that turns a class announcement channel into a private per-student checklist, collapses scattered confusion into ranked concepts, and lets one TA answer many students at once.

> Working doc in English. Submitted executive summary must be Bahasa Indonesia with English technical terms in *italics*.

---

## 1. Problem

1. **Announcements are ephemeral.** A deadline posted Tuesday is thirty messages up by Thursday. No per-student state exists anywhere, so "did I do that one" is answered by scrolling.
2. **Being stuck is socially expensive.** Asking in a channel of forty peers is a public admission. Most students absorb it silently, so difficulty is invisible until it is graded.
3. **The TA answers the same question fourteen times.** Questions arrive as scattered DMs and one-off channel posts. Nothing accumulates, nothing is reusable, and there is no view of what the class is actually stuck on.

Consequence: a solvable, widely shared confusion goes unaddressed for two weeks while the person who could resolve it in five minutes has no idea it exists.

**Context note:** in most Indonesian classes the Discord server is created and run by a TA or ketua kelas, sometimes the dosen. Announcements are relayed from EMAS or SCELE. The product is therefore installed and owned by the TA, requiring no institutional approval. The pitch must never depend on a lecturer adopting it.

---

## 2. Users

| Persona | Situation | Needs |
|---|---|---|
| **Quietly stuck student** | Behind on one item, will not post publicly | Private way to signal, and proof they are not alone |
| **Student without a network** | Joined late, quiet, no class friends. **The core underserved user** | An entry point that does not require social capital |
| **TA / asisten** | Owns the server, fields repeat questions, no visibility | To see what the class is stuck on, and answer once |
| **Ketua kelas / PJ / TA / Dosen** | Relaying announcements, chased for repeats | The announcement to persist and answer itself |

**Real competitor:** not EMAS, not other bots. The informal DM network. Students with friends already have a working Classync. The product exists for those locked out of it.

---

## 3. Core loop

```
Announcement posted in channel
  -> auto-parsed into a ClassItem (title, deadline, kind)
  -> appears in every student's private checklist

Student taps status: done / in progress / stuck
  -> on stuck: types or picks a concept label
  -> LLM merges near-duplicates ("soal 2" = "nomor 2" = "bagian 2")
  -> student sees shared count: "7 others flagged this"

Student may escalate: stuck (private) -> help request (identity visible to TA)

TA dashboard: merged concepts ranked by demand
  -> TA answers a cluster ONCE
  -> answer delivered privately to every requester, optionally pinned to the item
  -> answer persists and is reusable next cohort
```

---

## 4. Design principles

1. **Single-player value first.** The checklist must be worth using with zero classmates. Density accrues as a byproduct of solo use, never as a precondition for it.
2. **Private by default, aggregate in public.** Individual status is visible to that student only. Anything leaving the individual is counted, never named.
3. **Disclosure is an act, not a state.** Tapping *stuck* reveals nothing. A separate explicit tap converts it to a help request, revealing identity to the TA for that item only.
4. **Never near assessment.** Help requests are never visible to the dosen and never surfaced in any grading context.
5. **Compute, do not surveil.** We read the announcement channel with consent and explicit taps. No conversation analysis, no inference about a person.
6. **Answering accumulates.** Every answer lands with a cluster and persists, so effort compounds instead of evaporating.
7. **Consent is explicit, revocable, and never a condition of participating in the class.**

---

## 5. Scope

### Must have

| ID | Feature |
|---|---|
| M1 | `/setup` binds bot to a class, designates announcement channel, installer consent |
| M2 | Auto-ingest announcements into structured items. Optimistic parse, anyone can correct. Modal confirm required only for `quiz`/`exam` |
| M3 | Private checklist via `/tugas`, ephemeral, requester-only |
| M4 | One-tap status: done / in progress / stuck |
| M5 | Free-text concept label on stuck; later students pick existing or add new |
| M6 | LLM near-duplicate merging of concept labels |
| M7 | Shared count shown to the stuck student ("7 others flagged this") |
| M8 | Escalate to help request (two-step disclosure) |
| M9 | TA queue: merged concepts ranked by demand |
| M10 | Batch answer: TA replies once, delivered privately to all requesters |
| M11 | Private deadline reminders based on the student's own status |
| M12 | Consent, opt-out, data deletion |

### Should have

| ID | Feature |
|---|---|
| S1 | Answer reuse: resolved concepts surface to future students hitting the same label |
| S2 | Web dashboard for the TA: difficulty over time per item |
| S3 | Aggregate class view `/kelas`: counts per item, released only at 5+ reporters |
| S4 | Pin resolved answers to the item so they stop scrolling away |

### Could have

Calendar view on dashboard. Resource pinning. ID/EN toggle. Signed share link for an asisten outside the server.

### Won't have

| Excluded | Why |
|---|---|
| Peer-to-peer help matching or study rooms | Two-sided marketplace, unbootstrappable in one semester. Its emotional payload is delivered by M7 at a fraction of the cost |
| Any per-student **status** view for TA, dosen, or peer | The line. Only chosen help requests reveal identity |
| Message content analysis or sentiment inference | Same line |
| Rankings, scores, completion leaderboards | Converts support into competition, shames the slowest |
| File or answer transfer between students | Academic integrity |
| Admin bulk roster import, class channel templating, role generation | Top-down, efficiency-framed, expensive, off-theme |
| Admin-composed announcement scheduling | Reverses the data flow. We read what already exists |
| LMS integration, WhatsApp, native mobile | Scope |

---

## 6. Differentiation

Ticket bots exist and TAs already use them. Classync is not a ticket bot because of three things, and the demo must show all three:

1. **Clustering.** Forty raw taps collapse into four concepts.
2. **Answer once, deliver to many.** One TA reply reaches fourteen students.
3. **Reuse.** Answers persist across cohorts. The second run of the course starts with a knowledge base.

If the pitch leads with the checklist, we will be read as a reminder bot with extra steps.

---

## 7. Architecture

```
Discord (announcements, taps, DMs)
  <-> Bot process (discord.js v14 gateway)
Scheduler (node-cron, reminders + threshold checks)
HTTP API (Fastify)
  -> Domain services (items, status, clustering, requests, answers, consent)
    -> PostgreSQL via Prisma
    -> LLM endpoint (validated JSON): announcement parse + label merge
Next.js + Tailwind dashboard -> API
```

One repo, one deploy. Two deployments is two sets of environment problems at 3am.

### Data model

```
Guild        id, discord_guild_id, announcement_channel_id, installed_at
ClassItem    id, guild_id, title, description, due_at,
             kind (tugas|quiz|reading), source (manual|ingested), confirmed_at
Student      id, guild_id, discord_user_id, class_label (self-declared), joined_at
Consent      id, student_id, granted_at, revoked_at, scope_version
ItemStatus   id, item_id, student_id, state (none|in_progress|done|stuck),
             concept_id (nullable), updated_at
Concept      id, item_id, canonical_label, merged_from[], request_count
HelpRequest  id, concept_id, student_id, state (open|answered|closed), created_at
Answer       id, concept_id, author_id, body, delivered_at, pinned
Aggregate    id, item_id, done_count, progress_count, stuck_count, computed_at
```

Absent by design: no message table, no sentiment field, no per-student score, no query path returning a student's *status* to anyone but that student. **The schema is the privacy argument. Put it on a slide.**

### Rules

- Aggregates release only at **5+ reporters** on an item. Below that, a count is effectively a name.
- Concept merging is LLM-proposed and reversible. A wrong merge must be splittable.
- Matching and help requests are disabled by default on `quiz` items.

---

## 8. Hack Day build order

Ingestion is the only piece that can fail live, so it ships last and degrades to manual entry.

1. Schema + **seed script** (day one, not hour 22)
2. Checklist + status taps
3. Concept labels + shared count
4. Help request + TA queue
5. Batch answer delivery
6. Dashboard
7. LLM parsing and merging, with hard-coded fallback demo path

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| Nobody taps anything | Checklist is useful alone (Principle 1). Reminders create the prompt. Residual risk, state it honestly |
| Low adoption means no clustering | Degrades to a slow ticket queue, not to nothing. Clustering amplifies, it is not a precondition |
| TA capacity is finite | Batch answering is the whole point. One reply, N recipients |
| Students fear grade consequences | Two-step disclosure. Requests never visible to dosen, never near assessment. Say this out loud |
| "Why not EMAS/SCELE" | Nobody opens the LMS between deadlines. The class lives in Discord. The LMS has no idea who is stuck |
| "Isn't this surveillance" | Show the schema and the deliberately excluded features |
| "Isn't this just a ticket bot" | Section 6, delivered before they finish asking |
| Demo looks dead with no data | Seed script first |
| LLM fails on stage | Strict schema validation, one retry, manual fallback |

---

## 10. Open items

- **Host at angkatan/himpunan level, not per class.** Class servers die every semester and reset adoption to zero. Decide before writing the exsum.
- **Run a 20-person poll** in an existing class Discord: how often stuck, how often told nobody. Converts Latar Belakang from assertion to evidence. Relevansi & Korelasi is 25% of the score.
- **Helper incentive:** optional private end-of-semester summary of contributions, screenshottable for an asisten application. No public ranking. Undecided.
- Confirm whether submission requires declaring a sub-theme.

---

## 11. Exsum mapping

Max 5 pages body. Times New Roman 14 titles, 12 body. Bahasa Indonesia, English terms *italicised*.

| Section | Source |
|---|---|
| Latar Belakang dan Analisis Masalah | §1, §2, plus poll data and one honest paragraph from §9 |
| Tujuan | One objective traced to each of the three problems in §1. That traceability is what the 25% criterion scores |
| Solusi yang Ditawarkan | §3, §4, §5 (Must + Should), simplified §7 diagram |
| Daftar Pustaka | Verify every source. Cite nothing nobody on the team has opened |

Keep competitive comparison to three sentences. Save the full version for pitch Q&A.

**Scoring weights:** Format 5% | Kesesuaian Tema 20% | Relevansi & Korelasi 25% | Kelayakan Ide 20% | Metodologi Solusi 30%.
