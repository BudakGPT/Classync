# Classync v2 — Clustered Topic Rooms (Superseded Draft)

**Status:** Superseded by `docs/PRIVATE-ROOMS-IMPLEMENTATION-PLAN.md` (Private Concept Rooms). Refer to `docs/PRIVATE-ROOMS-IMPLEMENTATION-PLAN.md` and `docs/PRD-FRONTEND.md` for current system architecture.

## 1. Product direction

Classync turns private, repeated student difficulties into an optional shared discussion space. A student can first report that they are stuck without revealing their identity. When at least five students report the same concept on the same task, Classync creates one reusable **topic room** for that task and concept. Students may voluntarily join that room, discuss, and receive a single TA answer.

The product is not a conventional ticket system. A ticket per student would reproduce redundant questions and create channel clutter. The unit of discussion is a **clustered concept**, not an individual student.

## 2. Recommended Discord shape

Use one central Discord **Forum Channel**, for example `#classync-help`.

- One forum post/thread = one `Item + Concept`, for example: `Tugas Docker — install docker`.
- The bot creates a topic room only after the privacy floor is reached.
- The post title and opening message contain no student name, no reporter list, and no count beyond the approved aggregate.
- A student chooses **Join discussion** themselves. Joining is voluntary and therefore visibly associates the student with the room; merely reporting `Stuck` never does.
- A solved room is locked/archived but remains readable as a knowledge base.

If the server cannot use Forum Channels, the fallback is one text channel plus one thread per topic. Do **not** create a top-level text channel for every question.

## 3. User roles and authority

| Role | How assigned | Authority |
| --- | --- | --- |
| Classync Owner | First eligible person who runs `/setup channel` after installation | Configures channels, manages TAs, transfers ownership. |
| TA | Explicitly added by the Classync Owner | Uses TA queue, answers any topic, moderates/archives topic rooms. |
| Student | Any ordinary server member who gives consent | Uses private tasks, reports Stuck, joins topic rooms voluntarily, explicitly requests TA help. |

Discord cannot reliably identify the person who clicked the original bot invite. Therefore the first **Manage Server** user who completes setup becomes the Classync Owner. The owner should be stored as `ownerUserId` on the guild record.

Recommended setup policy:

1. Before an owner exists, `/setup channel` requires Discord's **Manage Server** permission and claims ownership for that caller.
2. After an owner exists, only the Classync Owner may change configuration or add/remove TAs.
3. Add `/setup transfer-owner user:@x` for a deliberate handover.
4. The Discord server owner may be a recovery path only if the Classync Owner has left; this should be logged or confirmed to avoid silent takeover.

This avoids the current model where every Manage Server user can silently configure Classync or grant themselves TA access.

## 4. Privacy principles

1. A private `Stuck` report never creates, joins, or exposes a student in a public room.
2. Reporter names and IDs are never shown in aggregate topic rooms.
3. The aggregate threshold remains **five unique stuck reporters** for the same task and concept.
4. The bot may say that a room is available only after the threshold is reached. It must not expose a sub-threshold count or imply how many students reported.
5. Joining a topic room is a voluntary public action by the student, not evidence automatically derived from their private status.
6. An explicit **Request TA help** remains the only path that reveals a student's identity to the registered TA team outside a voluntary public discussion. It is a help signal, not a requirement for a one-on-one conversation.
7. Consent remains required before private statuses, requests, or room invitations are handled. Revoking consent deletes private data but cannot erase messages the student voluntarily posted in Discord; this limitation must be stated at join time.

## 5. Main student flow

### A. Private signal first

1. Student opens `/tasks`, consents, chooses a task, then selects **Stuck**.
2. Student selects an existing concept for that task or types a new label.
3. Classync normalizes the label and records the private status.
4. Below five reports, the student sees: **“Saved privately.”**
5. At five or more reports, the student sees: **“A discussion room is available for this topic.”** and a **Join discussion** button.

### B. Shared topic room, optionally

1. The bot creates or reuses exactly one room for the `Item + Concept` pair.
2. The opening post states the task, concept, and that several students requested clarification; it contains no names.
3. Student presses **Join discussion** and is taken to the room.
4. Students may ask follow-up questions there. This is visible to other room participants because it is an intentional social action.
5. The TA answers once in the room. The bot stores the answer against the concept for future students.
6. Future students who mark the same concept as Stuck immediately see the stored answer and, if the room remains open, may choose to join it.

### C. Private escalation still exists

At any time, the student can choose **Request TA help**. The confirmation must state that their name becomes visible to the registered TAs for that item and concept. This is not required to join the shared room, and it does not require a one-on-one response: any TA may answer once in the shared topic room for everyone.

## 6. Main TA flow

1. Any registered TA opens `/ta queue` or the dashboard and sees concepts ranked by explicit help requests, plus a link/state for an available topic room.
2. Any registered TA can answer from Discord or the dashboard. No TA is assigned exclusively to a requester or room.
3. The canonical response is posted once in the topic room when one exists and stored for future students. An optional DM notification may be sent to explicit help requesters, but the product must not frame the interaction as mandatory one-on-one support.
4. TA can lock/archive a solved topic room. Reopening a room requires a new threshold or an explicit TA action.

## 7. Functional requirements for a future implementation

### R1 — Setup and governance

- Add `Guild.ownerUserId` and persist the first valid setup caller as owner.
- `/setup channel` configures the announcement channel.
- `/setup forum` configures an existing Classync forum channel.
- `/setup create-forum` optionally creates `#classync-help`; this needs the bot's **Manage Channels** permission.
- `/setup add-ta`, `/setup remove-ta`, and `/setup transfer-owner` are owner-only after ownership is claimed.

### R2 — Concept-scoped rooms

- A room is uniquely keyed by `itemId + conceptId`; no duplicate room may be created for the same pair.
- Store the Discord forum post/thread ID and its state (`OPEN`, `ANSWERED`, `ARCHIVED`).
- Room creation is triggered only when the private reporter count first reaches five.
- The bot must tolerate room creation failure without losing the private Stuck report.

### R3 — Joining and consent

- The private task view shows **Join discussion** only if a corresponding open room exists.
- Before the first join, show: “Joining is visible to other participants. Your private Stuck report is not.”
- A join click must not change `ItemStatus` or create a `HelpRequest`.

### R4 — Answers and knowledge reuse

- A TA answer is stored once per concept and shown immediately to future students who report that concept.
- Every registered TA may post the canonical answer; the first answer does not reserve the topic for a particular TA.
- A room answer is posted to the room and optionally pinned.
- Direct-message notifications, if enabled, are sent only to explicit help requesters, never to every Stuck reporter. They are notifications rather than a required one-on-one support channel.

### R5 — Moderation and lifecycle

- TAs may archive/lock a room once answered.
- The room stays readable as a knowledge base.
- A new private cluster after archival does not automatically reveal names; it can notify a TA or trigger a controlled reopen policy.

## 8. Required data-model additions (future work)

These are design requirements only; no schema change has been made.

| Model | Addition | Purpose |
| --- | --- | --- |
| `Guild` | `ownerUserId`, `helpForumChannelId` | Governance and the central forum location. |
| `Concept` or new `TopicRoom` | `threadId`, `state`, `createdAt`, `archivedAt` | One persistent room per task/concept. A separate `TopicRoom` model is preferred for lifecycle history. |
| `Answer` | optional `threadMessageId` | Links the canonical answer to its forum message. |

## 9. Bot permissions for this direction

Required baseline: `View Channel`, `Send Messages`, `Embed Links`, `Manage Messages` (pinning), and `applications.commands`.

For bot-created forums/threads: `Manage Channels`, `Create Public Threads`, `Send Messages in Threads`, and `Manage Threads`. Students must also have permission to view and participate in the configured forum channel.

## 10. Explicit non-goals

- No per-student ticket channel.
- No automatic exposure of Stuck reporters or room membership derived from private data.
- No lecturer, grading, roster import, or per-student TA status view.
- No automatic LLM merging of concept labels.
- No implementation change is included in this draft.

## 11. Acceptance scenario

1. Owner completes setup and assigns a TA.
2. Five students privately mark the same concept as Stuck on the same task.
3. The bot creates one anonymous topic room in `#classync-help`.
4. None of the five reporter names is visible solely because of the cluster.
5. A sixth student sees the stored/available topic and chooses whether to join.
6. One student submits an explicit private TA-help request; only then does the TA see their identity.
7. TA answers in the topic room; the answer is retained for future students and private requesters receive their DM.
