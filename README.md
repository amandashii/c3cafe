# C3 Cafe

Admin tool for running weekly coffee chat pairings in a student club. Manages rosters, generates intelligent pairings, and tracks history across academic years.

**[Live demo →](---)** — use the demo login button.

---

## Features

**Pairing algorithm** — greedy scoring that penalizes repeat pairings (+1000) and rewards cross-cohort connections (−100). Handles odd member counts via an exhaustive best-trio search. Pre-assigned requests from the queue are locked in before the algorithm runs on the remainder.

**Manual swaps** — click-to-swap editor on any historical week. Checks both directions of a proposed swap against pairing history and surfaces a warning before confirming.

**Roster and cohort management** — per-year member lists with active/away status.

**Year isolation** — each academic year has its own roster, history, and requests queue.

---

## Tech

- **Frontend** — React 19, TypeScript, Tailwind CSS, Vite
- **Backend** — Supabase (Postgres, Auth, Row Level Security)
- **Type safety** — schema types generated via `supabase gen types` and passed to `createClient<Database>`
- **Testing** — Vitest unit tests covering the pairing and swap-warning logic

---

## Running locally

```bash
git clone https://github.com/amandashii/c3cafe.git
cd c3cafe
npm install
cp .env.example .env.local
```

Fill in `.env.local` with your Supabase project URL and anon key (dashboard → **Settings → API**).

Apply migrations in the [Supabase SQL editor](https://supabase.com/dashboard):
```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_seed_demo_data.sql
```

Create a user in **Authentication → Users** matching the credentials in `.env.local`, then:

```bash
npm run dev
```

---