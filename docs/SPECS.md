# Typeform Clone: Build Approach

Nov 11, 2026 · @Aadi

## Overview

Use Antigravity as a fast pair-programmer while you stay the architect: you decide the schema, API and design, and it writes the code. Evaluators will quiz you on every line, so don't hand it those decisions.

| Step | Hours |
| --- | --- |
| 1. Design first | 1-2 |
| 2. Backend | 3-4 |
| 3. Respondent flow | 6-7 |
| 4. Builder | 6-7 |
| 5. Dashboard and results | 3 |
| 6. Bonus | Only if time remains |
| 7. Deploy and README | 2 |

## 1. Design first

Write the schema and API contract yourself before any code, then hand both to the agent as a spec.

**Schema**

| Table | Key columns |
| --- | --- |
| forms | id, title, status, slug, theme (JSON), thank\_you (JSON), timestamps |
| questions | id, form\_id, type, title, description, required, position, config (JSON: options, rating scale, etc.) |
| responses | id, form\_id, started\_at, submitted\_at |
| answers | id, response\_id, question\_id, value (JSON) |

**Endpoints**

| Area | Routes |
| --- | --- |
| Creator | CRUD on /forms and /forms/{id}/questions, a reorder endpoint, publish/unpublish, duplicate |
| Public | GET /public/forms/{slug}, POST /public/forms/{slug}/responses |
| Results | GET /forms/{id}/responses, GET /forms/{id}/stats |

## 2. Backend

FastAPI with SQLAlchemy and Pydantic is faster to build than Django for this scope.

- Validate on the server per question type: required, email format, number, and choice values must be in the options.
- Write a seed script with 2 published forms of mixed question types and about 20 responses so the app is usable immediately.

## 3. Respondent flow

This is the highest-value piece, so build it before polishing the builder.

- Drive it with a small state machine: currentIndex, direction and answers.
- Animate transitions with Framer Motion AnimatePresence, sliding questions up and down.
- Keyboard: Enter advances, arrow keys navigate, letter shortcuts (A, B, C) pick choices.
- Add a top progress bar, a "press Enter" hint, a welcome screen and a thank-you screen.

## 4. Builder

Use a 3-pane layout, and reuse the respondent components for the live preview.

- Left: the question list. Middle: the live preview. Right: per-question settings.
- Drag-and-drop reordering with dnd-kit.
- Inline title editing and an "Add question" type-picker modal.
- Render the respondent components in read-only mode for the preview.

## 5. Dashboard and results

- Form list with a status badge, response count, and a rename/duplicate/delete menu.
- Responses table, an individual response view, and per-question stats.
- Toasts with sonner, and "Coming Soon" placeholders for logic, integrations and collaboration.

## 6. Bonus, 7. Deploy and README

Only attempt bonus features once everything core works. CSV export is the easiest win, then dark mode, then basic logic jumps.

Deploy the frontend on Vercel and the backend on Render or Railway. SQLite on Render's free tier resets on redeploy, so run the seed script at startup. Write the README last, covering setup, architecture, schema, API overview and assumptions.

## Using Antigravity well

- Put your spec (schema, API, folder structure) in a markdown file and tell the agent to follow it.
- Go one module at a time (backend, then respondent flow, then builder) and review each diff. Never ask for "build the whole app".
- Give it screenshots of real Typeform (builder and fill flow) to match the UI.
- Keep design tokens in one theme file: Inter as a stand-in font, Typeform's signature purple, soft backgrounds.
- Commit after every working step so bad agent output is easy to roll back.
- Free-tier rate limits can hit, so keep Claude or another model available as a fallback.
