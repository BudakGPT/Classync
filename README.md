<div align="center">

  <img src="asset/logo.png" alt="Classync Logo" width="460">

  ### *Tech for Human Connections — Bridging Classroom Struggles Before the Grade Drops*

  [![Hackathon](https://img.shields.io/badge/IFEST%202026-Finalist%20Project-136AFB?style=for-the-badge&logo=target)](https://ifest.himatifunpad.org/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-60A4FC?style=for-the-badge&logo=opensourceinitiative)](LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-0E2343?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord)](https://discord.js.org/)
  [![Next.js 15](https://img.shields.io/badge/Next.js-15%20App%20Router-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
  [![Prisma 6](https://img.shields.io/badge/Prisma-6.x%20PostgreSQL-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
  [![Privacy](https://img.shields.io/badge/Privacy-UU%20PDP%20Compliant-10B981?style=for-the-badge&logo=shield)](PERUBAHAN.md#8-kepatuhan-hukum-privasi--etika-data-uu-pdp--gdpr)

  <p align="center">
    <a href="#-about-classync"><strong>Explore Features</strong></a> •
    <a href="#-quick-start"><strong>Quick Start</strong></a> •
    <a href="#-system-architecture"><strong>Architecture</strong></a> •
    <a href="#-discord-slash-commands-reference"><strong>Bot Commands</strong></a> •
    <a href="PERUBAHAN.md"><strong>Dokumen Perubahan</strong></a> •
    <a href="docs/PRD-PITCH-DECK.md"><strong>Pitch Deck PRD</strong></a>
  </p>

</div>

---

## 📖 About Classync

**Classync** is an open-source, privacy-first **Early-Warning Academic Support System & Classroom Peer Collaboration Platform**. It seamlessly bridges the daily communication gap between university students and teaching assistants (TAs) inside **Discord**, paired with a centralized **Next.js 15 Web Intelligence Dashboard**.

Built by **Team BudakGPT (Universitas Indonesia)** for the **Informatics Festival (IFEST) 2026 Hackathon** at Universitas Padjadjaran under the grand theme *"Tech for Human Connections"* and sub-theme *"Receiver & Provider"*.

---

## 🎯 The Core Problem & Empirical Foundation

Traditional higher education communication channels (LMS forums, email, WhatsApp, public Discord threads) fail the very students who need help the most:

```
                  ┌─────────────────────────────────────────────────────────┐
                  │              The Silent Struggle in Numbers             │
                  └─────────────────────────────────────────────────────────┘
                                               │
               ┌───────────────────────────────┴───────────────────────────────┐
               ▼                                                               ▼
 🛑 47.9% Avoid Seeking Help                                    🤝 Peer-First Trust Network
    Alotaibi et al. (2026, Fig. 3):                                Qayyum (2018):
    47.9% of students cite embarrassment, fear                     Students overwhelmingly prefer asking
    of social judgment, and self-image anxiety                     classmates over faculty, but new/introverted
    as the primary reason for hiding academic difficulties.        students lack access to informal peer circles.
```

1. **The Fear of Asking (*The Silent Struggle*):** Asking public questions carries high social risk. Students worry about looking incompetent in front of peers and professors.
2. **The Social Divide:** Students with established social groups easily find study buddies; international, transfer, or quiet students suffer in isolation without anyone noticing.
3. **Teaching Assistant (TA) Burnout:** TAs spend 5–8 hours every week answering identical private direct messages (DMs), while deadline announcements get lost in noisy chat streams.

---

## 💡 How Classync Solves It: Key Innovations

### 1. 🛡️ Inverted Anonymity & Privacy Floor ($\ge 5$)
Students report academic hurdles with 100% anonymity. A struggle concept is never publicly visible or reported to TAs until **at least 5 students** independently flag the same difficulty.
* Removes personal embarrassment.
* Provides immediate emotional validation: *"You are not alone; 5 classmates share this question."*

### 2. 🤝 Receiver & Provider Peer Matching
Instead of letting struggling students fall behind:
* A student who is stuck can request a **Peer Helper** (*Receiver*).
* Classync matches them with a classmate who has already completed the assignment (*Provider*).
* Conversation takes place via a **two-way anonymous DM relay bot** with **zero plain chat storage**.
* Once comfortable, both students can mutually consent to reveal their real identities and form lasting study friendships.

### 3. 🧠 AI-Powered Roster Ingestion with Zero-Data Exposure
* Instructors upload any standard official class roster spreadsheet (`.xlsx`, `.xls`, `.csv`).
* OpenRouter AI models analyze column patterns using strictly **masked structural representations** (`digits -> 9`, `letters -> a`).
* **Zero Personally Identifiable Information (PII)** is sent to third-party LLMs.
* Automates student onboarding via `#verifikasi`: 1 Student ID (NPM) = 1 Discord Account, auto-assigning class roles and standardized nicknames.

### 4. 🚨 Silent-Risk Early Warning Engine
Rather than only monitoring active complaints, Classync tracks **students who have gone quiet**. For any assignment due in $< 7$ days, if $\ge 5$ students have never updated their checklist status, TAs are alerted with an early-warning signal on the web dashboard to proactively intervene before the submission deadline.

### 5. 📢 Proactive Interactive Announcements & Concept Rooms
* When creating an assignment (`/ta add-item announce:true`), the bot broadcasts an interactive card with a direct *"Mark Progress"* shortcut.
* Concept-specific private channels (`#room-[item]-[concept]`) group students asking the same question under one isolated roof with due-date gated moderation.

---

## 🏗️ System Architecture

Classync is architected as a lean, high-performance monorepo:

```mermaid
flowchart TB
    subgraph Discord Ecosystem
        Student["🎓 Student (Discord Client)"]
        TA_Discord["🧑‍🏫 TA (Discord Client)"]
        Bot["🤖 Classync Bot (Discord.js v14 ESM)"]
    end

    subgraph Web Application
        TA_Web["💻 TA / Instructor (Browser)"]
        NextApp["⚡ Next.js 15 App Router\n(Server Actions & Components)"]
        Auth["🔑 Auth.js v5 (Discord OAuth)"]
    end

    subgraph Core Domain Layer ["@classync/core"]
        Prisma["💎 Prisma ORM 6.x"]
        RosterParser["📊 SheetJS + Masked AI Column Inference"]
        Services["📦 Domain Services\n(Matches, Concepts, Items, SilentRisk, Outbox)"]
    end

    subgraph External Infrastructure
        NeonDB[("🐘 PostgreSQL (Neon Cloud)")]
        OpenRouter["🧠 OpenRouter LLM Gateway\n(Masked Roster Parsing Only)"]
    end

    Student <-->|Slash Commands / Tasks / DMs| Bot
    TA_Discord <-->|Admin Commands / Broadcasts| Bot
    TA_Web <-->|Dashboard / Heatmaps / Roster Upload| NextApp
    NextApp <--> Auth

    Bot <--> Services
    NextApp <--> Services
    Services <--> Prisma
    Prisma <--> NeonDB
    RosterParser -.->|Masked Headers & Cell Patterns| OpenRouter
```

---

## 📂 Repository Structure

Classync is organized using **npm workspaces**:

```
Classync/
├── apps/
│   ├── bot/                          # Discord.js v14 Bot Application
│   │   ├── src/
│   │   │   ├── commands/             # Slash command definitions (/tasks, /ta, /setup, /announceall)
│   │   │   ├── interactions/         # Interactive handlers (modals, buttons, relay, setup reset)
│   │   │   ├── jobs/                 # Cron background jobs (reminders, match expiry, answer outbox)
│   │   │   ├── academicSetup.ts      # Idempotent server channel & role provisioning
│   │   │   ├── announcements.ts      # Broadcast engine & embed builder
│   │   │   ├── classCategories.ts    # Per-class dynamic Discord category partition
│   │   │   ├── teardown.ts           # Safe channel teardown with active interaction guards
│   │   │   ├── topicRooms.ts         # Ephemeral concept rooms lifecycle & TA dispatch
│   │   │   └── verificationGate.ts   # #verifikasi onboarding gate (1 NPM = 1 Discord)
│   │   └── package.json
│   │
│   └── web/                          # Next.js 15 Web Dashboard
│       ├── src/
│       │   ├── actions/              # Next.js Server Actions (answers, roster upload, auth toggle)
│       │   ├── app/                  # App Router pages (auth, guild management, dashboard views)
│       │   ├── components/           # Heatmap, SilentRisk, RosterTable, Brand components
│       │   └── auth.ts               # Auth.js v5 Discord OAuth handler
│       └── package.json
│
├── packages/
│   └── core/                         # Shared Core Domain Package (@classync/core)
│       ├── prisma/
│       │   ├── schema.prisma         # 11 PostgreSQL relational models
│       │   ├── seed.ts               # Demo data seeder for local testing
│       │   └── clear.ts              # Safe database truncate script
│       ├── src/
│       │   ├── services/             # Core business logic (matches, concepts, roster, items, answers)
│       │   ├── llm.ts                # OpenRouter API client with Zod runtime validation
│       │   └── rosterParser.ts       # SheetJS parser with privacy-preserving regex masking
│       └── package.json
│
├── docs/                             # Project Documentation
│   ├── PRD.md                        # Master Product Requirements Document
│   └── PRD-PITCH-DECK.md             # 12-Slide Pitch Deck Blueprint & Script
├── asset/                            # Official Brand Assets & Logos
├── PERUBAHAN.md                      # IFEST 2026 Evaluation & Changes Document
└── package.json                      # Root workspace scripts & orchestrator
```

---

## 🎨 Official Brand Identity

Classync uses a cohesive design palette developed specifically for modern academic environments:

| Color Name | Hex Code | Preview | Usage |
|---|---|---|---|
| **Sync Blue** | `#136AFB` | ![#136AFB](https://placehold.co/15x15/136AFB/136AFB.png) | Primary brand color, active buttons, bot embed accents |
| **Sky Blue** | `#60A4FC` | ![#60A4FC](https://placehold.co/15x15/60A4FC/60A4FC.png) | Highlights, secondary interactive elements, badges |
| **Navy** | `#0E2343` | ![#0E2343](https://placehold.co/15x15/0E2343/0E2343.png) | Primary text, deep headers, sidebar background |
| **Soft White** | `#FDFDFD` | ![#FDFDFD](https://placehold.co/15x15/FDFDFD/FDFDFD.png) | Surface background, card containers |
| **Ice Blue** | `#EDF4FF` | ![#EDF4FF](https://placehold.co/15x15/EDF4FF/EDF4FF.png) | Card backgrounds, subtle callouts, hover states |
| **Mist Blue** | `#C9DDFC` | ![#C9DDFC](https://placehold.co/15x15/C9DDFC/C9DDFC.png) | Borders, dividers, subtle accents |

---

## ⚡ Quick Start & Local Setup

Follow these steps to run the complete Classync stack on your local machine.

### Prerequisites
- **Node.js**: `v20.0.0` or higher
- **npm**: `v10.0.0` or higher
- **PostgreSQL**: Local instance or cloud provider (e.g., [Neon Serverless Postgres](https://neon.tech/))
- **Discord Application**: Created at the [Discord Developer Portal](https://discord.com/developers/applications)

---

### 1. Clone Repository & Install Dependencies

```bash
git clone https://github.com/BudakGPT/Classync.git
cd Classync
npm install
```

### 2. Configure Environment Variables

Copy the template environment file:

```bash
cp .env.example .env
```

Open `.env` and configure your credentials:

```ini
# Database
DATABASE_URL="postgresql://user:password@ep-cool-db.us-east-2.aws.neon.tech/classync?sslmode=require"

# Discord Bot & Application
DISCORD_TOKEN="your_bot_token_here"
DISCORD_CLIENT_ID="your_application_client_id"
DISCORD_CLIENT_SECRET="your_application_client_secret"
DISCORD_GUILD_ID="your_discord_test_server_id"

# Web Dashboard Authentication (Auth.js v5)
AUTH_SECRET="generate_with_openssl_rand_base64_32"
WEB_URL="http://localhost:3000"

# Optional: AI Model Ingestion (for smart roster parsing)
OPENROUTER_API_KEY="sk-or-v1-your_openrouter_api_key"
OPENROUTER_MODEL="anthropic/claude-3.5-haiku"
```

> [!TIP]
> Generate a secure `AUTH_SECRET` by running:
> ```bash
> openssl rand -base64 32
> ```

---

### 3. Initialize the Database

Push the Prisma schema to your PostgreSQL database and generate client bindings:

```bash
# Push schema structure to database
npm run db:push

# Generate Prisma Client
npm run db:generate

# (Optional) Seed realistic demo data (classes, roster, sample tasks)
npm run db:seed
```

> [!NOTE]
> Need to reset or wipe test records? Classync provides safe database scripts:
> - `npm run db:clear` — Cleanly deletes transactional records while keeping the schema intact.
> - `npm run db:reset` — Hard reset via `prisma db push --force-reset`.

---

### 4. Register Discord Slash Commands

Deploy all slash commands (`/tasks`, `/ta`, `/setup`, `/announceall`) instantly to your test Discord guild:

```bash
npm run register
```

---

### 5. Start Development Servers

Run both the Discord bot and the Next.js web application simultaneously:

```bash
# In Terminal 1 — Start Discord Bot
npm run dev:bot

# In Terminal 2 — Start Next.js Web Dashboard
npm run dev:web
```

* The Next.js dashboard will be live at: **http://localhost:3000**
* The Discord bot will log in and show `Classync is ready! Logged in as <BotName>`.

---

## 🤖 Discord Slash Commands Reference

| Command | Subcommand / Options | Permissions | Description |
|---|---|---|---|
| `/tasks` | *None* | Everyone (`@everyone`) | Opens the **private ephemeral student dashboard**. Displays personalized assignment checklist, status buttons (*Not Started*, *In Progress*, *Stuck*, *Done*), and concept difficulty reporting. |
| `/ta` | `add-item` | TA & Server Admins | Creates a new academic assignment with title, due date, description, and optional `announce: true` to auto-broadcast. |
| `/ta` | `queue` | TA & Server Admins | Displays the pending queue of students requesting direct TA help for stuck concepts. |
| `/ta` | `answer` | TA & Server Admins | Dispatches a formal answer to a concept, broadcasting it to student DMs and active concept rooms. |
| `/ta` | `announce-all` | TA & Server Admins | Broadcasts an interactive embed of all currently active assignments to `#pengumuman-tugas`. |
| `/ta` | `close-room` | TA & Server Admins | Closes an ephemeral concept room (due-date gated protection prevents accidental early closure). |
| `/announceall` | *None* | TA & Server Admins | Top-level shortcut to broadcast all active tasks to the announcement channel. |
| `/setup` | `auto` | Server Owner / Admin | Automatically provisions a full academic Discord server: roles (`@Verified`, `@TA`, per-class roles), `#verifikasi` gate, `#pengumuman-tugas`, and class categories. |
| `/setup` | `form` | Server Owner / Admin | Setup modal allowing manual entry of course name, semester, and custom class partitions (e.g. `Kelas A, Kelas B`). |
| `/setup` | `panel` | Server Owner / Admin | Deploys an interactive `#verifikasi` message embed with a persistent modal button. |
| `/setup` | `channel` | Server Owner / Admin | Points the bot to an existing task announcement channel. |

---

## 🎮 Evaluator / Hackathon Demo Script (3-Minute Tour)

For hackathon judges and evaluators evaluating the end-to-end integration:

```
[Step 1: TA Setup & Provisioning]
1. In Discord, run: `/setup form`
2. Enter Course Name: "Algoritma & Pemrograman", Classes: "Kelas A, Kelas B".
3. Bot creates #verifikasi, #pengumuman-tugas, and class channels idempotently.

[Step 2: AI Roster Ingestion & Verification]
4. Open http://localhost:3000 -> Sign in with Discord -> Select Server.
5. In Roster tab, upload a sample spreadsheet (`.xlsx` or `.csv`).
6. In Discord `#verifikasi`, student clicks "Verifikasi Identitas" and enters their NPM.
7. Bot assigns `@Verified`, `@Kelas A`, and updates nickname to `NPM - Nama`.

[Step 3: Task Creation & Proactive Broadcast]
8. TA runs `/ta add-item title:"Tugas 1 - Rekursi" due:"2026-09-25 23:59" announce:true`.
9. The task immediately appears in #pengumuman-tugas with interactive quick-action buttons.

[Step 4: Student Ephemeral Checklist & Privacy Floor]
10. Student types `/tasks` -> Accepts Privacy Consent -> Marks "Stuck" on "Base Case Error".
11. If < 5 students report, identity and count remain strictly hidden.
12. Once 5 students report, status updates: "5 rekan mengalami kendala serupa".

[Step 5: Receiver & Provider Peer Matching]
13. Student A (Stuck) clicks "Request Peer Help".
14. Student B (who marked "Done") receives an anonymous volunteer request in Discord DM.
15. Both exchange messages via bot relay without exposing Discord tags.
16. Both click "Reveal Identity" to confirm mutual connection.

[Step 6: TA Dashboard & Answer Once Broadcast]
17. In Web Dashboard, TA observes the 7-day Concept Heatmap and Silent-Risk list.
18. TA clicks "Jawab Kendala" for "Base Case Error" and submits an explanatory guide.
19. Bot automatically delivers the answer to all stuck students via DM and pins it in `#room-tugas-1-base-case`.
```

---

## 🔒 Privacy, Security, & Legal Compliance (UU PDP & GDPR)

Classync was engineered from day one under the principles of **Privacy by Design** and **Privacy by Default**, adhering to Indonesia's **Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)**:

* **Explicit Consent Gate:** Before any activity data is logged, students must explicitly approve the *Consent Agreement* in `/tasks`.
* **Right to be Forgotten (*Hak untuk Dilupakan*):** Students can click **"Privacy / Delete my data"** at any time. This permanently purges their item statuses, concept difficulties, room memberships, and peer matches from the PostgreSQL database.
* **No Plain Chat Persistence:** Student-to-student relay messages are forwarded in-flight via Discord Gateway and **never stored in the database**.
* **Zero PII Exposure to AI:** Academic roster uploads mask cell contents into abstract structural tokens before any LLM inference takes place.
* **Separation from Grading:** Classync data is strictly decoupled from university grading systems to ensure students never fear grade penalties for seeking help.

---

## 👥 Team BudakGPT — Universitas Indonesia

Built with passion for the **Informatics Festival (IFEST) 2026 Hackathon**:

| Member | Role | Focus Areas |
|---|---|---|
| **Erik Wilbert** | Team Lead & Bot Engineer | Discord.js v14 Client, Idempotent Provisioning, Slash Commands, Peer Relay |
| **Helven Marcia** | System Architect & Integrator | Core Domain Services, PostgreSQL Schema, Privacy Invariants, Roster Engine |
| **Haekal Handrian** | Frontend & Web Engineer | Next.js 15 App Router, Tailwind v4, Heatmap Visualization, Server Actions |
| **Malik Alifan Kareem** | Product Lead & QA / Pitch | Research Validation, User Experience, Pitch Deck Blueprint, QA Testing |

---

## 📄 License

Classync is open-source software licensed under the **[MIT License](LICENSE)**.

---

<div align="center">
  <sub>Classync — Early-Warning Academic Support System & Peer Collaboration. Built with ❤️ by Team BudakGPT.</sub>
</div>