from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


# Question Schemas
class QuestionBase(BaseModel):
    type: str  # text, email, number, choice, multiple_choice, dropdown, rating, etc.
    title: str
    description: Optional[str] = None
    required: bool = False
    position: Optional[int] = 0
    config: Dict[str, Any] = Field(default_factory=dict)


class QuestionCreate(QuestionBase):
    pass


class QuestionUpdate(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    required: Optional[bool] = None
    position: Optional[int] = None
    config: Optional[Dict[str, Any]] = None


class QuestionResponse(QuestionBase):
    id: str
    form_id: str
    position: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class QuestionReorderItem(BaseModel):
    id: str
    position: int


class QuestionReorderRequest(BaseModel):
    questions: Optional[List[QuestionReorderItem]] = None
    question_ids: Optional[List[str]] = None  # Alternative convenience: ordered list of IDs


# Form Schemas
class FormBase(BaseModel):
    title: str
    theme: Optional[Dict[str, Any]] = None
    thank_you: Optional[Dict[str, Any]] = None


class FormCreate(FormBase):
    slug: Optional[str] = None
    questions: Optional[List[QuestionCreate]] = None


class FormUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    status: Optional[str] = None  # "draft" | "published"
    theme: Optional[Dict[str, Any]] = None
    thank_you: Optional[Dict[str, Any]] = None


class FormListItem(BaseModel):
    id: str
    title: str
    status: str
    slug: str
    theme: Dict[str, Any]
    thank_you: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    question_count: int = 0
    response_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class FormResponse(BaseModel):
    id: str
    title: str
    status: str
    slug: str
    theme: Dict[str, Any]
    thank_you: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    questions: List[QuestionResponse] = []
    response_count: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


# Public Form Schemas
class PublicQuestion(BaseModel):
    id: str
    type: str
    title: str
    description: Optional[str] = None
    required: bool
    position: int
    config: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


class PublicForm(BaseModel):
    id: str
    title: str
    status: str
    slug: str
    theme: Dict[str, Any]
    thank_you: Dict[str, Any]
    questions: List[PublicQuestion]

    model_config = ConfigDict(from_attributes=True)


class AnswerInput(BaseModel):
    question_id: str
    value: Any


class ResponseSubmit(BaseModel):
    answers: List[AnswerInput] = []
    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None


# Results Schemas
class AnswerResponse(BaseModel):
    id: str
    question_id: str
    value: Any

    model_config = ConfigDict(from_attributes=True)


class ResponseDetail(BaseModel):
    id: str
    form_id: str
    started_at: datetime
    submitted_at: datetime
    duration_seconds: Optional[float] = None
    answers: List[AnswerResponse] = []

    model_config = ConfigDict(from_attributes=True)


class QuestionStat(BaseModel):
    question_id: str
    title: str
    type: str
    position: int
    total_answers: int
    data: Dict[str, Any]  # Per question stats (e.g. breakdown, average, min, max, text_answers)


class FormStats(BaseModel):
    form_id: str
    title: str
    total_responses: int
    completion_rate: float
    average_duration_seconds: Optional[float] = None
    questions_stats: List[QuestionStat]
