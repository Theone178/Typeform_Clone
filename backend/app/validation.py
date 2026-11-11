import re
from typing import Any, Dict, List, Optional
from email_validator import validate_email, EmailNotValidError
from fastapi import HTTPException, status

from .models import Question


def extract_option_values(options: Any) -> List[str]:
    """Helper to extract allowed option strings from options config, supporting strings or dicts."""
    allowed: List[str] = []
    if not isinstance(options, list):
        return allowed

    for opt in options:
        if isinstance(opt, str):
            allowed.append(opt)
        elif isinstance(opt, dict):
            if "value" in opt:
                allowed.append(str(opt["value"]))
            if "label" in opt and str(opt["label"]) not in allowed:
                allowed.append(str(opt["label"]))
        else:
            allowed.append(str(opt))
    return allowed


def is_empty_value(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, str) and value.strip() == "":
        return True
    if isinstance(value, (list, dict)) and len(value) == 0:
        return True
    return False


def validate_answers(questions: List[Question], answers_input: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Validates answers submitted against form questions.
    Returns cleaned dict of {question_id: validated_value}.
    Raises HTTPException(422) if validation fails with detailed error list.

    Supported question types (normalized):
      short_text, long_text, email, number, yes_no,
      multiple_choice (allow_multiple drives single vs multi select),
      dropdown, rating
    """
    answers_by_qid = {ans.get("question_id"): ans.get("value") for ans in answers_input if "question_id" in ans}
    questions_by_id = {q.id: q for q in questions}

    errors: List[Dict[str, Any]] = []
    cleaned_answers: Dict[str, Any] = {}

    # Check for invalid question IDs submitted
    for qid in answers_by_qid:
        if qid not in questions_by_id:
            errors.append({
                "question_id": qid,
                "error": f"Question ID '{qid}' does not belong to this form."
            })

    # Validate each question
    for q in questions:
        raw_value = answers_by_qid.get(q.id)
        empty = is_empty_value(raw_value)
        config = q.config or {}

        # 1. Required check
        if q.required and empty:
            errors.append({
                "question_id": q.id,
                "field": q.title,
                "error": f"'{q.title}' is required."
            })
            continue

        if empty:
            # Not required and no value provided
            continue

        q_type = (q.type or "short_text").lower()
        validated_val = raw_value

        # 2. Email validation
        if q_type == "email":
            val_str = str(raw_value).strip()
            try:
                valid = validate_email(val_str, check_deliverability=False)
                validated_val = valid.normalized
            except EmailNotValidError as e:
                errors.append({
                    "question_id": q.id,
                    "field": q.title,
                    "error": f"Invalid email format: {str(e)}"
                })

        # 3. Number validation
        elif q_type == "number":
            num_val = None
            if isinstance(raw_value, (int, float)) and not isinstance(raw_value, bool):
                num_val = raw_value
            elif isinstance(raw_value, str):
                try:
                    num_val = float(raw_value) if "." in raw_value else int(raw_value)
                except ValueError:
                    num_val = None

            if num_val is None:
                errors.append({
                    "question_id": q.id,
                    "field": q.title,
                    "error": f"Value must be a valid number."
                })
            else:
                min_val = config.get("min")
                max_val = config.get("max")
                if min_val is not None and num_val < min_val:
                    errors.append({
                        "question_id": q.id,
                        "field": q.title,
                        "error": f"Number must be greater than or equal to {min_val}."
                    })
                if max_val is not None and num_val > max_val:
                    errors.append({
                        "question_id": q.id,
                        "field": q.title,
                        "error": f"Number must be less than or equal to {max_val}."
                    })
                validated_val = num_val

        # 4. Yes/No validation
        elif q_type == "yes_no":
            val_str = str(raw_value).strip().lower()
            if val_str not in ("yes", "no", "true", "false", "1", "0"):
                errors.append({
                    "question_id": q.id,
                    "field": q.title,
                    "error": f"Value must be 'yes' or 'no'."
                })
            else:
                # Normalize to yes/no
                validated_val = "yes" if val_str in ("yes", "true", "1") else "no"

        # 5. Dropdown validation (always single-select)
        elif q_type == "dropdown":
            allowed_options = extract_option_values(config.get("options", []))
            str_val = str(raw_value)
            if allowed_options and str_val not in allowed_options:
                errors.append({
                    "question_id": q.id,
                    "field": q.title,
                    "error": f"Selected choice '{str_val}' is not in allowed options: {allowed_options}."
                })
            validated_val = str_val

        # 6. Multiple Choice validation
        # allow_multiple=True  → multi-select (array)
        # allow_multiple=False → single-select (string)
        elif q_type == "multiple_choice":
            allow_multiple = config.get("allow_multiple", True)

            if allow_multiple:
                if not isinstance(raw_value, list):
                    selected_items = [str(raw_value)]
                else:
                    selected_items = [str(item) for item in raw_value]

                allowed_options = extract_option_values(config.get("options", []))
                if allowed_options:
                    invalid_choices = [item for item in selected_items if item not in allowed_options]
                    if invalid_choices:
                        errors.append({
                            "question_id": q.id,
                            "field": q.title,
                            "error": f"Selected options {invalid_choices} are not in allowed options: {allowed_options}."
                        })
                validated_val = selected_items
            else:
                # single-select
                str_val = str(raw_value)
                allowed_options = extract_option_values(config.get("options", []))
                if allowed_options and str_val not in allowed_options:
                    errors.append({
                        "question_id": q.id,
                        "field": q.title,
                        "error": f"Selected choice '{str_val}' is not in allowed options: {allowed_options}."
                    })
                validated_val = str_val

        # 7. Rating validation
        elif q_type == "rating":
            rating_scale = config.get("rating_scale") or config.get("max") or 5
            try:
                val_int = int(raw_value)
                if val_int < 1 or val_int > int(rating_scale):
                    errors.append({
                        "question_id": q.id,
                        "field": q.title,
                        "error": f"Rating must be between 1 and {rating_scale}."
                    })
                validated_val = val_int
            except (ValueError, TypeError):
                errors.append({
                    "question_id": q.id,
                    "field": q.title,
                    "error": f"Rating must be an integer between 1 and {rating_scale}."
                })

        # 8. Text types (short_text, long_text) and legacy fallback
        else:
            max_len = config.get("max_length")
            str_val = str(raw_value)
            if max_len is not None and len(str_val) > max_len:
                errors.append({
                    "question_id": q.id,
                    "field": q.title,
                    "error": f"Text exceeds maximum length of {max_len} characters."
                })
            validated_val = str_val

        cleaned_answers[q.id] = validated_val

    if errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "Validation failed", "errors": errors},
        )

    return cleaned_answers
