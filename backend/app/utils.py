import re
import uuid
from sqlalchemy.orm import Session
from .models import Form


def slugify(text: str) -> str:
    """Convert text to a URL-safe slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text or "form"


def generate_unique_slug(db: Session, base_text: str, current_form_id: str = None) -> str:
    """Generate a unique slug based on a title or desired slug string."""
    base_slug = slugify(base_text)
    slug = base_slug
    counter = 1

    while True:
        query = db.query(Form).filter(Form.slug == slug)
        if current_form_id:
            query = query.filter(Form.id != current_form_id)
        existing = query.first()
        if not existing:
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1
