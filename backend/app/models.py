import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
    func,
)
from sqlalchemy.orm import relationship

from .database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Form(Base):
    __tablename__ = "forms"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="draft")  # "draft" | "published"
    slug = Column(String(255), unique=True, index=True, nullable=False)
    theme = Column(JSON, nullable=False, default=lambda: {
        "primary_color": "#7c3aed",
        "background_color": "#ffffff",
        "text_color": "#1f2937",
        "font": "Inter",
    })
    thank_you = Column(JSON, nullable=False, default=lambda: {
        "title": "Thank you!",
        "message": "Your response has been recorded.",
        "button_text": "Create your own form",
        "button_url": "/",
    })
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    questions = relationship(
        "Question",
        back_populates="form",
        cascade="all, delete-orphan",
        order_by="Question.position",
        lazy="joined",
    )
    responses = relationship(
        "Response",
        back_populates="form",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class Question(Base):
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    form_id = Column(String(36), ForeignKey("forms.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # text, email, number, choice, multiple_choice, dropdown, rating, etc.
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    required = Column(Boolean, nullable=False, default=False)
    position = Column(Integer, nullable=False, default=0)
    config = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    form = relationship("Form", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")


class Response(Base):
    __tablename__ = "responses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    form_id = Column(String(36), ForeignKey("forms.id", ondelete="CASCADE"), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    submitted_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    # Relationships
    form = relationship("Form", back_populates="responses")
    answers = relationship(
        "Answer",
        back_populates="response",
        cascade="all, delete-orphan",
        lazy="joined",
    )


class Answer(Base):
    __tablename__ = "answers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    response_id = Column(String(36), ForeignKey("responses.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    value = Column(JSON, nullable=True)

    # Relationships
    response = relationship("Response", back_populates="answers")
    question = relationship("Question", back_populates="answers")
