from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Form, Question, Response
from ..schemas import (
    FormCreate,
    FormListItem,
    FormResponse,
    FormUpdate,
)
from ..utils import generate_unique_slug

router = APIRouter(prefix="/forms", tags=["Forms"])


@router.get("", response_model=List[FormListItem])
def list_forms(db: Session = Depends(get_db)):
    forms = db.query(Form).order_by(Form.updated_at.desc()).all()
    results = []
    for f in forms:
        q_count = db.query(func.count(Question.id)).filter(Question.form_id == f.id).scalar() or 0
        r_count = db.query(func.count(Response.id)).filter(Response.form_id == f.id).scalar() or 0
        results.append(
            FormListItem(
                id=f.id,
                title=f.title,
                status=f.status,
                slug=f.slug,
                theme=f.theme or {},
                thank_you=f.thank_you or {},
                created_at=f.created_at,
                updated_at=f.updated_at,
                question_count=q_count,
                response_count=r_count,
            )
        )
    return results


@router.post("", response_model=FormResponse, status_code=status.HTTP_201_CREATED)
def create_form(payload: FormCreate, db: Session = Depends(get_db)):
    slug_source = payload.slug if payload.slug else payload.title
    unique_slug = generate_unique_slug(db, slug_source)

    new_form = Form(
        title=payload.title,
        status="draft",
        slug=unique_slug,
        theme=payload.theme or {
            "primary_color": "#7c3aed",
            "background_color": "#ffffff",
            "text_color": "#1f2937",
            "font": "Inter",
        },
        thank_you=payload.thank_you or {
            "title": "Thank you!",
            "message": "Your response has been recorded.",
            "button_text": "Create your own form",
            "button_url": "/",
        },
    )
    db.add(new_form)
    db.flush()  # to obtain form id

    if payload.questions:
        for idx, q_data in enumerate(payload.questions):
            pos = q_data.position if q_data.position is not None else idx
            q = Question(
                form_id=new_form.id,
                type=q_data.type,
                title=q_data.title,
                description=q_data.description,
                required=q_data.required,
                position=pos,
                config=q_data.config or {},
            )
            db.add(q)

    db.commit()
    db.refresh(new_form)

    return FormResponse(
        id=new_form.id,
        title=new_form.title,
        status=new_form.status,
        slug=new_form.slug,
        theme=new_form.theme or {},
        thank_you=new_form.thank_you or {},
        created_at=new_form.created_at,
        updated_at=new_form.updated_at,
        questions=new_form.questions,
        response_count=0,
    )


@router.get("/{id}", response_model=FormResponse)
def get_form(id: str, db: Session = Depends(get_db)):
    form = db.query(Form).filter(Form.id == id).first()
    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Form with id '{id}' not found")

    r_count = db.query(func.count(Response.id)).filter(Response.form_id == form.id).scalar() or 0
    return FormResponse(
        id=form.id,
        title=form.title,
        status=form.status,
        slug=form.slug,
        theme=form.theme or {},
        thank_you=form.thank_you or {},
        created_at=form.created_at,
        updated_at=form.updated_at,
        questions=form.questions,
        response_count=r_count,
    )


@router.put("/{id}", response_model=FormResponse)
@router.patch("/{id}", response_model=FormResponse)
def update_form(id: str, payload: FormUpdate, db: Session = Depends(get_db)):
    form = db.query(Form).filter(Form.id == id).first()
    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Form with id '{id}' not found")

    if payload.title is not None:
        form.title = payload.title

    if payload.slug is not None:
        form.slug = generate_unique_slug(db, payload.slug, current_form_id=id)

    if payload.status is not None:
        if payload.status not in ("draft", "published"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status must be either 'draft' or 'published'",
            )
        form.status = payload.status

    if payload.theme is not None:
        form.theme = payload.theme

    if payload.thank_you is not None:
        form.thank_you = payload.thank_you

    db.commit()
    db.refresh(form)

    r_count = db.query(func.count(Response.id)).filter(Response.form_id == form.id).scalar() or 0
    return FormResponse(
        id=form.id,
        title=form.title,
        status=form.status,
        slug=form.slug,
        theme=form.theme or {},
        thank_you=form.thank_you or {},
        created_at=form.created_at,
        updated_at=form.updated_at,
        questions=form.questions,
        response_count=r_count,
    )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_form(id: str, db: Session = Depends(get_db)):
    form = db.query(Form).filter(Form.id == id).first()
    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Form with id '{id}' not found")

    db.delete(form)
    db.commit()
    return None


@router.post("/{id}/publish", response_model=FormResponse)
def publish_form(id: str, db: Session = Depends(get_db)):
    form = db.query(Form).filter(Form.id == id).first()
    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Form with id '{id}' not found")

    form.status = "published"
    db.commit()
    db.refresh(form)

    r_count = db.query(func.count(Response.id)).filter(Response.form_id == form.id).scalar() or 0
    return FormResponse(
        id=form.id,
        title=form.title,
        status=form.status,
        slug=form.slug,
        theme=form.theme or {},
        thank_you=form.thank_you or {},
        created_at=form.created_at,
        updated_at=form.updated_at,
        questions=form.questions,
        response_count=r_count,
    )


@router.post("/{id}/unpublish", response_model=FormResponse)
def unpublish_form(id: str, db: Session = Depends(get_db)):
    form = db.query(Form).filter(Form.id == id).first()
    if not form:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Form with id '{id}' not found")

    form.status = "draft"
    db.commit()
    db.refresh(form)

    r_count = db.query(func.count(Response.id)).filter(Response.form_id == form.id).scalar() or 0
    return FormResponse(
        id=form.id,
        title=form.title,
        status=form.status,
        slug=form.slug,
        theme=form.theme or {},
        thank_you=form.thank_you or {},
        created_at=form.created_at,
        updated_at=form.updated_at,
        questions=form.questions,
        response_count=r_count,
    )


@router.post("/{id}/duplicate", response_model=FormResponse, status_code=status.HTTP_201_CREATED)
def duplicate_form(id: str, db: Session = Depends(get_db)):
    original = db.query(Form).filter(Form.id == id).first()
    if not original:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Form with id '{id}' not found")

    new_title = f"Copy of {original.title}"
    new_slug = generate_unique_slug(db, new_title)

    new_form = Form(
        title=new_title,
        status="draft",
        slug=new_slug,
        theme=original.theme.copy() if original.theme else {},
        thank_you=original.thank_you.copy() if original.thank_you else {},
    )
    db.add(new_form)
    db.flush()

    # Duplicate questions
    for q in original.questions:
        new_q = Question(
            form_id=new_form.id,
            type=q.type,
            title=q.title,
            description=q.description,
            required=q.required,
            position=q.position,
            config=q.config.copy() if q.config else {},
        )
        db.add(new_q)

    db.commit()
    db.refresh(new_form)

    return FormResponse(
        id=new_form.id,
        title=new_form.title,
        status=new_form.status,
        slug=new_form.slug,
        theme=new_form.theme or {},
        thank_you=new_form.thank_you or {},
        created_at=new_form.created_at,
        updated_at=new_form.updated_at,
        questions=new_form.questions,
        response_count=0,
    )
