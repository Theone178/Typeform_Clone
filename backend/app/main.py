import os
import sys

# Ensure both project root and backend directory are in sys.path
_app_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_app_dir)
_root_dir = os.path.dirname(_backend_dir)

for _path in (_backend_dir, _root_dir):
    if _path not in sys.path:
        sys.path.insert(0, _path)

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .routers import forms, public, questions, results


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    init_db()
    yield


app = FastAPI(
    title="Typeform Clone API",
    description="Backend API for Typeform Clone with Creator, Public, and Results endpoints.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Creator endpoints
app.include_router(forms.router)
app.include_router(questions.router)

# Public respondent endpoints
app.include_router(public.router)

# Results and analytics endpoints
app.include_router(results.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Typeform Clone API is running",
        "docs_url": "/docs",
        "openapi_url": "/openapi.json",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
