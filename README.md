# Academic Workflow Platform (Phase 1)

AI-powered academic workflow platform for Nepali schools. Phase 1 covers school setup,
the curriculum database, and AI-generated lesson plans — the foundation the rest of the
workflow (assessment, grading, report cards) will build on.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind CSS)
- PostgreSQL + Prisma 7 (driver adapter: `@prisma/adapter-pg`)
- Auth.js (NextAuth v5), credentials login, JWT sessions
- Gemini API (`@google/genai`, free tier) for lesson-plan generation

## Getting started

1. Start Postgres (Docker Desktop must be running):

   ```bash
   docker compose up -d
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Fill in `GEMINI_API_KEY` in `.env` — get a free key at
   [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (no credit card
   required). The `DATABASE_URL` is already set to match `docker-compose.yml`.

4. Apply migrations and seed demo data:

   ```bash
   npx prisma migrate dev
   npm run db:seed
   ```

   This seeds a demo school ("Springdale English Boarding School") with:
   - Admin login: `admin@springdale.edu.np` / `Admin@123`
   - Teacher login: `teacher@springdale.edu.np` / `Teacher@123`
   - A Grade 5 / Section A / Mathematics teacher assignment
   - A full Grade 5 → Mathematics → Fractions curriculum unit (8 topics, learning
     outcomes, competencies) matching the product spec's sample plan
   - Grades 1–5, Section A, with real student rosters (78 students total)
   - A Computer subject continuous assessment (CAS) setup for Grades 3–5: 5 units each,
     5 skill areas per unit, matching the school's physical CAS record booklet format —
     assigned to the same teacher across all three grades

5. Run the dev server:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000 — you'll be redirected to `/login`, then to `/admin` or
   `/teacher` based on your role.

Other useful commands: `npm run db:studio` (Prisma Studio, browse the DB), `npm run build`
(production build + typecheck), `npm run lint`.

## What's implemented

- **Admin**: academic years, grades/sections, subjects, teachers, teacher assignments —
  all server-action CRUD, scoped to the signed-in admin's school.
- **Teacher**: curriculum browser (Grade → Subject → Unit → Topic, read-only), academic
  planning (pick a curriculum unit → auto-generated period breakdown), AI lesson
  plans (generate via Gemini, then edit and save per period), and continuous assessment
  (CAS) scoring — a class-wide grid for regular-pass scores per unit, plus a per-student
  page for remedial scores and remarks, with automatic percentage/grade calculation
  matching the school's official grading scale.

## Known gaps / next phases

- Only one Mathematics curriculum unit (Grade 5 — Fractions) and one full subject's CAS
  content (Computer, Grades 3–5) are seeded. Loading the full official curriculum, and CAS
  skill areas for other subjects, is a separate data-entry effort.
- No report card generation, parent documentation, attendance tracking, or grade rollup
  across subjects/terms yet — those are later phases per the product spec.
- No offline sync (service worker / conflict resolution); the app is server-rendered with
  small client bundles to tolerate slow connections, but doesn't work fully offline.
- `npm audit` flags a high-severity issue in `deepmerge-ts` (a transitive dependency of
  Prisma's CLI config loader, not the runtime client). Fixing it would downgrade Prisma to
  6.12.0; left as-is pending an upstream patch.
