# Project Progress

_Last updated: 2026-09-13_

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
| 4 | ⏳ Not started | Hardcopy-exact visual redesign once photos arrive; printable/PDF report card; term-scoped report cards; per-subject rubrics beyond Computer; admin UI for subject credit-weights |

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
CAS content (curriculum units + learning achievements, 1–4 scale) already existed,
seeded across Grades 1–5 as applicable, for: **Computer** (Grades 3–5), **Nepali**,
**English**, **Mathematics**, **Science and Technology**, **Social Studies**,
**Health/Physical/Creative Arts**, **Hamro Serofero**. All first-draft content, pending
the school's review.

4 rubrics × 4 criteria seeded today for the **Computer** subject (Grades 3–5) —
descriptions are a first draft adapted to a computer-lab context; not yet checked
against the real rubrics-booklet photos.

## What's NOT done yet (known gaps)

- **Pixel-exact hardcopy match.** Current UI is the app's general premium design
  (teal/gold, matching the real school website), not a literal replica of the physical
  register. Waiting on photos of the actual marks-entry page, GPA/WGPA page, and report
  card template before this can be built.
- **No printable/PDF report card** — the report card is a live-computed web page only;
  no print stylesheet, signature lines, or export.
- **No "Term" concept.** The report card currently aggregates every score ever entered
  for the active academic year, not a specific term/quarter. The real register likely
  has terms — needs the photos to confirm the structure.
- **Rubrics exist only for Computer.** Other subjects still use only the 1–4
  achievement scale (no rubric tab content for them).
- **WGPA == GPA today** since every subject's `creditWeight` defaults to `1` — no admin
  screen yet to set real per-subject weights.
- Full official curriculum content is a first draft; loading the complete official
  curriculum per subject/grade is a separate, larger data-entry effort.
- No offline support (server-rendered, small client bundles, but not offline-capable).

## What the final product must look like

A teacher opens the app and sees something that **looks and behaves like the paper
register they already use** — same table layout, same column order, the same 1–4
entry pattern, the same percentage/grade footer — for both the per-subject CAS ledger
and the whole-school report card. The goal is that a non-technical teacher never needs
training, because the digital version is a direct mirror of the paper one, just with
the arithmetic done automatically. This progress reflects the underlying pipeline being
functionally complete; the remaining work is making the surface match the physical book
exactly, once reference photos are provided.
