import os
import json
import logging
import datetime
from sqlalchemy.orm import Session

# Setup mock/local environment variables
os.environ["DATABASE_URL"] = "sqlite:///./test_healthpilot.db"
os.environ["SECRET_KEY"] = "testsecretkeyonlyforintegrationtests"
os.environ["GEMINI_API_KEY"] = "MOCK_KEY_FOR_LOCAL_VALIDATION"
os.environ["GROQ_API_KEY"] = "MOCK_KEY_FOR_LOCAL_VALIDATION"

from backend.app.database import create_tables, engine, SessionLocal, User, Profile, Goal, HealthScore
from backend.app.security import get_password_hash
from backend.app.agents.coordinator import CoordinatorAgent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TestBackend")

def run_tests():
    logger.info("Initializing Test Database...")
    create_tables()
    
    db = SessionLocal()
    try:
        # 1. Clean previous tests
        db.query(User).delete()
        db.query(Profile).delete()
        db.query(Goal).delete()
        db.query(HealthScore).delete()
        db.commit()
        
        # 2. Register Test User
        logger.info("Registering test user...")
        pwd_hash = get_password_hash("testpassword123")
        test_user = User(username="testpatient", email="patient@test.com", password_hash=pwd_hash)
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        logger.info(f"User created with ID: {test_user.id}")
        
        # 3. Create Profile
        logger.info("Creating patient health profile...")
        history = {
            "diabetes": False,
            "hypertension": True,
            "thyroid": False,
            "anemia": False,
            "asthma": False,
            "other": "Mild dust allergy"
        }
        test_profile = Profile(
            user_id=test_user.id,
            name="John Doe",
            age=42,
            gender="Male",
            occupation="Software Engineer",
            medical_history=json.dumps(history)
        )
        db.add(test_profile)
        db.commit()
        logger.info("Profile created successfully.")
        
        # 4. Prepare Context
        logger.info("Building multi-agent shared context...")
        shared_context = {
            "user_profile": {
                "name": test_profile.name,
                "age": test_profile.age,
                "gender": test_profile.gender,
                "occupation": test_profile.occupation,
                "medical_history": history
            },
            "symptoms": {
                "raw_text": "I feel slight chest tightness and a minor headache since afternoon. No severe pain.",
                "parsed_symptoms": ["chest tightness", "headache"],
                "duration": "Since afternoon",
                "severity": "Mild"
            },
            "report_analysis": {
                "extracted_text": "",
                "abnormalities": [],
                "summary": "No reports uploaded.",
                "insights": [],
                "tracked_metrics": {}
            },
            "previous_reports": [],
            "medications": [
                {
                    "name": "Amlodipine",
                    "dosage": "5mg",
                    "schedule": {"times": ["morning"]},
                    "start_date": "2026-06-01",
                    "adherence_logs": {}
                }
            ],
            "lifestyle": {
                "sleep_hours": 6.5,
                "water_ml": 1500,
                "steps": 4000,
                "active_minutes": 15,
                "exercise_type": "None"
            },
            "goals": [],
            "health_score": {
                "overall": 100, "lifestyle": 100, "meds": 100, "goals": 100, "reports": 100
            },
            "emergency_status": {
                "is_emergency": False, "risk_level": "Low", "reason": "", "instructions": ""
            }
        }
        
        # 5. Run Coordinator (Testing Agent Engine logic)
        logger.info("Triggering Coordinator Agent engine...")
        coordinator = CoordinatorAgent()
        
        # Note: Since the GEMINI_API_KEY is mock here, we expect a fallback trigger 
        # or we verify the execution path handles fallback gracefully.
        logger.info("Testing Coordinator agent selection...")
        selected_agents = coordinator.decide_agents(shared_context["symptoms"]["raw_text"], shared_context)
        logger.info(f"Agents decided for execution: {selected_agents}")
        
        # Force execute agents locally with mock-resilient steps
        logger.info("Executing Emergency triage agent...")
        shared_context = coordinator.agents["emergency"].run(shared_context)
        logger.info(f"Triage complete. Risk level: {shared_context['emergency_status']['risk_level']}")
        
        logger.info("Executing Health Assessment agent...")
        shared_context = coordinator.agents["health_assessment"].run(shared_context)
        logger.info(f"Assessment summary: {shared_context.get('health_assessment', {}).get('summary')}")
        
        logger.info("Executing Nutrition agent...")
        shared_context = coordinator.agents["nutrition"].run(shared_context)
        logger.info(f"Diet plan generated: {shared_context.get('nutrition_plan', {}).get('diet_type')}")
        
        logger.info("Executing Goal Planning agent...")
        shared_context = coordinator.agents["goal_planning"].run(shared_context)
        logger.info(f"Recommended goals: {[g['title'] for g in shared_context.get('recommended_goals', [])]}")
        
        logger.info("Executing Progress Analytics agent...")
        shared_context = coordinator.agents["progress_analytics"].run(shared_context)
        logger.info(f"Overall Health Score compiled: {shared_context.get('analytics_dashboard', {}).get('overall_score')}/100")
        
        # 6. Save outputs to test DB
        logger.info("Persisting agent recommendations to database...")
        for rg in shared_context.get("recommended_goals", []):
            db.add(Goal(
                user_id=test_user.id,
                title=rg["title"],
                target_value=rg.get("target_value"),
                current_value=rg.get("current_value", "0"),
                period=rg.get("period", "daily"),
                status="pending"
            ))
            
        dash = shared_context.get("analytics_dashboard", {})
        db.add(HealthScore(
            user_id=test_user.id,
            score_date=datetime.date.today(),
            overall_score=dash.get("overall_score", 100),
            report_score=dash.get("report_score", 100),
            medication_score=dash.get("medication_score", 100),
            lifestyle_score=dash.get("lifestyle_score", 100),
            goal_score=dash.get("goal_score", 100),
            recommendations=json.dumps(dash.get("recommendations", [])),
            future_risks=json.dumps(dash.get("future_risks", []))
        ))
        db.commit()
        
        # 7. Check database rows
        goals_count = db.query(Goal).filter(Goal.user_id == test_user.id).count()
        score_record = db.query(HealthScore).filter(HealthScore.user_id == test_user.id).first()
        
        logger.info(f"Verification: Goals saved: {goals_count}")
        logger.info(f"Verification: Score record saved: Overall Score = {score_record.overall_score}")
        
        logger.info("--- INTEGRATION TESTS PASSED SUCCESSFULLY ---")
        
    except Exception as e:
        logger.error(f"Integration tests failed: {str(e)}")
        raise e
    finally:
        db.close()
        # Clean up test database
        if os.path.exists("./test_healthpilot.db"):
            try:
                os.remove("./test_healthpilot.db")
            except Exception:
                pass

if __name__ == "__main__":
    run_tests()
