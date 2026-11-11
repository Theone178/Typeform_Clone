# Typeform Clone Backend

A production-ready FastAPI backend for the Typeform Clone, built with SQLAlchemy, Pydantic v2, and SQLite.

## Features

- **Creator APIs**: Full CRUD on `/forms`, CRUD on `/forms/{id}/questions`, drag-and-drop reordering endpoint, publish/unpublish workflow, and duplicate form.
- **Public Respondent APIs**: Public form delivery (`/public/forms/{slug}`) and response submission (`/public/forms/{slug}/responses`).
- **Server-Side Validation**:
  - `required`: Non-empty check on required fields.
  - `email`: RFC-compliant email syntax validation.
  - `number`: Numeric validation with optional `min`/`max` boundary checks.
  - `choice` & `dropdown`: Enforces option membership against configured options.
  - `multiple_choice`: Ensures all selected values are valid configured options.
  - `rating`: Enforces integer rating within scale (e.g. 1 to 5).
- **Results & Analytics**:
  - Response listing and individual response details with question answers, submission timestamps, and duration calculation.
  - Aggregated stats (`/forms/{id}/stats`): Total responses, completion rate, per-option breakdown for choices/multiple choice, averages & distribution for ratings/numbers, and recent text responses.
- **Database Seed Script**: Pre-populated with 2 published forms (`product-feedback` and `developer-experience`) featuring mixed question types and 22 realistic responses.

---

## Getting Started

### Deployment Environment

- `DATABASE_URL` (optional): SQLAlchemy database URL. Defaults to `sqlite:///./typeform.db`.
- `CORS_ORIGINS` (optional): Comma-separated list of allowed browser origins. Defaults to `http://localhost:3000`.

The application creates missing tables on startup and seeds the sample forms only when the forms table is empty. The seed script is also available for manual development use.

For durable data on Render, configure `DATABASE_URL` to a persistent Render PostgreSQL database. The default SQLite file is suitable for local development; on Render it only survives redeploys when stored on a mounted persistent disk. Submitted responses and answers are committed to the configured database.

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.12)

### 2. Setup Virtual Environment & Install Dependencies
From the repository root or `/backend`:

```bash
# In backend directory
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt
```

### 3. Seed Database
Seed the database with 2 published forms of mixed question types and ~20 responses:

```bash
python seed.py
```

### 4. Run the FastAPI Development Server

```bash
uvicorn backend.app.main:app --reload --port 8000
```
Or when inside the `backend` directory:
```bash
uvicorn app.main:app --reload --port 8000
```

- **Interactive API Documentation (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative ReDoc UI**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

### 5. Run Test Suite

```bash
pytest backend/tests/test_api.py -v
```

---

## API Endpoints Reference

### Creator Routes

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/forms` | List all forms with question & response counts |
| `POST` | `/forms` | Create a new form (with optional questions) |
| `GET` | `/forms/{id}` | Get form details and questions ordered by position |
| `PUT` | `/forms/{id}` | Update form (title, slug, theme, thank_you, status) |
| `DELETE` | `/forms/{id}` | Delete form (cascades questions, responses, answers) |
| `POST` | `/forms/{id}/publish` | Publish form to allow public responses |
| `POST` | `/forms/{id}/unpublish` | Revert form to draft |
| `POST` | `/forms/{id}/duplicate` | Duplicate form and its questions |
| `GET` | `/forms/{id}/questions` | List questions for form ordered by position |
| `POST` | `/forms/{id}/questions` | Add question to form (auto-assigned position) |
| `GET` | `/forms/{id}/questions/{qid}` | Get individual question |
| `PUT` | `/forms/{id}/questions/{qid}` | Update question config, type, or title |
| `DELETE`| `/forms/{id}/questions/{qid}` | Delete question and re-normalize positions |
| `POST` | `/forms/{id}/questions/reorder` | Reorder questions by ID array or `{id, position}` pairs |

### Public Routes

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/public/forms/{slug}` | Get published form for respondents |
| `POST` | `/public/forms/{slug}/responses` | Submit respondent answers with server-side validation |

### Results Routes

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/forms/{id}/responses` | List all submitted responses with answer values & duration |
| `GET` | `/forms/{id}/responses/{response_id}` | Get one submitted response and its answers |
| `GET` | `/forms/{id}/stats` | Aggregate analytics (completion rate, option breakdowns, averages) |
