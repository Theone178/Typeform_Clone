import csv
import io
import os
import sys

# Ensure backend and project root are in sys.path
_test_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_test_dir)
_root_dir = os.path.dirname(_backend_dir)
for p in (_backend_dir, _root_dir):
    if p not in sys.path:
        sys.path.insert(0, p)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

try:
    from app.database import Base, get_db
    from app.main import app
except ImportError:
    from backend.app.database import Base, get_db
    from backend.app.main import app

# Test database
TEST_DATABASE_URL = "sqlite:///./test_typeform.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()
    if os.path.exists("./test_typeform.db"):
        try:
            os.remove("./test_typeform.db")
        except OSError:
            pass


@pytest.fixture
def client():
    return TestClient(app)


def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_create_form_and_list(client):
    res = client.post(
        "/forms",
        json={
            "title": "Onboarding Form",
            "slug": "onboarding-form",
            "questions": [
                {
                    "type": "text",
                    "title": "What is your name?",
                    "required": True,
                    "position": 0,
                },
                {
                    "type": "email",
                    "title": "What is your email?",
                    "required": True,
                    "position": 1,
                },
            ],
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Onboarding Form"
    assert data["slug"] == "onboarding-form"
    assert data["status"] == "draft"
    assert len(data["questions"]) == 2

    # Check listing
    list_res = client.get("/forms")
    assert list_res.status_code == 200
    forms = list_res.json()
    assert any(f["slug"] == "onboarding-form" for f in forms)


def test_update_and_publish_form(client):
    create_res = client.post("/forms", json={"title": "Draft Form"})
    form_id = create_res.json()["id"]

    # Update form
    update_res = client.put(f"/forms/{form_id}", json={"title": "Updated Draft Form"})
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Updated Draft Form"

    # Publish form
    pub_res = client.post(f"/forms/{form_id}/publish")
    assert pub_res.status_code == 200
    assert pub_res.json()["status"] == "published"

    # Unpublish form
    unpub_res = client.post(f"/forms/{form_id}/unpublish")
    assert unpub_res.status_code == 200
    assert unpub_res.json()["status"] == "draft"


def test_duplicate_and_delete_form(client):
    create_res = client.post(
        "/forms",
        json={
            "title": "Original Form",
            "questions": [
                {"type": "number", "title": "Your Age", "required": False, "config": {"min": 18, "max": 100}}
            ],
        },
    )
    form_id = create_res.json()["id"]

    # Duplicate
    dup_res = client.post(f"/forms/{form_id}/duplicate")
    assert dup_res.status_code == 201
    dup_data = dup_res.json()
    assert dup_data["id"] != form_id
    assert dup_data["title"] == "Copy of Original Form"
    assert len(dup_data["questions"]) == 1
    assert dup_data["questions"][0]["title"] == "Your Age"

    # Delete original
    del_res = client.delete(f"/forms/{form_id}")
    assert del_res.status_code == 204

    # Verify not found
    get_res = client.get(f"/forms/{form_id}")
    assert get_res.status_code == 404


def test_questions_crud_and_reorder(client):
    create_res = client.post("/forms", json={"title": "Question Testing Form"})
    form_id = create_res.json()["id"]

    # Create question
    q_res = client.post(
        f"/forms/{form_id}/questions",
        json={
            "type": "choice",
            "title": "Favorite Color",
            "required": True,
            "config": {"options": ["Red", "Green", "Blue"]},
        },
    )
    assert q_res.status_code == 201
    q_data = q_res.json()
    q_id = q_data["id"]
    assert q_data["title"] == "Favorite Color"

    # Add second question
    q2_res = client.post(
        f"/forms/{form_id}/questions",
        json={
            "type": "text",
            "title": "Why is this your favorite color?",
            "required": False,
        },
    )
    assert q2_res.status_code == 201
    q2_id = q2_res.json()["id"]

    # Reorder questions
    reorder_res = client.post(
        f"/forms/{form_id}/questions/reorder",
        json={"question_ids": [q2_id, q_id]},
    )
    assert reorder_res.status_code == 200
    reordered = reorder_res.json()
    assert reordered[0]["id"] == q2_id
    assert reordered[0]["position"] == 0
    assert reordered[1]["id"] == q_id
    assert reordered[1]["position"] == 1

    # Update question
    up_res = client.put(
        f"/forms/{form_id}/questions/{q_id}",
        json={"title": "Your Very Favorite Color"},
    )
    assert up_res.status_code == 200
    assert up_res.json()["title"] == "Your Very Favorite Color"

    # Delete question
    del_res = client.delete(f"/forms/{form_id}/questions/{q2_id}")
    assert del_res.status_code == 204

    # Verify only 1 remains
    list_q = client.get(f"/forms/{form_id}/questions")
    assert len(list_q.json()) == 1


def test_server_side_validation_and_submission(client):
    # Create form with multiple question types
    create_res = client.post(
        "/forms",
        json={
            "title": "Validation Test Form",
            "slug": "val-test-form",
            "questions": [
                {
                    "type": "email",
                    "title": "Email Address",
                    "required": True,
                },
                {
                    "type": "number",
                    "title": "Score (1-10)",
                    "required": True,
                    "config": {"min": 1, "max": 10},
                },
                {
                    "type": "choice",
                    "title": "Subscription Tier",
                    "required": True,
                    "config": {"options": ["Free", "Pro", "Enterprise"]},
                },
                {
                    "type": "multiple_choice",
                    "title": "Preferred Channels",
                    "required": False,
                    "config": {"options": ["Email", "SMS", "In-App"]},
                },
                {
                    "type": "rating",
                    "title": "Experience Rating",
                    "required": True,
                    "config": {"rating_scale": 5},
                },
            ],
        },
    )
    form_id = create_res.json()["id"]
    slug = create_res.json()["slug"]
    questions = create_res.json()["questions"]
    q_email, q_num, q_choice, q_mult, q_rating = questions[0], questions[1], questions[2], questions[3], questions[4]

    # Form is currently draft: public access should be 403
    pub_get_draft = client.get(f"/public/forms/{slug}")
    assert pub_get_draft.status_code == 403

    # Publish the form
    client.post(f"/forms/{form_id}/publish")

    # Now public GET succeeds
    pub_get = client.get(f"/public/forms/{slug}")
    assert pub_get.status_code == 200
    assert len(pub_get.json()["questions"]) == 5

    # 1. Missing required fields validation
    res_fail1 = client.post(f"/public/forms/{slug}/responses", json={"answers": []})
    assert res_fail1.status_code == 422
    assert "required" in str(res_fail1.json())

    # 2. Invalid email format
    res_fail2 = client.post(
        f"/public/forms/{slug}/responses",
        json={
            "answers": [
                {"question_id": q_email["id"], "value": "not-an-email"},
                {"question_id": q_num["id"], "value": 5},
                {"question_id": q_choice["id"], "value": "Pro"},
                {"question_id": q_rating["id"], "value": 4},
            ]
        },
    )
    assert res_fail2.status_code == 422
    assert "Invalid email" in str(res_fail2.json())

    # 3. Invalid number (outside range)
    res_fail3 = client.post(
        f"/public/forms/{slug}/responses",
        json={
            "answers": [
                {"question_id": q_email["id"], "value": "test@example.com"},
                {"question_id": q_num["id"], "value": 99},  # max is 10
                {"question_id": q_choice["id"], "value": "Pro"},
                {"question_id": q_rating["id"], "value": 4},
            ]
        },
    )
    assert res_fail3.status_code == 422
    assert "less than or equal to 10" in str(res_fail3.json())

    # 4. Choice not in options
    res_fail4 = client.post(
        f"/public/forms/{slug}/responses",
        json={
            "answers": [
                {"question_id": q_email["id"], "value": "test@example.com"},
                {"question_id": q_num["id"], "value": 5},
                {"question_id": q_choice["id"], "value": "Ultra-Premium"},  # not in options
                {"question_id": q_rating["id"], "value": 4},
            ]
        },
    )
    assert res_fail4.status_code == 422
    assert "not in allowed options" in str(res_fail4.json())

    # 5. Multiple choice option not in options
    res_fail5 = client.post(
        f"/public/forms/{slug}/responses",
        json={
            "answers": [
                {"question_id": q_email["id"], "value": "test@example.com"},
                {"question_id": q_num["id"], "value": 5},
                {"question_id": q_choice["id"], "value": "Pro"},
                {"question_id": q_mult["id"], "value": ["Email", "Carrier Pigeon"]},  # invalid option
                {"question_id": q_rating["id"], "value": 4},
            ]
        },
    )
    assert res_fail5.status_code == 422
    assert "Carrier Pigeon" in str(res_fail5.json())

    # 6. Rating out of bounds
    res_fail6 = client.post(
        f"/public/forms/{slug}/responses",
        json={
            "answers": [
                {"question_id": q_email["id"], "value": "test@example.com"},
                {"question_id": q_num["id"], "value": 5},
                {"question_id": q_choice["id"], "value": "Pro"},
                {"question_id": q_rating["id"], "value": 10},  # scale is 5
            ]
        },
    )
    assert res_fail6.status_code == 422
    assert "between 1 and 5" in str(res_fail6.json())

    # 7. Valid submission
    res_success = client.post(
        f"/public/forms/{slug}/responses",
        json={
            "answers": [
                {"question_id": q_email["id"], "value": "test@example.com"},
                {"question_id": q_num["id"], "value": 8},
                {"question_id": q_choice["id"], "value": "Enterprise"},
                {"question_id": q_mult["id"], "value": ["Email", "SMS"]},
                {"question_id": q_rating["id"], "value": 5},
            ]
        },
    )
    assert res_success.status_code == 201
    resp_data = res_success.json()
    assert resp_data["form_id"] == form_id
    assert len(resp_data["answers"]) == 5

    # 8. Check Results endpoints
    res_list = client.get(f"/forms/{form_id}/responses")
    assert res_list.status_code == 200
    assert len(res_list.json()) == 1
    response_id = res_list.json()[0]["id"]

    detail_res = client.get(f"/forms/{form_id}/responses/{response_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == response_id
    assert len(detail_res.json()["answers"]) == 5

    missing_response = client.get(f"/forms/{form_id}/responses/not-a-response")
    assert missing_response.status_code == 404

    stats_res = client.get(f"/forms/{form_id}/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_responses"] == 1
    assert stats["completion_rate"] == 100.0
    assert len(stats["questions_stats"]) == 5


def test_export_responses_as_csv(client):
    create_res = client.post(
        "/forms",
        json={
            "title": "CSV Export Form",
            "slug": "csv-export-form",
            "questions": [
                {"type": "short_text", "title": "Favorite item", "required": False},
                {"type": "multiple_choice", "title": "Selected items", "required": False},
            ],
        },
    )
    assert create_res.status_code == 201
    form_id = create_res.json()["id"]
    question_ids = [question["id"] for question in create_res.json()["questions"]]

    publish_res = client.post(f"/forms/{form_id}/publish")
    assert publish_res.status_code == 200
    submit_res = client.post(
        "/public/forms/csv-export-form/responses",
        json={
            "answers": [
                {"question_id": question_ids[0], "value": "=1+1"},
                {"question_id": question_ids[1], "value": ["One", "Two"]},
            ]
        },
    )
    assert submit_res.status_code == 201

    export_res = client.get(f"/forms/{form_id}/responses/export.csv")
    assert export_res.status_code == 200
    assert export_res.headers["content-type"].startswith("text/csv")
    assert "attachment;" in export_res.headers["content-disposition"]
    rows = list(csv.reader(io.StringIO(export_res.text)))
    assert rows[0] == [
        "Response ID",
        "Started at",
        "Submitted at",
        "Duration (seconds)",
        "Favorite item",
        "Selected items",
    ]
    assert rows[1][0] == submit_res.json()["id"]
    assert rows[1][4:] == ["'=1+1", "One, Two"]

    missing_form_res = client.get("/forms/not-a-form/responses/export.csv")
    assert missing_form_res.status_code == 404


def test_normalized_question_types(client):
    create_res = client.post(
        "/forms",
        json={
            "title": "Normalized Types Form",
            "slug": "normalized-form",
            "questions": [
                {
                    "type": "short_text",
                    "title": "Short text title",
                    "required": True,
                    "config": {"max_length": 20},
                },
                {
                    "type": "long_text",
                    "title": "Long text title",
                    "required": False,
                },
                {
                    "type": "yes_no",
                    "title": "Are you satisfied?",
                    "required": True,
                },
            ],
        },
    )
    assert create_res.status_code == 201
    form_id = create_res.json()["id"]
    slug = create_res.json()["slug"]
    client.post(f"/forms/{form_id}/publish")

    q_short, q_long, q_yn = create_res.json()["questions"]

    # Invalid yes_no value
    bad_yn = client.post(
        f"/public/forms/{slug}/responses",
        json={
            "answers": [
                {"question_id": q_short["id"], "value": "A valid string"},
                {"question_id": q_yn["id"], "value": "maybe"},
            ]
        },
    )
    assert bad_yn.status_code == 422
    assert "Value must be 'yes' or 'no'" in str(bad_yn.json())

    # Valid submission
    ok_res = client.post(
        f"/public/forms/{slug}/responses",
        json={
            "answers": [
                {"question_id": q_short["id"], "value": "All good"},
                {"question_id": q_long["id"], "value": "Some very detailed explanation here."},
                {"question_id": q_yn["id"], "value": "yes"},
            ]
        },
    )
    assert ok_res.status_code == 201
    answers = ok_res.json()["answers"]
    assert len(answers) == 3

    stats_res = client.get(f"/forms/{form_id}/stats")
    assert stats_res.status_code == 200
    yes_no_stats = next(
        stats for stats in stats_res.json()["questions_stats"]
        if stats["question_id"] == q_yn["id"]
    )
    assert yes_no_stats["data"]["options_breakdown"] == [
        {"option": "yes", "count": 1, "percentage": 100.0},
        {"option": "no", "count": 0, "percentage": 0.0},
    ]
