# Classync — Private Concept Rooms: Implementation Plan

**Status:** approved design direction; no code implementation in this document.

## Decision and privacy change

Replace the anonymous, voluntary public-forum room model with one **private room per `Item + Concept`**. The first student who explicitly sends a question creates the room. Later students who report the same concept may be added to that room automatically.

This is not anonymous: all members of a room can see one another's Discord identity and messages. Consent text must explicitly say this before a student sends a question or is added to a matching room. A private `Stuck` report by itself should remain private unless the product explicitly chooses automatic enrolment.

## 1. Data model

Add a separate room and membership model; do not store room members in an array field.

```prisma
enum TopicRoomState {
  OPEN
  CLOSED
}

model TopicRoom {
  id          String         @id @default(cuid())
  conceptId   String         @unique
  channelId   String         @unique
  state       TopicRoomState @default(OPEN)
  createdAt   DateTime       @default(now())
  closedAt    DateTime?
  closedById  String?
  concept     Concept        @relation(fields: [conceptId], references: [id], onDelete: Cascade)
  members     TopicRoomMember[]
}

model TopicRoomMember {
  id          String    @id @default(cuid())
  roomId      String
  studentId   String
  joinedAt    DateTime  @default(now())
  room        TopicRoom @relation(fields: [roomId], references: [id], onDelete: Cascade)
  student     Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([roomId, studentId])
}
```

Keep `Answer` as the canonical knowledge record. Add a message notification setting only if it is needed later; notification events do not need to be persisted for the first version.

## 2. Room/channel provisioning

Use one configured parent category or forum/text channel. Recommended first implementation: a normal text channel under a configured category, named from a safe slug such as `help-<item-id-short>-<concept-slug>`.

On first explicit question:

1. Create/reserve `TopicRoom` by `conceptId` in the database.
2. Create the Discord channel with permission overwrites:
   - `@everyone`: deny `ViewChannel`.
   - registered TAs: allow `ViewChannel`, `SendMessages`, `ReadMessageHistory`.
   - requesting student: allow the same member permissions.
   - bot: allow view, send, manage messages/channels.
3. Store `channelId` only after Discord creation succeeds.
4. Post a neutral opening message: task name, concept, visibility notice, and room rules.
5. Add the first student to `TopicRoomMember`.

Use a database provisioning claim/transaction so two simultaneous questions cannot create duplicate rooms. If Discord channel creation fails, preserve the private question/status and report a retryable error.

## 3. Queue and TA room selection

Extend `/ta queue` to show rooms ordered by open explicit requests, then latest student message.

Each queue entry should contain:

- task title and concept;
- room state (`OPEN` or `CLOSED`);
- number of members, without exposing this outside the TA team;
- a Discord channel link;
- open help-request count and requester names only where consented through Request TA help.

Add a room autocomplete option to TA commands. TAs can select a room for answer, close, or reopen actions; no TA is assigned exclusively to a room.

## 4. Adding matching students

Decide the enrolment trigger before implementation:

- **Recommended:** when a student clicks **Ask/join this private discussion** after seeing a matching open concept. Show a warning that other room members can see their identity.
- **Automatic enrolment:** when a student marks the same concept `Stuck`. This must be called out in consent and is a stronger privacy change.

For either model, the service must:

1. Check consent and that the student is not a registered TA.
2. Confirm the room is open and belongs to that item's concept.
3. Create the Discord permission overwrite for the student.
4. Insert `TopicRoomMember` idempotently.
5. Do not create a `HelpRequest` unless the student separately requests TA help.

Removing consent deletes the private Classync membership row and revokes future access where possible. It cannot delete messages already posted in Discord; this must be disclosed.

## 5. TA notifications for student messages

Add a Discord `messageCreate` listener. Enable `GatewayIntentBits.GuildMessages`; Message Content intent is required only if a notification includes the message body. A privacy-preserving default notification contains no message text:

> New activity in `Tugas Docker — install docker`: [Open room]

On each message:

1. Ignore bot messages and messages outside known open `TopicRoom.channelId` values.
2. Confirm the author is a member or registered TA.
3. Notify each registered TA by DM or a configured private TA-alert channel.
4. Debounce notifications per room (for example, one alert every two minutes) to avoid spam.

Prefer a configurable TA-alert channel over DMs. It gives the TA team a shared audit trail and avoids DM delivery failures. Do not notify students about another student's messages by default.

## 6. Room closure

Add these owner/TA commands:

- `/ta close-room room:<room>` — marks the room `CLOSED`, denies `SendMessages` for students, and posts a closure notice. Read access remains.
- `/ta close-task-rooms item:<item>` — finds all open rooms for the selected task and closes them in sequence.
- `/ta reopen-room room:<room>` — explicit TA-only reopening.

Closing is idempotent. If Discord API work fails for one room during `close-task-rooms`, report the failed rooms and continue processing the rest. Do not delete Discord channels: keeping them read-only retains the knowledge base and is recoverable.

## 7. Required permissions, intents, setup, and documentation

### Bot OAuth scopes

- `bot`
- `applications.commands`

### Discord permissions

| Permission | Reason |
| --- | --- |
| `View Channel`, `Send Messages`, `Embed Links`, `Read Message History` | Operate and read private rooms. |
| `Manage Channels` | Create private channels and apply permission overwrites. |
| `Manage Messages` | Optional answer pinning/moderation. |
| `Manage Threads`, `Create Public Threads`, `Send Messages in Threads` | Needed only if rooms use threads/forum posts rather than private text channels. |

### Gateway intents

- `Guilds` (already used)
- `GuildMessages` for message events
- `MessageContent` only when notification content includes a student's message text

### Setup additions

- `/setup room-category category:<category>` to configure where private channels are created.
- `/setup ta-alert-channel channel:<channel>` to configure shared TA notifications.
- Existing `/setup add-ta`, `/setup remove-ta`, and `/setup list-ta` remain owner-only.

### Documentation and consent updates

Update `docs/PRD-v2-discussion.md`, the bot README, and the consent/join screens to remove the former anonymity guarantee. State that matching students may share a private room and see one another's Discord identity.

## Suggested delivery order

1. Decide voluntary vs automatic matching enrolment (section 4).
2. Implement schema and Prisma migration.
3. Add room category setup and private room provisioning.
4. Add matching membership/access grants and consent language.
5. Extend TA queue and answer/close commands.
6. Add message listener plus debounced TA-alert channel notifications.
7. Test permission overwrites with two students, two TAs, channel failure, consent revocation, and bulk closure.
