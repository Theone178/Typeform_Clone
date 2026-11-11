# Typeform Clone

A full-stack form builder and conversational form app. Create and publish forms, collect submissions, review individual responses and question summaries, and export responses to CSV.

**Live demo:** [typeform-clone-six-woad.vercel.app](https://typeform-clone-six-woad.vercel.app/)

**Source:** [Theone178/Typeform_Clone](https://github.com/Theone178/Typeform_Clone)

## Features

- **Form builder:** Create and edit forms, configure questions, reorder them with drag-and-drop or keyboard controls, duplicate and delete questions, and publish shareable forms.
- **Eight question types:** Short text, long text, multiple choice (single or multiple selection), dropdown, email, number, yes/no, and rating.
- **Conversational respondent flow:** One question at a time, keyboard navigation, progress indicator, server-side answer validation, and a configurable thank-you screen.
- **Responses and analytics:** Submission list, full response details, completion and duration summaries, and per-question answer statistics.
- **CSV export:** Download a form’s submissions, including timestamps and answers in question order.
- **Persistence:** SQLAlchemy-backed storage; SQLite for local development and PostgreSQL supported for deployment.

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | Next.js 14 App Router, React, TypeScript, Tailwind CSS, Framer Motion |
| Data and interactions | TanStack Query, dnd-kit, Sonner |
| Backend | FastAPI, Pydantic v2, SQLAlchemy |
| Database | SQLite by default; PostgreSQL supported |
| Hosting | Vercel (frontend) and Render (backend) |

## Run locally

### Requirements

- Python 3.10+ (the project has been tested with Python 3.12)
- Node.js 18.17+ (or Node.js 20+)
- pnpm

### 1. Start the backend

From the repository root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

On macOS/Linux, activate the environment with:

```bash
source .venv/bin/activate
```

The backend creates tables at startup and seeds sample forms if the database has no forms. Startup seeding is automatic; avoid rerunning the seed script against a database containing the sample slugs because it replaces those sample forms and their responses.

- API documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Start the frontend

In a second terminal:

```powershell
cd frontend
pnpm install --frozen-lockfile
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Then run:

```powershell
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment configuration

The frontend is deployed at [https://typeform-clone-six-woad.vercel.app/](https://typeform-clone-six-woad.vercel.app/). Configure the following environment variables in the corresponding deployment services:

| Service | Variable | Value |
| --- | --- | --- |
| Vercel | `NEXT_PUBLIC_API_URL` | The public base URL of the deployed FastAPI backend (no trailing slash required) |
| Render | `CORS_ORIGINS` | Comma-separated frontend origins, e.g. `https://typeform-clone-six-woad.vercel.app` |
| Render | `DATABASE_URL` | A persistent PostgreSQL connection URL, or SQLite URL on a mounted persistent disk |

`NEXT_PUBLIC_API_URL` is included in the frontend build, so set it before building or redeploying the Vercel app. The backend defaults to SQLite at `sqlite:///./typeform.db`; on Render, an ephemeral filesystem may lose SQLite data during redeploys. Use Render PostgreSQL or mount a persistent disk and point SQLite to that mount to keep submissions.

The backend defaults CORS to `http://localhost:3000`. Set `CORS_ORIGINS` in Render to the exact production frontend origin; include the local origin as another comma-separated entry only if needed.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Form dashboard |
| `/forms/[id]/edit` | Form builder |
| `/f/[slug]` | Public form respondent experience |
| `/forms/[id]/responses` | Response list, question summaries, and CSV export |
| `/forms/[id]/responses/[responseId]` | Individual submission details |

The FastAPI API includes form and question management, public form delivery and submission, response listing and detail, CSV export, and response statistics. Interactive API docs are available at `/docs` on the backend.

## Try the main workflow

1. Open the dashboard and create a form.
2. Add questions, edit their settings, and reorder them in the builder.
3. Publish the form and open its public share link in another tab.
4. Submit a test response, then return to the dashboard and open that form’s **Responses** page.
5. Review the submission and question summaries, or select **Export CSV** to download the responses.

## Verification

Run the backend tests from `backend/`:

```powershell
python -m pytest
```

Check and build the frontend from `frontend/`:

```powershell
pnpm exec tsc --noEmit
pnpm build
```

## Demo and security notes

- The live app currently loads but may show an empty workspace until forms exist in the deployed database. Create a form in the dashboard or confirm the Render backend initialized its database and seed data.
- This project is intended as a demo/submission. Creator and response-management endpoints currently have no authentication or authorization. Do not use it to collect confidential submissions or expose real users’ response data without adding access controls.
- The backend seeds examples only when the forms table is empty; it does not reseed or overwrite an existing database.
