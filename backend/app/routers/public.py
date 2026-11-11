from datetime import datetime, timezone
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Answer, Form, Question, Response
from ..schemas import PublicForm, ResponseDetail, ResponseSubmit
from ..validation import validate_answers

router = APIRouter(prefix="/public/forms", tags=["Public"])


@router.get("/{slug}", response_model=PublicForm)
def get_public_form(slug: str, db: Session = Depends(get_db)):
    form = db.query(Form).filter(Form.slug == slug).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Form with slug '{slug}' not found.",
        )

    if form.status != "published":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This form is currently not published and not accepting responses.",
        )

    # Sort questions by position
    sorted_questions = sorted(form.questions, key=lambda q: (q.position, q.created_at))

    return PublicForm(
        id=form.id,
        title=form.title,
        status=form.status,
        slug=form.slug,
        theme=form.theme or {},
        thank_you=form.thank_you or {},
        questions=sorted_questions,
    )


@router.post("/{slug}/responses", response_model=ResponseDetail, status_code=status.HTTP_201_CREATED)
def submit_public_response(slug: str, payload: ResponseSubmit, db: Session = Depends(get_db)):
    form = db.query(Form).filter(Form.slug == slug).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Form with slug '{slug}' not found.",
        )

    if form.status != "published":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This form is currently not published and cannot accept responses.",
        )

    now = datetime.now(timezone.utc)
    started_at = payload.started_at or now
    submitted_at = payload.submitted_at or now

    # Server-side validation
    raw_answers = [a.model_dump() for a in payload.answers]
    cleaned_answers = validate_answers(form.questions, raw_answers)

    # Save Response
    response_record = Response(
        form_id=form.id,
        started_at=started_at,
        submitted_at=submitted_at,
    )
    db.add(response_record)
    db.flush()

    # Save Answers
    answer_records = []
    for qid, val in cleaned_answers.items():
        ans = Answer(
            response_id=response_record.id,
            question_id=qid,
            value=val,
        )
        db.add(ans)
        answer_records.append(ans)

    db.commit()
    db.refresh(response_record)

    duration = None
    if response_record.started_at and response_record.submitted_at:
        duration = max(0.0, (response_record.submitted_at - response_record.started_at).total_seconds())

    return ResponseDetail(
        id=response_record.id,
        form_id=response_record.form_id,
        started_at=response_record.started_at,
        submitted_at=response_record.submitted_at,
        duration_seconds=duration,
        answers=response_record.answers,
    )
