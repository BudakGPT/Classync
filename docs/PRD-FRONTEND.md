# Classync — Frontend PRD & Integration Guide

**Author:** Team BudakGPT · Erik Wilbert (Bot) & Integrator  
**Audience:** Frontend Engineer (Haekal Handrian)  
**Target App:** `apps/web` (Next.js 15 App Router)  
**Version:** 2.0 (Private Concept Rooms Integration)  
**Date:** 18 September 2026

---

## 1. Product Context & Objectives

Classync is an academic help-seeking platform pairing a Discord bot with a TA Web Dashboard. Instead of fragmented individual support tickets, Classync clusters student questions around **Item + Concept** pairs (e.g. `Tugas Docker — install docker`).

### Recent Pivot: Private Concept Rooms
We have moved from public forum threads to **Private Concept Rooms**:
1. **Discord Hierarchy:** Every assignment has its own Discord Category (`📁 [Assignment Title]`). Each concept discussion occurs in a private Discord text channel under that category (e.g. `#help-docker-install`).
2. **Voluntary Student Enrolment:** Students can enter a room directly from their `/tasks` menu without needing to mark themselves `Stuck` first. All members in the room can see each other's Discord identity and messages.
3. **Real-Time TA Alerts:** Student questions in private rooms trigger debounced private DMs directly to registered TAs with message snippets and Discord jump links.
4. **Knowledge Persistence:** TAs can answer in Discord or via the Web Dashboard. The answer is posted into the room channel and pinned, but the room remains `OPEN` for follow-up discussions. Rooms are only closed after the assignment due date has passed.

---

## 2. Architecture & Frontend Hard Rules

From `CLAUDE.md`:
1. **Next.js 15 App Router:** Server Components by default; `"use client"` only for forms and interactive modals.
2. **No Discord.js in Web:** `apps/web` must **NEVER** import `discord.js`. All database and Discord-side effects are handled via `@classync/core` services or the outbox pattern.
3. **Outbox Pattern for Answers:** When submitting an answer from the web dashboard, write an `Answer` record via `createAnswer` with `deliveredAt=null`. The bot's deliver worker picks it up within 10 seconds, delivers it to Discord, pins it, and stamps `deliveredAt`.
4. **Server Actions:** All mutations must live in `apps/web/src/actions/*.ts`.
5. **Dates & Timezones:** Dates are stored UTC in PostgreSQL. Format all user-facing dates with `date-fns` / `date-fns-tz` in `Asia/Jakarta` (`id-ID` locale).
6. **Privacy Invariants:**
   - Never display a named student's status unless they submitted an explicit `HelpRequest` or joined a `TopicRoom`.
   - Aggregate counts (e.g. stuck reports) must remain hidden unless reporter count is $\ge 5$.

---

## 3. UI Requirements & Page Specifications

### 3.1 Guild Overview & Help Queue (`/g/[guildId]`)

**Primary Component:** `HelpQueue` / `apps/web/src/views/help/HelpQueue.tsx`

#### Features:
1. **Queue Prioritization:**
   - Display concepts ranked by open explicit help requests first, then by room activity.
   - Use `getTaQueue(guildId)` from `@classync/core`.
2. **Private Room Badge & Direct Link:**
   - For each queue item, inspect `entry.topicRoom`:
     - If `topicRoom?.channelId` exists:
       - Show state badge: **OPEN** (`emerald`) or **CLOSED** (`gray`).
       - Provide an external link button: **"Open Discord Room"** jumping to `https://discord.com/channels/${guild.discordGuildId}/${topicRoom.channelId}`.
       - Display participant count: `entry.topicRoom.members.length` members.
     - If `topicRoom == null`:
       - Show badge: **"No Room Yet"** (student hasn't opened discussion channel).
3. **Explicit Help Requesters:**
   - Render requester avatars/IDs for students who clicked **Request TA help** (`entry.requesters`).
4. **Quick Respond Action:**
   - Clicking **"Respond"** opens `RespondModal` (or navigates to the concept page).
   - Inform the TA: *"Your answer will be pinned in the Discord room and sent via DM to explicit requesters. The room will remain open for follow-up questions."*

---

### 3.2 Concept Detail & Answer Page (`/g/[guildId]/concepts/[conceptId]`)

**Primary Component:** `ConceptPage` / `apps/web/src/views/help/`

#### Features:
1. **Room Overview Card:**
   - Task Title & Due Date (Asia/Jakarta).
   - Concept label.
   - Room Discord Status (`OPEN` vs `CLOSED`).
   - Discord Channel Link button.
   - List of joined students (`TopicRoomMember`) and explicit requesters (`HelpRequest`).
2. **Room Moderation Controls:**
   - **Close Room Button:**
     - **Constraint:** Rooms can **only** be closed after the task due date has passed (`now >= item.dueAt`). If the due date has not passed, disable the button and show tooltip: *"Rooms can only be closed after the assignment deadline (<due date>)."* (If `dueAt` is null, closure is allowed anytime).
     - Action calls server action `closeRoomAction({ roomId, closedById })`.
     - Updates room state to `CLOSED` (channel becomes read-only in Discord).
   - **Reopen Room Button:**
     - Visible only if room is `CLOSED`.
     - Action calls `reopenRoomAction({ roomId })`.
3. **Answer Form:**
   - Textarea with markdown support (max 4,000 characters).
   - Shows recipient count (open requesters + room channel).
   - On submit, invokes `submitAnswer` server action.

---

### 3.3 Assignment Views (`/g/[guildId]/items/[itemId]` & `views/assignments/`)

**Primary Component:** `AssignmentDetail` / `apps/web/src/views/assignments/`

#### Features:
1. **Discord Category Indicator:**
   - Display the linked Discord Category name/ID (`item.discordCategoryId`).
2. **Concept Discussion Rooms List:**
   - Table or card list of all concept rooms under this assignment using `getTopicRoomsForItem(itemId)`.
   - Columns/Fields: Concept Name, Room Status (`OPEN`/`CLOSED`), Members Count, Discord Link, Actions.
3. **Bulk Cleanup Action:**
   - Button: **"Close All Rooms for this Task"**.
   - Disabled until assignment due date has passed (`now >= item.dueAt`).
   - Confirmation modal with checkbox:
     - `[x] Also delete Discord channels and assignment category from server`
   - Calls server action `closeTaskRoomsAction({ itemId, closedById, deleteDiscord: boolean })`.

---

## 4. Data Layer & API Contract (`@classync/core`)

All functions below are already exported by `@classync/core` and ready for use:

### 4.1 Read Queries

```typescript
import {
  getTaQueue,
  getDifficultyList,
  getTopicRoomForConcept,
  getTopicRoomsForItem,
  getTopicRoomsForGuild,
  getItemsByGuild,
  getItemById,
  getAnswersForGuild,
} from "@classync/core";

// 1. Get TA Queue with rooms and members
const queue = await getTaQueue(guildId);
// Returns:
// Array<{
//   conceptId: string;
//   label: string;
//   item: { id: string; title: string; dueAt: Date | null };
//   requesters: Array<{ discordUserId: string; createdAt: Date }>;
//   topicRoom: {
//     id: string;
//     channelId: string | null;
//     state: "OPEN" | "CLOSED";
//     members: Array<{ id: string; studentId: string; joinedAt: Date }>;
//   } | null;
// }>

// 2. Get all rooms for an assignment
const rooms = await getTopicRoomsForItem(itemId);
// Returns:
// Array<{
//   id: string;
//   conceptId: string;
//   channelId: string | null;
//   state: "OPEN" | "CLOSED";
//   concept: { id: string; label: string };
//   members: TopicRoomMember[];
// }>
```

### 4.2 Mutations & Outbox Delivery

```typescript
import {
  createAnswer,
  markRequestsAnswered,
  closeTopicRoom,
  reopenTopicRoom,
} from "@classync/core";

// Posting answer (Outbox pattern)
await createAnswer({
  conceptId,
  authorUserId: session.user.id,
  body: answerText,
});
await markRequestsAnswered(conceptId);
// Note: Room remains OPEN; bot delivery worker will post and pin the answer in Discord.
```

---

## 5. Recommended Server Actions to Implement

Create or update these in `apps/web/src/actions/`:

### `apps/web/src/actions/rooms.ts`

```typescript
"use server";

import { auth } from "@/auth";
import { closeTopicRoom, reopenTopicRoom, getItemById, getConceptById } from "@classync/core";
import { revalidatePath } from "next/cache";

export async function closeRoomAction(roomId: string, conceptId: string, guildId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const concept = await getConceptById(conceptId);
  if (!concept) throw new Error("Concept not found");

  const item = await getItemById(concept.itemId);
  if (item?.dueAt && Date.now() < item.dueAt.getTime()) {
    throw new Error("Cannot close rooms before the assignment due date.");
  }

  await closeTopicRoom(roomId, session.user.id);
  revalidatePath(`/g/${guildId}`);
  revalidatePath(`/g/${guildId}/concepts/${conceptId}`);
}

export async function reopenRoomAction(roomId: string, conceptId: string, guildId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await reopenTopicRoom(roomId);
  revalidatePath(`/g/${guildId}`);
  revalidatePath(`/g/${guildId}/concepts/${conceptId}`);
}
```

---

## 6. Frontend Checklist & Definition of Done

- [ ] **Queue View:** Update `HelpQueue.tsx` / `apps/web/src/app/g/[guildId]/page.tsx` to render the `topicRoom` status badge and Discord jump link.
- [ ] **Concept Detail:** Render the Discord Room card with member count and channel jump link.
- [ ] **Due Date Guard:** Implement the due date check on room closure controls (disable button with explanation if `now < dueAt`).
- [ ] **Answer Form Note:** Add hint in `AnswerForm.tsx` explaining that answers are pinned in Discord and rooms remain open for discussion.
- [ ] **Server Actions:** Implement `closeRoomAction` and `reopenRoomAction` in `apps/web/src/actions/rooms.ts`.
- [ ] **Typecheck & Build:** Verify `npm run typecheck` and `npm run build --workspace=apps/web` pass with 0 errors.
