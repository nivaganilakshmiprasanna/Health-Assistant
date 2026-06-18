import os
import json
import datetime
from sqlalchemy.orm import Session

# Force test/prod database name loading
os.environ["DATABASE_URL"] = "sqlite:///./healthpilot.db"

from backend.app.database import create_tables, SessionLocal, User, Profile, MedicalReport, Medication, LifestyleLog, Goal, HealthScore
from backend.app.security import get_password_hash

def seed_database():
    print("Seeding database...")
    create_tables()
    
    db = SessionLocal()
    try:
        # Check if user already seeded
        existing_user = db.query(User).filter(User.email == "patient@healthpilot.ai").first()
        if existing_user:
            print("Database already seeded. Skipping seeding.")
            return

        # 1. Create Patient User
        pwd_hash = get_password_hash("password123")
        patient = User(
            username="JohnDoe",
            email="patient@healthpilot.ai",
            password_hash=pwd_hash
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)
        print(f"Test Patient user created: ID={patient.id}, Username={patient.username}")

        # 2. Create Profile
        history = {
            "diabetes": False,
            "hypertension": True,
            "thyroid": False,
            "anemia": False,
            "asthma": False,
            "other": "Mild dust allergy"
        }
        profile = Profile(
            user_id=patient.id,
            name="John Doe",
            age=42,
            gender="Male",
            occupation="Senior Software Engineer",
            medical_history=json.dumps(history)
        )
        db.add(profile)
        db.commit()
        print("Profile created.")

        # 3. Create active medications
        med1 = Medication(
            user_id=patient.id,
            name="Amlodipine (for Hypertension)",
            dosage="5mg",
            schedule=json.dumps({"times": ["morning"]}),
            start_date=datetime.date.today() - datetime.timedelta(days=15),
            end_date=None,
            adherence_logs=json.dumps({
                (datetime.date.today() - datetime.timedelta(days=i)).strftime("%Y-%m-%d"): {"morning": True}
                for i in range(1, 11)
            })
        )
        med2 = Medication(
            user_id=patient.id,
            name="Atorvastatin (Cholesterol)",
            dosage="10mg",
            schedule=json.dumps({"times": ["night"]}),
            start_date=datetime.date.today() - datetime.timedelta(days=15),
            end_date=None,
            adherence_logs=json.dumps({
                (datetime.date.today() - datetime.timedelta(days=i)).strftime("%Y-%m-%d"): {"night": i % 3 != 0}
                for i in range(1, 11)
            })
        )
        db.add(med1)
        db.add(med2)
        db.commit()
        print("Medications seeded.")

        # 4. Create active and completed goals
        goals_data = [
            {"title": "Walk 8000 Steps Daily", "target_value": "8000 steps", "current_value": "0", "period": "daily", "status": "pending"},
            {"title": "Drink 3 Liters Water Daily", "target_value": "3000 ml", "current_value": "0", "period": "daily", "status": "pending"},
            {"title": "Check Blood Pressure Weekly", "target_value": "Once weekly", "current_value": "1", "period": "weekly", "status": "completed"},
            {"title": "Complete 30 mins Cardio", "target_value": "30 mins", "current_value": "30", "period": "daily", "status": "completed"},
            {"title": "Consult Doctor on Blood Test Trends", "target_value": "Once", "current_value": "Pending", "period": "monthly", "status": "pending"}
        ]
        for gd in goals_data:
            g = Goal(
                user_id=patient.id,
                title=gd["title"],
                target_value=gd["target_value"],
                current_value=gd["current_value"],
                target_date=datetime.date.today() + datetime.timedelta(days=7),
                period=gd["period"],
                status=gd["status"]
            )
            db.add(g)
        db.commit()
        print("Goals seeded.")

        # 5. Create 10 days of historical LifestyleLogs
        lifestyles = [
            {"days_ago": 10, "sleep": 6.2, "water": 1200, "steps": 3200, "active": 10, "type": "None"},
            {"days_ago": 9, "sleep": 5.8, "water": 1500, "steps": 4100, "active": 15, "type": "None"},
            {"days_ago": 8, "sleep": 6.5, "water": 1800, "steps": 5300, "active": 20, "type": "Walking"},
            {"days_ago": 7, "sleep": 7.0, "water": 2000, "steps": 6200, "active": 25, "type": "Walking"},
            {"days_ago": 6, "sleep": 6.8, "water": 1600, "steps": 5000, "active": 10, "type": "None"},
            {"days_ago": 5, "sleep": 7.2, "water": 2200, "steps": 7100, "active": 30, "type": "Yoga"},
            {"days_ago": 4, "sleep": 7.5, "water": 2500, "steps": 8200, "active": 30, "type": "Walking"},
            {"days_ago": 3, "sleep": 6.0, "water": 1800, "steps": 4500, "active": 15, "type": "None"},
            {"days_ago": 2, "sleep": 7.8, "water": 2700, "steps": 9200, "active": 45, "type": "Running"},
            {"days_ago": 1, "sleep": 8.0, "water": 2900, "steps": 9800, "active": 40, "type": "Yoga"},
            {"days_ago": 0, "sleep": 7.5, "water": 2000, "steps": 6500, "active": 30, "type": "Walking"}  # Today
        ]
        for ls in lifestyles:
            log = LifestyleLog(
                user_id=patient.id,
                log_date=datetime.date.today() - datetime.timedelta(days=ls["days_ago"]),
                sleep_hours=ls["sleep"],
                water_ml=ls["water"],
                steps=ls["steps"],
                active_minutes=ls["active"],
                exercise_type=ls["type"]
            )
            db.add(log)
        db.commit()
        print("Lifestyle logs seeded.")

        # 6. Create 10 days of historical HealthScores showing improvements
        scores_history = [
            {"days_ago": 10, "overall": 61, "reports": 80, "meds": 60, "life": 50, "goals": 50},
            {"days_ago": 9, "overall": 63, "reports": 80, "meds": 65, "life": 52, "goals": 50},
            {"days_ago": 8, "overall": 68, "reports": 80, "meds": 70, "life": 60, "goals": 60},
            {"days_ago": 7, "overall": 72, "reports": 80, "meds": 75, "life": 65, "goals": 65},
            {"days_ago": 6, "overall": 71, "reports": 80, "meds": 80, "life": 58, "goals": 65},
            {"days_ago": 5, "overall": 76, "reports": 80, "meds": 85, "life": 70, "goals": 70},
            {"days_ago": 4, "overall": 79, "reports": 80, "meds": 90, "life": 75, "goals": 70},
            {"days_ago": 3, "overall": 75, "reports": 80, "meds": 90, "life": 62, "goals": 70},
            {"days_ago": 2, "overall": 82, "reports": 80, "meds": 95, "life": 80, "goals": 75},
            {"days_ago": 1, "overall": 85, "reports": 80, "meds": 100, "life": 85, "goals": 80},
            {"days_ago": 0, "overall": 86, "reports": 80, "meds": 100, "life": 82, "goals": 80} # Today
        ]
        
        recs = [
            "Maintain your high medication adherence rate of 100% for Amlodipine.",
            "Increase daily hydration logs to cross 3,000ml to improve cardiovascular fluid balance.",
            "Schedule a medical follow-up check for blood pressure levels next week.",
            "Include more iron-rich items (spinach, beetroot, dal) in your lunches to improve baseline fatigue."
        ]
        
        risks = [
            {"risk_name": "Mild Hypertension Risk", "risk_level": "Medium", "factors": "Self-reported diagnosis notes.", "preventive_action": "Reduce dietary sodium intake and maintain active walking goals."},
            {"risk_name": "Lifestyle Fatigue Risk", "risk_level": "Low", "factors": "Improving sleep trends (now 7.5 hours average).", "preventive_action": "Ensure screen time reduction after 10:30 PM."}
        ]

        for sh in scores_history:
            hs = HealthScore(
                user_id=patient.id,
                score_date=datetime.date.today() - datetime.timedelta(days=sh["days_ago"]),
                overall_score=sh["overall"],
                report_score=sh["reports"],
                medication_score=sh["meds"],
                lifestyle_score=sh["life"],
                goal_score=sh["goals"],
                recommendations=json.dumps(recs),
                future_risks=json.dumps(risks)
            )
            db.add(hs)
        db.commit()
        print("Health scores seeded.")

        # 7. Create a mock blood report analysis
        report_analysis = {
            "summary": "Blood test indicates mild vitamin deficiencies and borderline high cholesterol, with otherwise healthy metabolic and renal parameters.",
            "abnormalities": [
                {
                    "parameter": "Vitamin D, 25-Hydroxy",
                    "value": "14.2 ng/mL",
                    "reference_range": "30.0 - 100.0 ng/mL",
                    "status": "Low / Deficient",
                    "explanation": "Low Vitamin D causes reduced calcium absorption, muscle fatigue, and bone aches."
                },
                {
                    "parameter": "Total Cholesterol",
                    "value": "228 mg/dL",
                    "reference_range": "100.0 - 200.0 mg/dL",
                    "status": "High / Borderline",
                    "explanation": "Elevated cholesterol levels can increase cardiovascular stress over time."
                }
            ],
            "trends": "This is the baseline report. No older clinical reports are available for trend lines.",
            "insights": [
                "Recommend early morning sun exposure for 15-20 minutes daily.",
                "Incorporate foods rich in Vitamin D (fortified grains, milk) and limit saturated fats (fried food, excessive butter).",
                "Consult physician for potential Vitamin D3 weekly supplementation."
            ],
            "tracked_metrics": {
                "Vitamin D": 14.2,
                "Cholesterol": 228.0
            }
        }
        
        mock_report = MedicalReport(
            user_id=patient.id,
            filename="Blood_Panel_Report_May_2026.pdf",
            file_path="uploads/mock_report.pdf",
            extracted_text="Patient: John Doe | Age: 42 | Gender: Male\nLab results: Vitamin D, 25-Hydroxy: 14.2 ng/mL (Low) | Total Cholesterol: 228 mg/dL (High) | Serum Creatinine: 0.9 mg/dL (Normal) | HbA1c: 5.4% (Normal)",
            analysis_result=json.dumps(report_analysis),
            created_at=datetime.datetime.utcnow()
        )
        db.add(mock_report)
        db.commit()
        print("Mock report seeded.")
        
        print("--- SEEDING COMPLETED SUCCESSFULLY ---")
        
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
