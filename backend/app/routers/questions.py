from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Form, Question
from ..schemas import (
    QuestionCreate,
    QuestionReorderRequest,
    QuestionResponse,
    QuestionUpdate,
)

router = APIRouter(prefix="/forms/{id}/questions", tags=["Questions"])


def get_form_or_404(db: Session, form_id: str) -> Form:
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Form with id '{form_id}' not found",
        )
    return form


@router.get("", response_model=List[QuestionResponse])
def list_questions(id: str, db: Session = Depends(get_db)):
    get_form_or_404(db, id)
    questions = (
        db.query(Question)
        .filter(Question.form_id == id)
        .order_by(Question.position.asc(), Question.created_at.asc())
        .all()
    )
    return questions


@router.post("", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def create_question(id: str, payload: QuestionCreate, db: Session = Depends(get_db)):
    get_form_or_404(db, id)

    # Determine position
    if payload.position is not None:
        pos = payload.position
    else:
        max_pos = db.query(func.max(Question.position)).filter(Question.form_id == id).scalar()
        pos = 0 if max_pos is None else max_pos + 1

    question = Question(
        form_id=id,
        type=payload.type,
        title=payload.title,
        description=payload.description,
        required=payload.required,
        position=pos,
        config=payload.config or {},
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.get("/{question_id}", response_model=QuestionResponse)
def get_question(id: str, question_id: str, db: Session = Depends(get_db)):
    get_form_or_404(db, id)
    question = (
        db.query(Question)
        .filter(Question.form_id == id, Question.id == question_id)
        .first()
    )
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question with id '{question_id}' not found in form '{id}'",
        )
    return question


@router.put("/{question_id}", response_model=QuestionResponse)
@router.patch("/{question_id}", response_model=QuestionResponse)
def update_question(
    id: str,
    question_id: str,
    payload: QuestionUpdate,
    db: Session = Depends(get_db),
):
    get_form_or_404(db, id)
    question = (
        db.query(Question)
        .filter(Question.form_id == id, Question.id == question_id)
        .first()
    )
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question with id '{question_id}' not found in form '{id}'",
        )

    if payload.type is not None:
        question.type = payload.type
    if payload.title is not None:
        question.title = payload.title
    if payload.description is not None:
        question.description = payload.description
    if payload.required is not None:
        question.required = payload.required
    if payload.position is not None:
        question.position = payload.position
    if payload.config is not None:
        question.config = payload.config

    db.commit()
    db.refresh(question)
    return question


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(id: str, question_id: str, db: Session = Depends(get_db)):
    get_form_or_404(db, id)
    question = (
        db.query(Question)
        .filter(Question.form_id == id, Question.id == question_id)
        .first()
    )
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question with id '{question_id}' not found in form '{id}'",
        )

    db.delete(question)
    db.commit()

    # Normalize positions of remaining questions
    remaining = (
        db.query(Question)
        .filter(Question.form_id == id)
        .order_by(Question.position.asc(), Question.created_at.asc())
        .all()
    )
    for idx, q in enumerate(remaining):
        q.position = idx
    db.commit()

    return None


@router.post("/reorder", response_model=List[QuestionResponse])
@router.put("/reorder", response_model=List[QuestionResponse])
def reorder_questions(
    id: str,
    payload: QuestionReorderRequest,
    db: Session = Depends(get_db),
):
    get_form_or_404(db, id)
    existing_questions = {
        q.id: q for q in db.query(Question).filter(Question.form_id == id).all()
    }

    if payload.question_ids is not None:
        for idx, qid in enumerate(payload.question_ids):
            if qid in existing_questions:
                existing_questions[qid].position = idx
    elif payload.questions is not None:
        for item in payload.questions:
            if item.id in existing_questions:
                existing_questions[item.id].position = item.position
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either 'questions' list or 'question_ids' list.",
        )

    db.commit()

    reordered = (
        db.query(Question)
        .filter(Question.form_id == id)
        .order_by(Question.position.asc())
        .all()
    )
    return reordered


@router.post("/{question_id}/duplicate", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def duplicate_question(id: str, question_id: str, db: Session = Depends(get_db)):
    get_form_or_404(db, id)
    question = (
        db.query(Question)
        .filter(Question.form_id == id, Question.id == question_id)
        .first()
    )
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question with id '{question_id}' not found in form '{id}'",
        )

    # Shift positions of all questions after the original
    questions_after = (
        db.query(Question)
        .filter(Question.form_id == id, Question.position > question.position)
        .all()
    )
    for q in questions_after:
        q.position += 1

    new_question = Question(
        form_id=id,
        type=question.type,
        title=f"{question.title} (copy)",
        description=question.description,
        required=question.required,
        position=question.position + 1,
        config=question.config,
    )
    db.add(new_question)
    db.commit()
    db.refresh(new_question)
    return new_question
