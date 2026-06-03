# ProjectFlow

A production-grade collaborative project management system with real-time Kanban boards, multi-tenant workspaces, and Socket.IO sync.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-black?style=flat-square&logo=socket.io)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis)

---

## Features

- **Google OAuth** — sign in with Google via NextAuth.js v5
- **Multi-tenant workspaces** — strict membership verification on every request
- **Real-time Kanban board** — drag and drop across 5 columns with live sync
- **Fractional indexing** — O(1) task reordering, single DB write per move
- **Socket.IO + Redis** — horizontally scalable real-time events
- **Audit logging** — async, non-blocking log of every workspace action
- **Role-based access** — Owner vs Member with enforced permissions
- **Member invitations** — invite by email with token-based acceptance
- **Email invitations** — invite members via Gmail SMTP with branded HTML emails
- **Project management** — create and manage projects within workspaces
- **Performance optimized** — composite indexes tuned with EXPLAIN ANALYZE on 10,000 rows

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL + Prisma ORM v6 |
| Auth | NextAuth.js v5 + Google OAuth |
| Real-time | Socket.IO + Redis adapter |
| State | Zustand + TanStack Query v5 |
| Drag & Drop | @dnd-kit |
| Validation | Zod + React Hook Form |
| Seeding | Faker.js — 10,000 tasks |

---

## Architecture Highlights

### Fractional Indexing
Task positions use fractional string keys instead of integers. A drag-and-drop reorder is always **one DB write** regardless of column size. Integer positions would require updating every task below the insertion point — O(n).

```
Before: [a0, a1, a2, a3]
Insert between a1 and a2: [a0, a1, a1N, a2, a3]  ← one write
```

### Multi-Tenant Middleware
Every API request verifies workspace membership before touching any data. Implemented at two layers:

- **Middleware** (`src/middleware.ts`) — lightweight JWT session check at the Edge
- **API routes** — Prisma-based membership verification via `withAuth()` / `withOwnerAuth()`

```
Request → Edge middleware (JWT check) → API route (membership check) → Handler
```

### Redis Socket Adapter
Socket.IO uses a Redis pub/sub adapter, enabling horizontal scaling. Any server instance can broadcast to all connected clients regardless of which instance they connected to.

```
Client A → Server 1 → Redis pub/sub → Server 2 → Client B
```

### Async Audit Logging
Audit logs are written after the HTTP response is sent. The user gets `200 OK` instantly and the log write happens in the background — no latency impact.

```typescript
// User gets 200 OK instantly
return apiSuccess(updated);

// Log writes in background — non-blocking
db.auditLog.create({ ... }).catch(console.error);
```

---

## Performance

Benchmarked with 10,000 tasks across 3 workspaces using `EXPLAIN ANALYZE`.

| Query | Index Used | Time |
|---|---|---|
| Board per column | `tasks_workspaceId_status_idx` | 3.5ms |
| My tasks | `tasks_workspaceId_assigneeId_idx` | 1.3ms |
| Audit log | `audit_logs_workspaceId_createdAt_idx` | 0.34ms |

All primary queries use composite indexes — zero sequential scans on hot tables.

See [PERFORMANCE.md](./PERFORMANCE.md) for full query plans and analysis.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                     # Login, error pages
│   ├── (dashboard)/                # Protected workspace pages
│   │   └── workspace/[workspaceId]/
│   │       ├── board/              # Kanban board
│   │       ├── members/            # Member management
│   │       ├── settings/           # Workspace settings
│   │       └── audit-log/          # Audit log viewer
│   └── api/
│       ├── auth/[...nextauth]/     # NextAuth route handler
│       ├── workspaces/             # Workspace CRUD
│       │   └── [workspaceId]/
│       │       ├── members/        # Member management
│       │       ├── projects/       # Project CRUD
│       │       ├── tasks/          # Task CRUD + move
│       │       └── audit-log/      # Audit log API
│       └── invitations/[token]/    # Invitation acceptance
├── components/
│   ├── ui/                         # shadcn/ui primitives
│   ├── layout/                     # Sidebar, navbar, shell
│   ├── board/                      # Kanban components
│   ├── workspace/                  # Workspace components
│   └── shared/                     # Providers, shared components
├── lib/
│   ├── auth/                       # NextAuth config + permissions
│   ├── db/                         # Prisma singleton
│   ├── utils/                      # cn, format, fractional-index, api
│   └── validations/                # Zod schemas
├── hooks/                          # Custom React hooks
├── store/                          # Zustand stores
├── types/                          # TypeScript types
└── middleware.ts                   # Multi-tenant auth guard
```

---

## Database Schema

```prisma
User         → has many Memberships, Tasks, AuditLogs
Workspace    → has many Memberships, Projects, AuditLogs
Membership   → User ↔ Workspace (with role: OWNER | MEMBER)
Project      → belongs to Workspace, has many Tasks
Task         → belongs to Project + Workspace
              (status, priority, fractional position)
AuditLog     → append-only log of workspace actions
Invitation   → token-based email invitations
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis 7+
- Google OAuth credentials

### 1. Clone and install

```bash
git clone https://github.com/DondaDheerajReddy/projectflow.git
cd projectflow
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
```

Fill in your `.env`:

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/projectflow?schema=public"

# NextAuth
AUTH_SECRET="your-secret-here"  # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
# https://console.cloud.google.com/apis/credentials
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# Redis
REDIS_URL="redis://localhost:6379"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email (Gmail SMTP)
EMAIL_FROM="your-gmail@gmail.com"
EMAIL_PASSWORD="your-gmail-app-password"
```

### 3. Set up the database

```bash
npm run db:push
```

### 4. (Optional) Seed with 10,000 tasks

```bash
npm run db:seed
```

> ⚠️ The seed script deletes all existing data. Log in again with Google after seeding.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Go to **APIs & Services** → **OAuth consent screen** → External
4. Go to **Credentials** → **Create Credentials** → **OAuth Client ID**
5. Application type: **Web application**
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy **Client ID** and **Client Secret** to `.env`

---

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:generate  # Generate Prisma client
npm run db:seed      # Seed with 10,000 tasks
```

---

## Phase Build Plan

| Phase | Description | Status |
|---|---|---|
| 1 | Foundation — Next.js, Auth, Prisma, Middleware | ✅ |
| 2 | Workspace Management — CRUD, Members, Invitations | ✅ |
| 3 | Real-Time Kanban — DnD, Fractional Index, Socket.IO | ✅ |
| 4 | Audit Logging — Async writes, Log viewer | ✅ |
| 5 | Performance — Seeding, EXPLAIN ANALYZE, Index tuning | ✅ |

---

## License

ISC
