# بوابة سند — IT Helpdesk Portal

Internal Arabic (RTL) IT ticketing and workplace-services portal for **كل تحدي وله سند**. Built with Next.js 14 (App Router), Prisma, and PostgreSQL, deployed on Railway.

## Stack

- **Next.js 14** (App Router) + TypeScript (`strict` mode) + Tailwind CSS
- **Prisma 5** ORM + **PostgreSQL**
- **NextAuth.js v5** (Credentials provider, JWT sessions)
- **Recharts** for admin reports
- **Nodemailer** for optional email notifications
- Real-time in-app notifications via Server-Sent Events (`lib/sse.ts`)

## Roles

| Role | Access |
|---|---|
| `ADMIN` | Everything — user/room management, all tickets, reports, settings, design system |
| `SUPPORT` | Tickets assigned to them |
| `COMM_SUPPORT` / `COMM_ADMIN` | Institutional-communication ticket queue |
| `DEPT_MANAGER` | Approves tickets from their own department's staff |
| `USER` | Creates and tracks their own tickets |

All roles also get: room booking, and the cross-team Kanban project board (both individually toggleable from Admin → Settings).

## Getting started

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL at minimum; generate NEXTAUTH_SECRET with: openssl rand -base64 32
npx prisma migrate dev    # applies migrations to your local Postgres
npm run dev               # http://localhost:3000
```

You need a running PostgreSQL instance — either local or point `DATABASE_URL` at a remote one (e.g. a Railway Postgres, via its public proxy URL for local dev).

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Run the production build |
| `npm run db:migrate` | Create/apply a new Prisma migration (dev) |
| `npm run db:push` | Push schema without a migration (prototyping only) |
| `npm run db:seed` | Seed demo data (`prisma/seed.ts`) |

## Architecture at a glance

- `app/<role>/...` — one route group per role (`admin`, `support`, `portal`, `comm-support`, `comm-admin`, `dept-manager`), each with its own `layout.tsx` that gates access by session role.
- `app/api/...` — REST-style route handlers; every route checks `auth()` before touching the database.
- `app/kanban/...` — cross-team project board, visible to all roles but with row-level visibility rules (see `lib/project-access.ts`): admins see everything, dept managers see their department's projects, everyone else sees only projects they created or were added to.
- `lib/` — small, single-purpose server helpers (`auth.ts`, `prisma.ts`, `notify.ts`, `rate-limit.ts`, `settings.ts`, `sse.ts`, `project-access.ts`, `audit.ts`, `email.ts`).
- `components/` — organized by feature (`tickets/`, `kanban/`, `rooms/`, `admin/`, `layout/`), plus a handful of small shared primitives in `components/ui/`.
- `middleware.ts` — enforces role-based route access at the edge (redirects, not just UI hiding).
- `prisma/schema.prisma` + `prisma/migrations/` — the source of truth for the DB; every schema change ships as a migration, applied automatically on deploy (`npx prisma migrate deploy` runs as part of the Railway start command).
- **`/admin/design-system`** — a live reference page documenting the actual colors, spacing, and component patterns in production use. Check it before adding new UI so new work matches what's already there instead of drifting.

## Feature toggles

Rooms booking and the Kanban board can each be turned on/off platform-wide from **Admin → Settings**, backed by the `system_settings` table (`lib/settings.ts`).

## Notifications

In-app notifications (bell icon, `components/layout/Header.tsx`) are pushed live via SSE and also persisted to the `notifications` table, so they survive a page reload. They're tied to either a ticket or a Kanban project (`ticketId`/`projectId` on the `Notification` model) — see `lib/notify.ts` for the two helpers (`createNotification`, `notifyProjectMembers`).

## Backups

Nightly PostgreSQL backups run outside of this repo (SSH into the Postgres service, `pg_dump` into a `backups/` subfolder of its own persistent volume) — see `backup/remote-backup.sh` for the actual script that gets pushed and run there.

## Deployment

Hosted on Railway. Push to `main`, then either wait for Railway's GitHub auto-deploy or run `railway up` from this directory. Migrations run automatically on container start (`npx prisma migrate deploy && npm start` — see `railway.toml`).

## What's not here yet

No automated test suite exists — verification is currently manual (typecheck + live smoke-test on Railway after each deploy). Worth knowing before making structural changes.
