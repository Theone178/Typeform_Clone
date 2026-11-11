import os
import random
import sys
from datetime import datetime, timedelta, timezone

# Add backend and project root to sys.path
_cur_dir = os.path.dirname(os.path.abspath(__file__))
_root_dir = os.path.dirname(_cur_dir)
for p in (_cur_dir, _root_dir):
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from app.database import Base, SessionLocal, engine, init_db
    from app.models import Answer, Form, Question, Response
except ImportError:
    from backend.app.database import Base, SessionLocal, engine, init_db
    from backend.app.models import Answer, Form, Question, Response


def run_seed():
    print("Initializing database...")
    init_db()
    db = SessionLocal()

    try:
        # Check if already seeded to prevent duplicate clutter (or clean existing)
        existing_forms = db.query(Form).filter(Form.slug.in_(["product-feedback", "developer-experience"])).all()
        if existing_forms:
            print("Clearing previous seed data...")
            for f in existing_forms:
                db.delete(f)
            db.commit()

        print("Seeding Form 1: Product Feedback Survey...")
        form1 = Form(
            title="Product Feedback Survey",
            status="published",
            slug="product-feedback",
            theme={
                "primary_color": "#7c3aed",
                "background_color": "#0f172a",
                "text_color": "#f8fafc",
                "font": "Inter",
            },
            thank_you={
                "title": "Thank you for your feedback!",
                "message": "Your insights directly help us build a better product.",
                "button_text": "Back to Home",
                "button_url": "/",
            },
        )
        db.add(form1)
        db.flush()

        # Questions for Form 1 — using normalized types
        q1_1 = Question(
            form_id=form1.id,
            type="short_text",
            title="What is your full name?",
            description="Please enter your first and last name",
            required=True,
            position=0,
            config={"placeholder": "Jane Doe", "max_length": 100},
        )
        q1_2 = Question(
            form_id=form1.id,
            type="email",
            title="What is your work email?",
            description="We will only reach out if you request follow-up",
            required=True,
            position=1,
            config={"placeholder": "jane@company.com"},
        )
        q1_3 = Question(
            form_id=form1.id,
            type="multiple_choice",
            title="How often do you use our product?",
            description="Select the option that best reflects your usage",
            required=True,
            position=2,
            # allow_multiple=False → single-select
            config={"options": ["Daily", "Weekly", "A few times a month", "Rarely"], "allow_multiple": False},
        )
        q1_4 = Question(
            form_id=form1.id,
            type="rating",
            title="Overall, how satisfied are you with our platform?",
            description="1 is completely dissatisfied, 5 is extremely satisfied",
            required=True,
            position=3,
            config={"rating_scale": 5},
        )
        q1_5 = Question(
            form_id=form1.id,
            type="multiple_choice",
            title="Which features do you find most valuable?",
            description="Select all that apply",
            required=False,
            position=4,
            # allow_multiple=True → multi-select
            config={"options": ["Analytics Dashboard", "Form Builder", "Custom Themes", "Export to CSV", "Integrations"], "allow_multiple": True},
        )
        q1_6 = Question(
            form_id=form1.id,
            type="number",
            title="On a scale of 0 to 10, how likely are you to recommend us to a colleague?",
            description="NPS score (0-10)",
            required=True,
            position=5,
            config={"min": 0, "max": 10},
        )
        q1_7 = Question(
            form_id=form1.id,
            type="yes_no",
            title="Would you like a member of our team to follow up with you?",
            description="We may reach out within 3 business days",
            required=False,
            position=6,
            config={},
        )
        db.add_all([q1_1, q1_2, q1_3, q1_4, q1_5, q1_6, q1_7])
        db.flush()

        print("Seeding Form 2: Developer Experience & Tech Stack Survey...")
        form2 = Form(
            title="Developer Experience & Tech Stack Survey",
            status="published",
            slug="developer-experience",
            theme={
                "primary_color": "#059669",
                "background_color": "#111827",
                "text_color": "#f9fafb",
                "font": "Inter",
            },
            thank_you={
                "title": "You're all done!",
                "message": "Thanks for sharing your tech stack preferences with the community.",
                "button_text": "View Results",
                "button_url": "/results",
            },
        )
        db.add(form2)
        db.flush()

        # Questions for Form 2 — using normalized types
        q2_1 = Question(
            form_id=form2.id,
            type="email",
            title="What is your email address?",
            description="We'll send you the aggregated report",
            required=True,
            position=0,
            config={"placeholder": "dev@domain.com"},
        )
        q2_2 = Question(
            form_id=form2.id,
            type="multiple_choice",
            title="What is your primary development role?",
            description="Your day-to-day focus",
            required=True,
            position=1,
            config={"options": ["Full Stack Developer", "Backend Engineer", "Frontend Specialist", "DevOps / SRE", "Engineering Manager"], "allow_multiple": False},
        )
        q2_3 = Question(
            form_id=form2.id,
            type="multiple_choice",
            title="Which backend frameworks do you actively use?",
            description="Select all that apply",
            required=True,
            position=2,
            config={"options": ["FastAPI", "Django", "Node.js / Express", "Go (Gin/Fiber)", "Spring Boot", "Ruby on Rails"], "allow_multiple": True},
        )
        q2_4 = Question(
            form_id=form2.id,
            type="rating",
            title="How would you rate your developer tooling happiness?",
            description="From 1 (frustrating) to 5 (blissful)",
            required=True,
            position=3,
            config={"rating_scale": 5},
        )
        q2_5 = Question(
            form_id=form2.id,
            type="number",
            title="How many hours per week do you spend coding?",
            description="Estimate active programming hours",
            required=False,
            position=4,
            config={"min": 1, "max": 100},
        )
        q2_6 = Question(
            form_id=form2.id,
            type="dropdown",
            title="What is your engineering team size?",
            description="Select your organization size bracket",
            required=True,
            position=5,
            config={"options": ["1-5 engineers", "6-20 engineers", "21-50 engineers", "50+ engineers"]},
        )
        q2_7 = Question(
            form_id=form2.id,
            type="long_text",
            title="What developer tool could you not live without?",
            description="IDE, terminal, debugger, AI tool, etc.",
            required=False,
            position=6,
            config={"placeholder": "e.g. VS Code, Docker, Antigravity"},
        )
        db.add_all([q2_1, q2_2, q2_3, q2_4, q2_5, q2_6, q2_7])
        db.flush()

        # Seed ~12 responses for Form 1
        print("Seeding responses for Form 1...")
        f1_respondents = [
            ("Alice Smith", "alice.smith@techcorp.io", "Daily", 5, ["Analytics Dashboard", "Form Builder"], 10, "yes"),
            ("Bob Jones", "bob.jones@startup.co", "Weekly", 4, ["Form Builder", "Custom Themes"], 8, "no"),
            ("Charlie Brown", "charlie@designhub.org", "Daily", 5, ["Analytics Dashboard", "Export to CSV"], 9, "yes"),
            ("Diana Prince", "diana.prince@themyscira.com", "A few times a month", 3, ["Custom Themes"], 7, "no"),
            ("Evan Wright", "evan.wright@agency.net", "Daily", 5, ["Form Builder", "Custom Themes", "Export to CSV"], 10, "yes"),
            ("Fiona Gallagher", "fiona@chicago.edu", "Weekly", 4, ["Analytics Dashboard"], 8, "no"),
            ("George Clark", "george@enterprise.com", "Rarely", 2, ["Export to CSV"], 5, "no"),
            ("Hannah Abbott", "hannah@hufflepuff.org", "Weekly", 4, ["Form Builder", "Analytics Dashboard"], 9, "yes"),
            ("Ian Malcolm", "ian.m@ingen.com", "Daily", 5, ["Analytics Dashboard", "Integrations"], 10, "yes"),
            ("Julia Roberts", "julia@cinema.com", "A few times a month", 3, ["Custom Themes"], 6, "no"),
            ("Kevin Bacon", "kevin@sixdegrees.net", "Weekly", 4, ["Form Builder"], 8, "yes"),
            ("Laura Croft", "laura@relics.org", "Daily", 5, ["Analytics Dashboard", "Form Builder", "Custom Themes"], 10, "yes"),
        ]

        base_time = datetime.now(timezone.utc) - timedelta(days=7)
        for idx, resp_tuple in enumerate(f1_respondents):
            name, email, freq, rating, features, nps, follow_up = resp_tuple
            start_t = base_time + timedelta(hours=idx * 12, minutes=random.randint(5, 30))
            sub_t = start_t + timedelta(seconds=random.randint(45, 180))

            resp = Response(
                form_id=form1.id,
                started_at=start_t,
                submitted_at=sub_t,
            )
            db.add(resp)
            db.flush()

            answers = [
                Answer(response_id=resp.id, question_id=q1_1.id, value=name),
                Answer(response_id=resp.id, question_id=q1_2.id, value=email),
                Answer(response_id=resp.id, question_id=q1_3.id, value=freq),
                Answer(response_id=resp.id, question_id=q1_4.id, value=rating),
                Answer(response_id=resp.id, question_id=q1_5.id, value=features),
                Answer(response_id=resp.id, question_id=q1_6.id, value=nps),
                Answer(response_id=resp.id, question_id=q1_7.id, value=follow_up),
            ]
            db.add_all(answers)

        # Seed ~10 responses for Form 2
        print("Seeding responses for Form 2...")
        f2_respondents = [
            ("marcus.aurelius@rome.it", "Backend Engineer", ["FastAPI", "Go (Gin/Fiber)"], 5, 35, "6-20 engineers", "Neovim"),
            ("sarah.connor@cyberdyne.com", "DevOps / SRE", ["Go (Gin/Fiber)", "Node.js / Express"], 4, 25, "50+ engineers", "Docker"),
            ("peter.parker@dailybugle.com", "Full Stack Developer", ["FastAPI", "Node.js / Express"], 4, 40, "1-5 engineers", "VS Code"),
            ("bruce.wayne@waynecorp.com", "Engineering Manager", ["FastAPI", "Spring Boot", "Go (Gin/Fiber)"], 4, 15, "50+ engineers", "GitHub Copilot"),
            ("clark.kent@dailyplanet.com", "Frontend Specialist", ["Node.js / Express"], 3, 30, "21-50 engineers", "Chrome DevTools"),
            ("barry.allen@starlabs.org", "Full Stack Developer", ["FastAPI", "Django"], 5, 45, "1-5 engineers", "Antigravity"),
            ("tony.stark@starkindustries.com", "Backend Engineer", ["FastAPI", "Go (Gin/Fiber)"], 5, 50, "50+ engineers", "Python interactive debugger"),
            ("natasha.romanoff@shield.gov", "DevOps / SRE", ["Go (Gin/Fiber)"], 4, 28, "21-50 engineers", "Kubectl"),
            ("steve.rogers@avengers.org", "Full Stack Developer", ["Spring Boot", "FastAPI"], 4, 32, "6-20 engineers", "IntelliJ IDEA"),
            ("wanda.maximoff@westview.org", "Backend Engineer", ["Django", "FastAPI"], 5, 38, "6-20 engineers", "Postman"),
        ]

        for idx, resp_tuple in enumerate(f2_respondents):
            email, role, frameworks, dev_happy, hours, team_size, fav_tool = resp_tuple
            start_t = base_time + timedelta(hours=idx * 14, minutes=random.randint(10, 40))
            sub_t = start_t + timedelta(seconds=random.randint(50, 220))

            resp = Response(
                form_id=form2.id,
                started_at=start_t,
                submitted_at=sub_t,
            )
            db.add(resp)
            db.flush()

            answers = [
                Answer(response_id=resp.id, question_id=q2_1.id, value=email),
                Answer(response_id=resp.id, question_id=q2_2.id, value=role),
                Answer(response_id=resp.id, question_id=q2_3.id, value=frameworks),
                Answer(response_id=resp.id, question_id=q2_4.id, value=dev_happy),
                Answer(response_id=resp.id, question_id=q2_5.id, value=hours),
                Answer(response_id=resp.id, question_id=q2_6.id, value=team_size),
                Answer(response_id=resp.id, question_id=q2_7.id, value=fav_tool),
            ]
            db.add_all(answers)

        db.commit()
        print(f"Seed completed successfully! Seeded 2 forms and {len(f1_respondents) + len(f2_respondents)} responses.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
