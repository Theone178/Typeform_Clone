# Typeform Clone

A complete full-stack Typeform clone built with:
- **Backend**: FastAPI, SQLAlchemy, Pydantic v2, SQLite
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion

---

## Quick Start Guide

### 1. Run the Backend (Terminal 1)

```bash
cd backend
venv\Scripts\activate       # Windows (or source venv/bin/activate on macOS/Linux)
python seed.py              # Seeds 2 published forms + 22 responses
uvicorn app.main:app --reload --port 8000
```
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Run the Frontend (Terminal 2)

```bash
cd frontend
pnpm dev
```
- Home: [http://localhost:3000](http://localhost:3000)
- Respondent Form 1: [http://localhost:3000/f/product-feedback](http://localhost:3000/f/product-feedback)
- Respondent Form 2: [http://localhost:3000/f/developer-experience](http://localhost:3000/f/developer-experience)
