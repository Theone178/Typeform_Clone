from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Answer, Form, Question, Response
from ..schemas import FormStats, QuestionStat, ResponseDetail
from ..validation import extract_option_values

router = APIRouter(prefix="/forms/{id}", tags=["Results"])


def get_form_or_404(db: Session, form_id: str) -> Form:
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Form with id '{form_id}' not found",
        )
    return form


@router.get("/responses", response_model=List[ResponseDetail])
def list_responses(id: str, db: Session = Depends(get_db)):
    get_form_or_404(db, id)

    responses = (
        db.query(Response)
        .filter(Response.form_id == id)
        .order_by(Response.submitted_at.desc())
        .all()
    )

    results = []
    for r in responses:
        duration = None
        if r.started_at and r.submitted_at:
            duration = max(0.0, (r.submitted_at - r.started_at).total_seconds())
        results.append(
            ResponseDetail(
                id=r.id,
                form_id=r.form_id,
                started_at=r.started_at,
                submitted_at=r.submitted_at,
                duration_seconds=duration,
                answers=r.answers,
            )
        )
    return results


@router.get("/stats", response_model=FormStats)
def get_form_stats(id: str, db: Session = Depends(get_db)):
    form = get_form_or_404(db, id)

    responses = db.query(Response).filter(Response.form_id == id).all()
    total_responses = len(responses)

    # Calculate average completion time
    durations = [
        (r.submitted_at - r.started_at).total_seconds()
        for r in responses
        if r.started_at and r.submitted_at and (r.submitted_at >= r.started_at)
    ]
    avg_duration = round(sum(durations) / len(durations), 2) if durations else None

    # Calculate completion rate (all required questions answered)
    required_questions = [q for q in form.questions if q.required]
    completed_count = 0
    if total_responses > 0:
        if not required_questions:
            completed_count = total_responses
        else:
            required_qids = {q.id for q in required_questions}
            for r in responses:
                answered_qids = {a.question_id for a in r.answers if a.value is not None and a.value != ""}
                if required_qids.issubset(answered_qids):
                    completed_count += 1
        completion_rate = round((completed_count / total_responses) * 100.0, 1)
    else:
        completion_rate = 0.0

    # Per question stats
    questions_stats: List[QuestionStat] = []
    sorted_questions = sorted(form.questions, key=lambda q: (q.position, q.created_at))

    for q in sorted_questions:
        answers = db.query(Answer).filter(Answer.question_id == q.id).all()
        values = [a.value for a in answers if a.value is not None]
        total_answers = len(values)
        q_type = (q.type or "short_text").lower()
        config = q.config or {}

        data: Dict[str, Any] = {}

        if q_type == "dropdown" or (q_type == "multiple_choice" and not config.get("allow_multiple", True)):
            options = extract_option_values(config.get("options", []))
            counts: Dict[str, int] = {opt: 0 for opt in options}
            for v in values:
                v_str = str(v)
                counts[v_str] = counts.get(v_str, 0) + 1
            breakdown = [
                {
                    "option": opt,
                    "count": count,
                    "percentage": round((count / total_answers * 100.0), 1) if total_answers > 0 else 0.0,
                }
                for opt, count in counts.items()
            ]
            data = {"options_breakdown": breakdown}

        elif q_type == "multiple_choice" and config.get("allow_multiple", True):
            options = extract_option_values(config.get("options", []))
            counts: Dict[str, int] = {opt: 0 for opt in options}
            for v in values:
                items = v if isinstance(v, list) else [v]
                for item in items:
                    item_str = str(item)
                    counts[item_str] = counts.get(item_str, 0) + 1
            breakdown = [
                {
                    "option": opt,
                    "count": count,
                    "percentage": round((count / total_answers * 100.0), 1) if total_answers > 0 else 0.0,
                }
                for opt, count in counts.items()
            ]
            data = {"options_breakdown": breakdown}

        elif q_type in ("number", "rating"):
            num_vals = []
            for v in values:
                try:
                    num_vals.append(float(v))
                except (ValueError, TypeError):
                    pass

            if num_vals:
                data = {
                    "count": len(num_vals),
                    "average": round(sum(num_vals) / len(num_vals), 2),
                    "min": min(num_vals),
                    "max": max(num_vals),
                }
                if q_type == "rating":
                    # Rating distribution
                    scale = int(config.get("rating_scale") or config.get("max") or 5)
                    dist = {str(i): 0 for i in range(1, scale + 1)}
                    for nv in num_vals:
                        key = str(int(nv))
                        if key in dist:
                            dist[key] += 1
                    data["distribution"] = dist
            else:
                data = {"count": 0, "average": None, "min": None, "max": None}

        elif q_type in ("short_text", "long_text", "email", "yes_no"):
            # Provide sample recent responses
            data = {
                "count": total_answers,
                "recent_answers": [str(v) for v in values[-10:]],
            }

        elif q_type == "yes_no":
            counts = {"yes": 0, "no": 0}
            for v in values:
                v_str = str(v).lower()
                if v_str in counts:
                    counts[v_str] += 1
            data = {"options_breakdown": [
                {"option": k, "count": c, "percentage": round(c / total_answers * 100, 1) if total_answers else 0}
                for k, c in counts.items()
            ]}

        else:
            data = {"count": total_answers}

        questions_stats.append(
            QuestionStat(
                question_id=q.id,
                title=q.title,
                type=q.type,
                position=q.position,
                total_answers=total_answers,
                data=data,
            )
        )

    return FormStats(
        form_id=form.id,
        title=form.title,
        total_responses=total_responses,
        completion_rate=completion_rate,
        average_duration_seconds=avg_duration,
        questions_stats=questions_stats,
    )
