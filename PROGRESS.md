# Project Progress

_Last updated: 2026-09-13_

See also [HANDBOOK.md](HANDBOOK.md) for the fuller domain-knowledge/architecture write-up
this file's details feed into.

## Goal

This app is one feature of the school's own website (springdale.edu.np) — not the whole
result-processing system. The school already has result processing for Grades 6–10
elsewhere; this app covers **only Grades 1–5**, and only the teacher/admin-facing views
for that range.

The core deliverable is an automated pipeline: a teacher enters evaluation marks (the
same 1–4 scale already used in the school's physical CAS register book, daily or
weekly), and the app automatically calculates **GPA**, **WGPA**, and **Percentage** —
per subject and overall — then generates the **report card**. No manual tallying.

The non-negotiable design constraint: teachers are non-technical, so the UI must mirror
the physical hardcopy register closely enough that their existing muscle memory carries
over with **zero retraining**. Pixel-exact matching to the real hardcopy pages is
pending — the user is providing photos of the actual register separately.

## Phases

| Phase | Status | Scope |
|---|---|---|
| 1 | ✅ Done | School setup, curriculum database, AI-generated lesson plans |
| 2 | ✅ Done (today) | Marks-entry + GPA/WGPA/Percentage calculation engine |
| 3 | ✅ Done (today) | Full pipeline end-to-end — marks entry → GPA/WGPA/Percentage → report card. Generic UI approved for this phase; pixel-exact hardcopy match deferred |
| 4 | 🔶 In progress | See §"Phase 4 — in progress" below |

## What's built

### Admin
Academic years, grades/sections, subjects, teachers, teacher assignments — CRUD, scoped
to the signed-in admin's school. Premium teal/gold design matching the real
springdale.edu.np site, applied app-wide.

### Teacher
- **My Classes**, **Curriculum** browser (read-only), **Academic planning** (curriculum
  unit → period breakdown), **AI lesson plans** (Gemini-generated, editable per period).
- **Assessment (Continuous Assessment / CAS)** — per-unit class-wide scoring grid, plus
  a per-student page with three tabs:
  - **Assessment Record** — regular + remedial 1–4 scores per learning achievement,
    live sum/percentage/grade footer.
  - **Rubrics** *(built today)* — the 4 core rubrics (Classroom & Lab Participation,
    Oral Task, Written Task, Project & Practical Work), each with 4 criteria, for the
    Computer subject (Grades 3–5). Click-to-select scoring (not contenteditable —
    deliberately separate DOM elements from any editable text, per a known browser
    click/focus-race bug in an earlier prototype). Live sum/percentage/grade footer,
    saves and persists correctly.
  - **Grading Scale** — reference tables. The percentage→GPA conversion now uses the
    value verified against the actual photographed register (**B = 2.5**), correcting
    an earlier draft document's unverified value (2.8).
- **Report Card** *(new today)* — `/teacher/report-card`: pick a class → pick a student
  → see every subject's Percentage/GPA/Grade, aggregated live across **all** curriculum
  units for that subject, plus an overall **GPA**, **WGPA**, and **Percentage** footer
  for the student. Verified end-to-end: entering a mark in one subject's Assessment
  Record immediately changes that subject's row and the overall footer on this page.

### Data model additions (today)
- `Subject.creditWeight` (`Float`, default `1`) — used for WGPA; all subjects currently
  weighted equally until an admin UI exists to customize it.
- `Rubric` / `RubricCriterion` / `RubricScore` — migrated and wired up (schema existed
  from an earlier session but had never been migrated or built against).
- `lib/grading.ts` additions: `computeSubjectResult` (whole-subject aggregate, reuses
  `computeUnitResult`'s math across every unit instead of one), `computeRubricResult`,
  `computeReportCard` (cross-subject GPA/WGPA/Percentage rollup), `gpaToNumber`.

### Content seeded
CAS content (curriculum units + learning achievements, 1–4 scale) seeded for:
**Computer** (Grades 3–5), **Nepali** (Grades 1–5, Devanagari), **English**
(Grades 1–5), **Mathematics** (Grades 1–5), **Science and Technology** (Grades 4–5),
**Social Studies** (Grades 4–5, Devanagari), **Health/Physical/Creative Arts**
(Grades 4–5), **Hamro Serofero** (Grades 1–3, Devanagari — the integrated subject
covering what Science/Social/HPE do at higher grades). All first-draft content,
pending the school's review; see Phase 4 above for the Devanagari fix and the
Grade 1–2 extension.

4 rubrics × 4 criteria seeded today for the **Computer** subject (Grades 3–5) —
descriptions are a first draft adapted to a computer-lab context; not yet checked
against the real rubrics-booklet photos.

## Phase 4 — in progress

The user provided real photos of the physical CAS register (student intake pages,
health tracking, the usage-instructions page, the rubrics booklet, and filled/blank
Nepali ledger pages). This **confirmed** several things already built were correct
(the formula, the achievement scale, the ledger column layout) and **fixed** one real
bug (B = 2.5, not 2.8 — was wrong in an earlier unreviewed draft). See
[HANDBOOK.md §3](HANDBOOK.md#3-domain-knowledge-the-physical-cas-register) for the
full domain write-up from those photos.

Done since:
- **Nepali / Social Studies / Hamro Serofero content rewritten in Devanagari.** These
  three subjects are Nepali-medium; their skill-area names and learning achievements
  were in English by mistake. Grade 5 Nepali's "Poetry" unit now reproduces the
  school's own photographed example verbatim (verified live, exact match). Every other
  subject stays English, per direction.
- **Grades 1–2 curriculum content added.** Every subject previously started at Grade 3
  minimum — Grades 1 and 2 had zero CAS content despite having enrolled students.
  Extended Nepali, English, Mathematics, and Hamro Serofero down to Grades 1–2.
  Science, Social Studies, HPE, and Computer intentionally still start later (4, 4, 4,
  3) — that's an existing design choice (matches Nepal's integrated 1–3 curriculum
  shape), not an oversight.
- Attempted to source curriculum content directly from Nepal's CDC government site;
  access proved unreliable (repeated 404s/timeouts across 6+ attempts on
  moecdc.gov.np, its e-library, and mirror hosts). Proceeding instead with
  officially-verified structure (the grading formula/scale, the register's own
  subject/skill-area shape) as the calibration reference, writing first-draft content
  to match — this was explicitly approved by the user rather than blocking on
  further gov.np access attempts.

Still open (roughly in the order discussed, not yet started):
- **CDC-calibrated content for the remaining subjects/grades** not yet revisited since
  the photos arrived (English, Math, Science, HPE, Computer content predates this
  round — it's in the right language already, just not yet re-checked against the
  register's actual difficulty level/style).
- **Side-panel guidance UI** on teacher/admin dashboards — how-to instructions plus
  example rubrics per subject, so non-technical teachers have an in-app reference
  instead of needing the physical booklet.
- **Curriculum browser page UI redesign** — currently confusing (shows empty
  Topics/Learning Outcomes/Competencies sections for CAS-only units, since that data
  lives in a different part of the schema than the CAS learning achievements).
- **Custom, per-topic rubrics** — teacher-created rubrics for a specific assignment
  (like the photographed "Local Heritage" example), distinct from the 4 fixed generic
  ones. Data model already supports the shape; no UI yet.
- **Computer-vision ledger ingestion.** Confirmed workflow: teacher fills the paper
  ledger as before; a photo of the filled page gets uploaded; the app extracts the
  handwritten marks and auto-fills the digital table; the original photo displays
  side-by-side for manual verification/correction, since OCR on handwriting won't
  always be right. Not started — likely uses Gemini's vision capability, since a
  Gemini API key is already wired up for lesson plans.
- Other assessment tool types from the rubrics booklet, beyond rubrics: Checklist,
  Rating Scale, Anecdotal Record, Peer/Self/Parent-feedback rubrics (see HANDBOOK §3.3).
- **Pixel-exact hardcopy visual match** for the ledger itself (current UI is the app's
  general premium design, not a literal register replica).
- **No printable/PDF report card** — web page only, no print stylesheet or export.
  Per direction, the digital ledger does *not* need signature lines — those stay on
  the physical page.
- **No "Term" concept** — report card aggregates the whole active academic year, not a
  specific term/quarter. Unconfirmed whether the real register has terms.
- **Rubrics exist only for Computer.**
- **WGPA == GPA today** — every subject's `creditWeight` defaults to `1`, no admin UI
  to set real per-subject weights yet.
- **Student intake / health-tracking pages** — real rosters with full family/contact
  detail were provided for Grades 1–2 (Grades 3–5 rosters already match what's
  seeded); deliberately deferred, not yet acted on.
- No offline support.

## What the final product must look like

A teacher opens the app and sees something that **looks and behaves like the paper
register they already use** — same table layout, same column order, the same 1–4
entry pattern, the same percentage/grade footer — for both the per-subject CAS ledger
and the whole-school report card. The goal is that a non-technical teacher never needs
training, because the digital version is a direct mirror of the paper one, just with
the arithmetic done automatically. This progress reflects the underlying pipeline being
functionally complete; the remaining work is making the surface match the physical book
exactly, once reference photos are provided.
