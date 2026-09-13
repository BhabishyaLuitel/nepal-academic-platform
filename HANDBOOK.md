# Project Handbook

This is the one document a new developer should read start to finish before touching
code. It covers what this project *is*, the domain knowledge that isn't obvious from
the code, the architecture, and the decisions already made (and why) so they don't get
relitigated. For day-to-day setup commands, see [README.md](README.md). For current
build status, see [PROGRESS.md](PROGRESS.md) — that file changes fast; this one
shouldn't need to change often.

## 1. What this is

This app is **one feature** of a real school's website (springdale.edu.np), not a
standalone product. The school already has result processing for **Grades 6–10**
elsewhere (a separate, existing system this app does not touch). This app covers
**only Grades 1–5** — the admin/teacher-facing tools for school setup, curriculum,
lesson planning, and continuous assessment through to report cards.

**The one constraint that shapes every UI decision here:** the school's teachers are
non-technical and currently do all of this by hand in a physical register book. The
product goal is not to introduce a new workflow — it's to **mirror the physical
register closely enough that a teacher's existing muscle memory carries over with zero
retraining.** When in doubt about how a screen should look or behave, the answer is
"however the equivalent page in the physical book does it," not "however seems
cleanest to a developer." See §3 for what that physical book actually contains.

## 2. Stack

- Next.js 16 (App Router, TypeScript, Turbopack) + Tailwind CSS 4
- PostgreSQL + Prisma 7 (driver adapter: `@prisma/adapter-pg`), via Docker Compose
- Auth.js (NextAuth v5), credentials login, JWT sessions, two roles: `SCHOOL_ADMIN`,
  `TEACHER`
- Gemini API (`@google/genai`) for AI-generated lesson plans

Setup steps are in [README.md](README.md) — don't duplicate them here.

## 3. Domain knowledge: the physical CAS register

The school scores students by hand in a physical booklet called the **सिकाइ उपलब्धि
मूल्याङ्कन अभिलेख** (Learning Achievement Assessment Record). Photos of the actual
booklet were provided directly by the school and are the source of truth for
everything below — not an approximation, not an AI guess. If a future reference
document disagrees with what's here, **trust the photographed hardcopy**, not a typed
draft (this has already happened once — see §6).

### 3.1 What's in the booklet, cover to cover

1. **Student intake pages** — name, DOB, address, guardian info, admission date,
   mother/father occupation, home language, local guardian. *(Not yet digitized — see
   §7, deliberately deferred.)*
2. **Health tracking table** — date, weight, height, notes on disability/disease.
   *(Not yet digitized — deferred, same reason.)*
3. **Usage instructions page** — explains the achievement scale and the percentage
   formula (see 3.2 below). This is the page that governs how every subsequent ledger
   page in the book should be scored.
4. **Per-subject assessment ledgers** — one of these per subject-theme (e.g. Nepali
   has a ledger for "Poetry," another for "Story"; Computer has one per unit). This is
   what the app's **Assessment Record** tab digitizes today.
5. **A rubrics booklet section** — worked example rubrics for several assessment
   *tools*, not just one. See 3.3.

### 3.2 The scoring system (already implemented — do not re-derive, just reuse)

- **Achievement scale**, 1–4: 1 = सुधार आवश्यक/Below basic, 2 = सामान्य/Basic,
  3 = राम्रो/Proficient, 4 = उच्च/Advanced. → `ACHIEVEMENT_LEVELS` in `lib/grading.ts`.
- **Effective score per row**: the "after remedial support" score wins over the
  "regular" score when both exist, else whichever one exists, else 0.
  → `effectiveScore()` in `lib/grading.ts`.
- **Percentage formula**: `(sum of effective scores) ÷ (4 × number of rows) × 100`.
  → `computeUnitResult()` (per curriculum unit) and `computeSubjectResult()` (same
  function, applied across every unit in a subject — see §5).
- **Percentage → GPA/Grade table** — this is the official CDC table, verified against
  the photographed register:

  | Percentage | GPA | Grade |
  |---|---|---|
  | ≥ 90% | 4.0 | A+ |
  | 80–90% | 3.6 | A |
  | 70–80% | 3.2 | B+ |
  | **60–70%** | **2.5** | **B** |
  | 50–60% | 2.4 | C+ |
  | 40–50% | 2.0 | C |
  | 35–40% | 1.6 | D |
  | < 35% | — | NG |

  → `GRADE_SCALE` in `lib/grading.ts`. **The B row is 2.5, not 2.8** — see §6 for why
  this is called out explicitly.

### 3.3 Assessment *tools* — rubrics are one of several, not the only one

The rubrics booklet documents multiple tool types a teacher can use. **Only rubrics are
built today.** The others are documented here so a future dev implementing them
doesn't have to go back to the photos:

- **Rubrics** (built) — 4 core, reusable ones: Classroom & Lab Participation, Oral
  Task, Written Task, Project & Practical Work. Each has 4 criteria × 4 levels.
- **Custom, per-topic rubrics** (not built) — the booklet also shows one-off rubrics a
  teacher built for a *specific* assignment (e.g. a Grade 5 Social Studies "Local
  Heritage Exploration" rubric with its own 5 criteria, not the generic 4). The data
  model (`Rubric` → `RubricCriterion`) already supports this shape — it just needs a
  teacher-facing "create a rubric" UI, which doesn't exist yet.
- **Checklist** (not built) — yes/no indicators against a list (the booklet's example
  is a personal-hygiene checklist), scored by count of ✓.
- **Rating Scale** (not built) — visually like a rubric but framed as a 1–4 scale
  against custom, assignment-specific indicators.
- **Anecdotal Record** (not built) — free-text narrative note per student per incident
  (date, location, description, teacher's comment) — not scored.
- **Peer Assessment / Self-Assessment / Parent Feedback rubrics** (not built) — same
  4-level rubric shape as above, but filled out by a peer, the student themselves, or
  a parent instead of the teacher.

If you're asked to "add rubrics for subject X," check whether it actually means the 4
generic rubrics (reuse `seedComputerRubrics` in `prisma/seed.ts` as the template) or a
custom per-topic one (needs new UI, doesn't exist yet).

## 4. Architecture / data model

Everything is scoped to a `School`. Key model groups (`prisma/schema.prisma`):

- **Org setup**: `School`, `AcademicYear`, `Grade`, `Section`, `Student`, `Subject`
  (has `creditWeight` for WGPA — defaults to 1, no admin UI to change it yet), `User`
  (role: `SCHOOL_ADMIN` | `TEACHER`), `TeacherAssignment` (the join of
  teacher+subject+grade+section+year — almost everything else hangs off this).
- **Curriculum** (national reference data, not school-specific): `CurriculumGrade` →
  `CurriculumSubject` → `CurriculumUnit` → `CurriculumTopic` / `LearningOutcome` /
  `Competency`; `SkillArea` + `LearningAchievement` (the actual 1–4-scored rows).
  A `TeacherAssignment`'s subject/grade is matched to a `CurriculumSubject` by
  **name**, not by foreign key (see `curriculumGrade.findUnique({where:{name:...}})`
  pattern repeated across teacher pages) — this is how a school-specific `Subject`
  ("Mathematics") connects to the shared `CurriculumSubject` content.
- **Academic planning / AI lesson plans**: `AcademicPlan` → `PlanPeriod` →
  `LessonPlan` (Gemini-generated, editable).
- **Continuous assessment**: `AssessmentScore` (one row per student ×
  `LearningAchievement`, holds `regularScore`/`regularDate` +
  `remedialScore`/`remedialDate` + `remark`) — this *is* the marks-entry system; see
  §3.2's formula for how it's aggregated.
- **Rubrics**: `Rubric` → `RubricCriterion` → `RubricScore` (one row per student ×
  criterion). `Rubric.curriculumUnitId` is nullable: null = generic, shared across
  the whole subject (the 4 core rubrics, seeded); set = a teacher-created custom
  rubric scoped to just that unit (`createdByTeacherId` set too). A student's
  Rubrics tab queries both (`OR: [{curriculumUnitId: null}, {curriculumUnitId: unit.id}]`)
  so a custom rubric just shows up alongside the generic ones automatically.
- **Ledger photo ingestion**: `LedgerPhoto` (one row per student × `CurriculumUnit`,
  `imageData Bytes`) stores a photo of the physical paper ledger page. Uploading one
  (`uploadLedgerPhoto` in the unit's `actions.ts`) calls `lib/ledger-scan.ts`
  (Gemini vision) to read the handwritten 1-4 scores and writes them into
  `AssessmentScore` the same way a manual entry would — the photo displays
  side-by-side so the teacher reviews/corrects through the ordinary Save flow, no
  separate review UI. Reading `Bytes` back out needs `Buffer.from(x)` — Prisma's
  generated type is `Uint8Array`, whose `toString()` doesn't take an encoding arg
  the way Node's `Buffer.toString("base64")` does.

**Report card rollup** (`lib/grading.ts`, used by `app/teacher/report-card/`):
`computeSubjectResult` aggregates every `LearningAchievement` across every
`CurriculumUnit` for one subject (it's literally `computeUnitResult` applied to a
bigger list — there's no separate "whole subject" math). `computeReportCard` then
averages every subject's GPA into an overall GPA, weights by `creditWeight` for WGPA,
and averages percentages for the overall Percentage. **There is no "Term" model yet**
— the report card aggregates every score ever entered for the active academic year,
not a specific term/quarter. This is a known gap (§7), not an oversight.

## 5. Design system

The real brand, pulled directly from springdale.edu.np's own compiled CSS (not
guessed): primary `#008266` (teal-green — their own CSS confusingly calls it "navy"),
gold accent `#eab308`, cream `#f8fafc`, Playfair Display headings + Inter body. Defined
in `app/globals.css`'s `@theme inline` block and aliased to the `brand-*` Tailwind
utilities every page already uses.

The `.cas-*` classes in the same file (`.cas-card`, `.cas-table`, `.cas-masthead`,
`.cas-badge`, etc.) are named for their origin (the CAS assessment pages) but are now
the **app-wide default design system** — admin, teacher, login all use them. Don't be
misled by the name into thinking they're CAS-scoped; they aren't anymore (see the
comment at the top of that CSS section for the history).

## 6. Decisions already made — don't relitigate these

- **Palette**: real springdale.edu.np CSS values, not an AI-guessed palette from a
  photo. Two earlier guesses were rejected before this one was verified correct.
- **B = 2.5, not 2.8**: an earlier reference document (an unreviewed "Computer CAS
  Record" draft) had 2.8. The value verified directly against the photographed
  physical register is 2.5. If you ever see 2.8 in a new reference, the photographed
  register wins.
- **`.cas-theme` is global, not scoped**: it was originally a dark theme scoped to just
  the assessment pages (matching an early artifact mockup), separate from the rest of
  the app's light theme. That was explicitly reversed — the whole app now uses one
  consistent light design. If you see references to "dark CAS theme" in old commits,
  that's superseded.
- **No signature lines in the digital ledger**: the physical book has teacher/guardian
  signature lines; the digital version deliberately does not replicate them — signing
  happens on the physical page, not in the app.
- **Rubric level-cells are click-to-select, never contenteditable.** A real browser
  focuses a contenteditable element on mousedown *before* any JS listener can run, so a
  cell that's both editable and a click target can't reliably distinguish "select" from
  "start editing" on a real click (confirmed in an earlier prototype — a synthetic
  click worked, a real one didn't, because synthetic events skip the native focus
  race). `components/assessment/rubric-scorer.tsx` uses plain
  `<td tabIndex={0} role="button">` cells with click + Enter/Space handlers. Keep this
  split if you add another click-to-score UI (checklist, rating scale, etc.).
- **Curriculum content in `prisma/seed.ts` is a first draft**, explicitly labeled as
  such, written to demonstrate the *shape* of the data (units, skill areas, learning
  achievements) — not sourced from Nepal's official CDC curriculum. Replacing it with
  the real CDC content is in progress (see PROGRESS.md).
- **Schema migrations in this dev environment go through `migrate deploy`, not
  `migrate dev` or `db push`.** Both of the latter need either an interactive
  confirmation prompt (`migrate dev`) or Prisma's AI-agent dangerous-action override
  (`db push --accept-data-loss`), and this project's workflow doesn't grant either.
  The pattern that works: write the schema change, hand-write the matching
  `migration.sql` (a sibling migration's file is the best template for exact
  naming/constraint syntax), put it in a new `prisma/migrations/<timestamp>_<name>/`
  folder, then run `npx prisma migrate deploy` followed by `npx prisma generate`.
  **Also restart `next dev` afterward** — Turbopack's persistent dev cache can keep
  serving the pre-migration Prisma client/route manifest even after `generate`
  reruns, which shows up as either a stale "unknown argument" Prisma error or an
  unrelated-looking 404 on a page that demonstrably exists; clearing `.next/` and
  restarting the dev server resolves it.

## 7. Known gaps (see PROGRESS.md for current status)

- Pixel-exact hardcopy-matched UI for the marks-entry ledger (deferred; current UI is
  the general app design, not a literal register replica).
- Student intake / health-tracking pages (deferred, separate feature).
- Term-scoped report cards (no `Term` model yet).
- Assessment tools beyond rubrics: checklist, rating scale, anecdotal record, peer/
  self/parent rubrics (§3.3).
- Teacher-facing "create a custom rubric" UI.
- Real CDC curriculum content (in progress).
- Computer-vision ingestion of photographed hardcopy ledger pages, with a side-by-side
  original-photo view for verifying/correcting OCR misreads (planned, not started).
- Admin UI for `Subject.creditWeight` (WGPA is currently == GPA since every subject
  defaults to weight 1).
- No printable/PDF report card export.
- No offline support.

## 8. Where to look first for common tasks

- **Add a new admin CRUD screen**: copy the pattern in `app/admin/subjects/` (page +
  `actions.ts` server actions).
- **Add a teacher-facing feature scoped to one class**: copy the pattern in
  `app/teacher/assessment/` — `TeacherAssignment` lookup → curriculum lookup by name →
  render. `requireOwnedAssignment()` in the relevant `actions.ts` is the access-control
  pattern to reuse.
- **Grading math**: everything lives in `lib/grading.ts`. Don't duplicate the formula
  elsewhere.
- **Seed data**: `prisma/seed.ts`. `seedSubjectCas()` is the generic per-subject CAS
  seeder; `seedComputerRubrics()` is the rubric seeder pattern to copy for other
  subjects.
