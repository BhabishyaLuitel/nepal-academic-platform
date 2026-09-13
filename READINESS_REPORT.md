# Production Readiness Report

_Prepared: 2026-09-14_

## Verdict, up front

**Ready to demo to your boss: yes.** The core pipeline — a teacher entering marks,
scores automatically rolling up into GPA/WGPA/Percentage, a report card generating
itself — works correctly end-to-end, and a security review found and fixed real
issues before they could matter.

**Ready to fully replace the paper process live, tomorrow, for real students: not
yet.** Not because anything is broken — everything tested works — but because
"live" implies things that don't exist yet outside this developer's own laptop:
real hosting, a backup plan, and school-approved curriculum content. Those aren't
small oversights to patch tonight; they're a different project phase. Details and
a concrete path below.

This distinction matters: showing the boss a working, well-tested system and saying
"here's what's built, here's exactly what's left before we flip it on for real" is a
strong position. Quietly going live tonight on a laptop with placeholder curriculum
content and no backups is not — if something goes wrong, there is currently no
safety net.

## What was reviewed

1. A full functional pass — every major flow, both roles (admin and teacher)
2. A security audit of every Server Action and page that touches an id from a URL
   or form field
3. A fresh production build (`next build`) and lint, from a clean state
4. A dependency vulnerability scan (`npm audit`)
5. A mobile-viewport spot check
6. Deployment and operational readiness (hosting, backups, environment)

## 1. Functionality — tested and working

Verified live, with real data, in this session (not just code review):

| Flow | Result |
|---|---|
| Admin: school setup (years, grades/sections, subjects, teachers, assignments), student rosters | Working |
| Teacher: curriculum browser, AI lesson plan generation | Working |
| Teacher: marks entry (Assessment Record), 1–4 scale, regular + after-support | Working, matches the photographed physical register's formula and layout exactly |
| Teacher: the 4 standard rubrics, click-to-select scoring | Working, persists correctly |
| Teacher: custom per-unit rubrics (create, score, delete) | Working |
| Teacher: computer-vision ledger photo ingestion (photograph the paper page → auto-fill the digital form) | Working — tested against the real Gemini vision call, 100% accurate on two independent test images including a mixed regular/after-support case |
| Report Card: cross-subject GPA/WGPA/Percentage rollup | Working — every number independently hand-verified against the underlying data |
| Login/logout, role-based routing (admin vs. teacher) | Working, including on a narrow mobile viewport |

Full end-to-end walkthrough details are in the session's own record; this report
summarizes the result rather than repeating every step.

## 2. Security review — findings and fixes

Before this review, several Server Actions trusted an id from a form field or URL
query string without re-verifying server-side that it belonged to the current
user's school or class — safe in the normal case, because the UI only ever offers
correctly-scoped options, but not enforced if someone crafted a request directly.
**All of the following were found and fixed in this session, then re-verified
live:**

- **Admin → Students page**: a `sectionId` in the URL was trusted directly. Fixed
  to validate it belongs to the admin's own school first; an invalid or foreign id
  now falls back safely instead of the page trying to show it.
- **Admin → Assignments → create**: teacher/subject/grade/section/year ids from
  the form were not re-checked against the admin's school before linking them.
  Fixed with a server-side verification pass.
- **Admin → Grades → create section**: a `gradeId` from the form wasn't checked
  against the admin's school. Fixed.
- **Teacher → Assessment actions** (save marks, save rubric scores, create/delete
  custom rubric, upload ledger photo): a `unitId` from a hidden form field was
  used without confirming it actually belongs to the curriculum subject the
  teacher's assignment covers. Fixed with a new shared check
  (`requireUnitForAssignment`). Rubric-score saving also now only accepts a level
  for a criterion that genuinely belongs to a rubric valid for that unit.

**Practical severity today**: this deployment has exactly one school in the
database, so there is currently no *other* school's data to reach — these fixes
are correctness and defense-in-depth, not an active breach. They become
significant the moment a second school is ever onboarded, which is worth knowing
if that's on the roadmap. All five fixes are committed and pushed
(`d35c9c8`, `a282e7a` builds on top of it).

**Not found**: no exposed secrets in the repository (`.env` is correctly
git-ignored and was never committed), no SQL injection risk (Prisma's typed query
builder is used throughout, no raw SQL), no XSS risk (`dangerouslySetInnerHTML` is
not used anywhere in the codebase), passwords are hashed with bcrypt, and every
`/admin` and `/teacher` route is gated by role-aware middleware.

**Known, accepted gap**: `npm audit` flags 4 high-severity advisories, all in
`mysql2`/`deepmerge-ts` — transitive dependencies of Prisma's *CLI config
loader*, not the runtime database client actually used to serve pages. Already
documented in `README.md` as a known issue; fixing it means a breaking Prisma
downgrade, which is not something to do the night before a demo. Worth scheduling
as its own piece of work, not urgent.

**Not addressed** (lower priority, genuinely not needed for a demo): no
rate-limiting on login attempts, no account lockout, no password-reset flow. For
a small school staff using known accounts, this is a reasonable gap for now —
worth closing before the user base grows.

## 3. Content readiness

- Every subject now has at least 4 curriculum units per grade (English/Nepali/
  Mathematics: 5 grades each; Science/Social Studies/HPE: grades 4–5; Hamro
  Serofero: grades 1–3; Computer already had 5), each with real learning
  achievements in the correct language (Devanagari for Nepali/Social Studies/
  Hamro Serofero, English elsewhere).
- **This content is AI-authored, first-draft, and explicitly not sourced from
  Nepal's official CDC curriculum.** Direct access to CDC's government site was
  attempted and proved unreliable (repeated 404s/timeouts); the content instead
  follows the structure and difficulty level verified from the school's own
  photographed register and rubrics booklet. **A teacher or curriculum coordinator
  should review this before it's treated as the school's actual official
  curriculum.** It's suitable for a demo; it is not yet "signed off" content.
- The 4 standard rubrics (Classroom Participation, Oral Task, Written Task,
  Project & Practical Work) are transcribed verbatim from the school's own
  rubrics booklet photos, in every subject — this part *is* source-verified, not
  AI-invented.
- The grading scale (percentage → GPA → letter grade) is verified against the
  actual photographed physical register.

## 4. What's built vs. what the physical register also has

The pipeline (marks entry → automatic GPA/WGPA/Percentage → report card) is
functionally complete. Not yet built, in priority order for a school actually
switching over:

1. **No printable/PDF report card.** Right now it's a web page only. A school
   handing report cards to parents will need this before "live" is meaningful in
   the full sense.
2. **No "Term" concept.** The report card aggregates every score ever entered for
   the whole academic year, not a specific term/quarter — confirmed working
   correctly during testing, but it's an open question whether the real
   register/report card is organized the same way. This needs the answer before
   it can be called done.
3. **Pixel-exact match to the physical register** hasn't been built — the current
   UI is a general premium design (matching the real school website), not a
   literal on-screen replica of the paper page layout, though the *data and
   formula* match exactly.
4. **WGPA == GPA today** — every subject is weighted equally (`creditWeight = 1`);
   there's no admin screen yet to set real per-subject weights if the school
   wants some subjects to count more.
5. Student intake/health-tracking pages (real family/contact data was provided
   during this session but deliberately not yet acted on, per earlier direction).
6. Other assessment tools from the rubrics booklet beyond the 4 rubrics —
   Checklist, Rating Scale, Anecdotal Record, Peer/Self/Parent Feedback — are
   documented but not built.

## 5. Deployment readiness — the actual blocker for "live tomorrow"

This is the heart of why "ready to demo" and "ready to go live" are different
bars right now:

- **No hosting.** This app has only ever run via `npm run dev` on this developer's
  own laptop, against a local Docker Postgres. There is no server, domain, or
  HTTPS certificate for real teachers to reach from their own devices.
- **No production build has been run as a live server.** `next build` was
  verified clean in this review, but the app has never actually been started with
  `next start` (production mode) and exercised — dev mode is slower and exposes
  more internals than is appropriate for real use.
- **No database backups.** A local dev Postgres container has no backup schedule.
  If it's lost, so is every student's marks history, with no recovery path.
- **No automated test suite.** Everything verified in this review (and this
  session generally) was manual/live testing, which is thorough but not
  repeatable — a future change could silently break something already working,
  with no automated check to catch it.
- **Single teacher/admin account currently seeded.** The admin UI can create more
  (via Teachers/the admin panel), which is good — but real staff accounts with
  real passwords haven't been set up yet.
- **Real student data**: the actual Grade 1–5 rosters (names, addresses, guardian
  contacts) provided during this project exist only in conversation so far — they
  haven't been entered into the app to replace the seeded demo students.

None of this is a code defect. It's the normal, expected gap between "a working
app on a developer's machine" and "a live production system" — every software
project has this phase, and skipping it is how real incidents happen (data loss,
downtime during the first week of real use, a security gap nobody had time to
look for). Given there's genuine student PII involved, this is worth taking
seriously rather than rushing.

## Recommendation

**For tomorrow**: demo it. It's genuinely in strong shape — the pipeline works,
it's been security-reviewed, and the content is realistic even where not yet
official. Be upfront with your boss about exactly two things: the curriculum
content needs a teacher's sign-off before it's "real," and going live needs a
short, standard deployment phase (hosting + backups) before real students'
data touches it. That's a much stronger, more credible pitch than an unqualified
"it's done."

**Before an actual go-live date** (not tomorrow, but soon after): pick a hosting
provider and deploy a real instance, set up automated database backups, decide on
the Term-vs-whole-year report card question with the school, get the curriculum
content reviewed by a teacher, and add print/PDF export for report cards. None of
this is large individually; it's a well-scoped follow-up phase.

---

_See also [PROGRESS.md](PROGRESS.md) for the detailed feature-by-feature build log
and [HANDBOOK.md](HANDBOOK.md) for the architecture and domain-knowledge reference._
