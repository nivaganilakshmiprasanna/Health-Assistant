import os
import json
import logging
import datetime
from datetime import date
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

# Import backend modules
from app.config import PORT, UPLOAD_DIR
from app.database import (
    get_db, create_tables, User, Profile, MedicalReport, Medication, LifestyleLog, Goal, HealthScore
)
from app.schemas import (
    UserRegister, UserLogin, UserResponse, Token,
    ProfileCreate, ProfileResponse, MedicationCreate, MedicationLog, MedicationResponse,
    LifestyleLogCreate, LifestyleLogResponse, GoalCreate, GoalResponse, GoalUpdate,
    MedicalReportResponse, HealthScoreResponse, CoordinatorRequest, CoordinatorResponse
)
from app.security import (
    get_password_hash, verify_password, create_access_token, verify_token
)
from app.utils.ocr import perform_ocr
from app.agents.coordinator import CoordinatorAgent
from app.agents.nutrition import NutritionAgent
from app.agents.lifestyle import LifestyleAgent
from app.agents.medication import MedicationAgent
from app.agents.analytics import ProgressAnalyticsAgent
from app.utils.groq_client import generate_text

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Health Assistant Intellegent API",
    description="Multi-Agent Healthcare Coordinator Platform Backend",
    version="1.0.0"
)

# CORS Setup for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend origin e.g. http://localhost:5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2 Scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Startup event to create tables
@app.on_event("startup")
def startup_event():
    logger.info("Initializing database and tables...")
    create_tables()

# ----------------- JWT Dependency -----------------
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# ----------------- Shared Context Builder -----------------
def load_shared_context(user_id: int, db: Session) -> dict:
    """
    Compiles database health objects into a shared context dictionary for agents.
    """
    # 1. Profile
    db_profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    user_profile = {}
    if db_profile:
        try:
            user_profile = {
                "name": db_profile.name,
                "age": db_profile.age,
                "gender": db_profile.gender,
                "occupation": db_profile.occupation,
                "medical_history": json.loads(db_profile.medical_history) if db_profile.medical_history else {}
            }
        except Exception:
            user_profile = {"name": db_profile.name, "age": db_profile.age, "gender": db_profile.gender}

    # 2. Latest Report
    db_report = db.query(MedicalReport).filter(MedicalReport.user_id == user_id).order_by(MedicalReport.created_at.desc()).first()
    report_analysis = {}
    if db_report:
        try:
            report_analysis = json.loads(db_report.analysis_result) if db_report.analysis_result else {}
        except Exception:
            pass
        report_analysis["extracted_text"] = db_report.extracted_text

    # 3. Previous Reports for comparison
    db_reports = db.query(MedicalReport).filter(MedicalReport.user_id == user_id).order_by(MedicalReport.created_at.desc()).all()
    previous_reports = []
    for r in db_reports[1:6]:
        try:
            previous_reports.append({
                "date": r.created_at.strftime("%Y-%m-%d"),
                "filename": r.filename,
                "analysis": json.loads(r.analysis_result) if r.analysis_result else {}
            })
        except Exception:
            pass

    # 4. Medications
    db_meds = db.query(Medication).filter(Medication.user_id == user_id).all()
    medications = []
    for m in db_meds:
        try:
            medications.append({
                "id": m.id,
                "name": m.name,
                "dosage": m.dosage,
                "schedule": json.loads(m.schedule) if m.schedule else {},
                "start_date": m.start_date.strftime("%Y-%m-%d"),
                "end_date": m.end_date.strftime("%Y-%m-%d") if m.end_date else None,
                "adherence_logs": json.loads(m.adherence_logs) if m.adherence_logs else {}
            })
        except Exception:
            pass

    # 5. Today's Lifestyle
    today = datetime.date.today()
    db_lifestyle = db.query(LifestyleLog).filter(LifestyleLog.user_id == user_id, LifestyleLog.log_date == today).first()
    lifestyle = {
        "sleep_hours": 0.0, "water_ml": 0, "steps": 0, "active_minutes": 0, "exercise_type": "None"
    }
    if db_lifestyle:
        lifestyle = {
            "sleep_hours": db_lifestyle.sleep_hours,
            "water_ml": db_lifestyle.water_ml,
            "steps": db_lifestyle.steps,
            "active_minutes": db_lifestyle.active_minutes,
            "exercise_type": db_lifestyle.exercise_type or "None"
        }

    # 6. Goals
    db_goals = db.query(Goal).filter(Goal.user_id == user_id).all()
    goals = []
    for g in db_goals:
        goals.append({
            "id": g.id,
            "title": g.title,
            "target_value": g.target_value,
            "current_value": g.current_value,
            "target_date": g.target_date.strftime("%Y-%m-%d") if g.target_date else None,
            "period": g.period,
            "status": g.status
        })

    # 7. Health Score
    db_score = db.query(HealthScore).filter(HealthScore.user_id == user_id).order_by(HealthScore.score_date.desc()).first()
    health_score = {
        "overall": 100, "lifestyle": 100, "meds": 100, "goals": 100, "reports": 100
    }
    if db_score:
        health_score = {
            "overall": db_score.overall_score,
            "lifestyle": db_score.lifestyle_score,
            "meds": db_score.medication_score,
            "goals": db_score.goal_score,
            "reports": db_score.report_score
        }

    return {
        "user_profile": user_profile,
        "symptoms": {"raw_text": "", "parsed_symptoms": [], "duration": "", "severity": ""},
        "report_analysis": report_analysis,
        "previous_reports": previous_reports,
        "medications": medications,
        "lifestyle": lifestyle,
        "goals": goals,
        "health_score": health_score,
        "emergency_status": {"is_emergency": False, "risk_level": "Low", "reason": "", "instructions": ""}
    }

def serialize_profile(profile: Profile) -> dict:
    history_dict = {}
    if profile.medical_history:
        try:
            history_dict = json.loads(profile.medical_history)
        except Exception:
            history_dict = {}
    return {
        "user_id": profile.user_id,
        "name": profile.name,
        "age": profile.age,
        "gender": profile.gender,
        "occupation": profile.occupation,
        "medical_history": history_dict,
        "created_at": profile.created_at
    }

def serialize_report(report: MedicalReport) -> dict:
    analysis_dict = {}
    if report.analysis_result:
        try:
            analysis_dict = json.loads(report.analysis_result)
        except Exception:
            analysis_dict = {}
    return {
        "id": report.id,
        "user_id": report.user_id,
        "filename": report.filename,
        "file_path": report.file_path,
        "extracted_text": report.extracted_text,
        "analysis_result": analysis_dict,
        "created_at": report.created_at
    }

def serialize_medication(med: Medication) -> dict:
    schedule_dict = {}
    if med.schedule:
        try:
            schedule_dict = json.loads(med.schedule)
        except Exception:
            schedule_dict = {}
            
    logs_dict = {}
    if med.adherence_logs:
        try:
            logs_dict = json.loads(med.adherence_logs)
        except Exception:
            logs_dict = {}
            
    return {
        "id": med.id,
        "user_id": med.user_id,
        "name": med.name,
        "dosage": med.dosage,
        "schedule": schedule_dict,
        "start_date": med.start_date,
        "end_date": med.end_date,
        "adherence_logs": logs_dict
    }

# ----------------- AUTH ROUTING -----------------
@app.post("/api/auth/register", response_model=UserResponse)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(User).filter((User.email == user_data.email) | (User.username == user_data.username)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
        
    hashed_pwd = get_password_hash(user_data.password)
    new_user = User(username=user_data.username, email=user_data.email, password_hash=hashed_pwd)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ----------------- PROFILE ROUTING -----------------
@app.get("/api/profile", response_model=ProfileResponse)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please complete health assessment.")
    return serialize_profile(profile)

@app.post("/api/profile", response_model=ProfileResponse)
def create_or_update_profile(profile_data: ProfileCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    history_str = json.dumps(profile_data.medical_history or {})
    
    if profile:
        profile.name = profile_data.name
        profile.age = profile_data.age
        profile.gender = profile_data.gender
        profile.occupation = profile_data.occupation
        profile.medical_history = history_str
    else:
        profile = Profile(
            user_id=current_user.id,
            name=profile_data.name,
            age=profile_data.age,
            gender=profile_data.gender,
            occupation=profile_data.occupation,
            medical_history=history_str
        )
        db.add(profile)
        
    db.commit()
    db.refresh(profile)
    return serialize_profile(profile)

# ----------------- COORDINATOR ROUTING (MAIN BOT) -----------------
@app.post("/api/coordinate", response_model=CoordinatorResponse)
def coordinate_request(
    request: CoordinatorRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Processes a user query by instantiating the Multi-Agent context and pipeline,
    runs Coordinator routing, and persists new health goals or scores generated by agents.
    """
    # 1. Create context from database history
    shared_context = load_shared_context(current_user.id, db)
    
    # 2. Add current message/symptoms to context
    shared_context["symptoms"]["raw_text"] = request.message
    if request.symptoms:
        shared_context["symptoms"].update(request.symptoms)
        
    # 3. Instantiate Coordinator and run pipeline
    coordinator = CoordinatorAgent()
    updated_context = coordinator.run_coordination(request.message, shared_context)
    
    # 4. Save any recommended goals generated by the Goal Planning Agent
    recommended_goals = updated_context.get("recommended_goals", [])
    for rg in recommended_goals:
        # Check if goal already exists to avoid duplicates
        existing = db.query(Goal).filter(
            Goal.user_id == current_user.id,
            Goal.title == rg.get("title")
        ).first()
        if not existing:
            new_goal = Goal(
                user_id=current_user.id,
                title=rg.get("title"),
                target_value=rg.get("target_value"),
                current_value=rg.get("current_value", "0"),
                period=rg.get("period", "daily"),
                status="pending"
            )
            db.add(new_goal)
            
    # 5. Save Health Score generated by the Progress Analytics Agent
    analytics = updated_context.get("analytics_dashboard", {})
    if analytics:
        today = datetime.date.today()
        # Update or insert today's score
        db_score = db.query(HealthScore).filter(HealthScore.user_id == current_user.id, HealthScore.score_date == today).first()
        
        recs_str = json.dumps(analytics.get("recommendations", []))
        risks_str = json.dumps(analytics.get("future_risks", []))
        
        if db_score:
            db_score.overall_score = analytics.get("overall_score", 100)
            db_score.report_score = analytics.get("report_score", 100)
            db_score.medication_score = analytics.get("medication_score", 100)
            db_score.lifestyle_score = analytics.get("lifestyle_score", 100)
            db_score.goal_score = analytics.get("goal_score", 100)
            db_score.recommendations = recs_str
            db_score.future_risks = risks_str
        else:
            db_score = HealthScore(
                user_id=current_user.id,
                score_date=today,
                overall_score=analytics.get("overall_score", 100),
                report_score=analytics.get("report_score", 100),
                medication_score=analytics.get("medication_score", 100),
                lifestyle_score=analytics.get("lifestyle_score", 100),
                goal_score=analytics.get("goal_score", 100),
                recommendations=recs_str,
                future_risks=risks_str
            )
            db.add(db_score)
            
    db.commit()
    
    # 6. Format response
    response_msg = updated_context.get("final_recommendation", "Plan compiled.")
    return {
        "response": response_msg,
        "shared_context": updated_context
    }

# ----------------- MEDICAL REPORTS ROUTING -----------------
@app.post("/api/reports/upload", response_model=MedicalReportResponse)
async def upload_report(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure directory exists
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Save file to disk
    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    safe_filename = f"{current_user.id}_{timestamp}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
        
    # Perform OCR
    extracted_text = perform_ocr(file_path)
    
    # Run the Medical Report Agent + Nutrition + Goals + Analytics pipeline to analyze this report
    shared_context = load_shared_context(current_user.id, db)
    shared_context["report_analysis"]["extracted_text"] = extracted_text
    
    # Trigger routing manually or let coordinator decide. We run the agents specifically for reports.
    from app.agents.report import MedicalReportAgent
    from app.agents.nutrition import NutritionAgent
    from app.agents.goal_planning import GoalPlanningAgent
    from app.agents.analytics import ProgressAnalyticsAgent
    
    shared_context = MedicalReportAgent().run(shared_context)
    shared_context = NutritionAgent().run(shared_context)
    shared_context = GoalPlanningAgent().run(shared_context)
    shared_context = ProgressAnalyticsAgent().run(shared_context)
    
    # Persist Report Object
    analysis_res_str = json.dumps(shared_context.get("report_analysis", {}))
    new_report = MedicalReport(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        extracted_text=extracted_text,
        analysis_result=analysis_res_str
    )
    db.add(new_report)
    
    # Persist Goals recommended by Report pipeline
    for rg in shared_context.get("recommended_goals", []):
        existing = db.query(Goal).filter(Goal.user_id == current_user.id, Goal.title == rg.get("title")).first()
        if not existing:
            new_goal = Goal(
                user_id=current_user.id,
                title=rg.get("title"),
                target_value=rg.get("target_value"),
                current_value=rg.get("current_value", "0"),
                period=rg.get("period", "daily"),
                status="pending"
            )
            db.add(new_goal)
            
    # Persist today's score
    analytics = shared_context.get("analytics_dashboard", {})
    if analytics:
        today = datetime.date.today()
        db_score = db.query(HealthScore).filter(HealthScore.user_id == current_user.id, HealthScore.score_date == today).first()
        recs_str = json.dumps(analytics.get("recommendations", []))
        risks_str = json.dumps(analytics.get("future_risks", []))
        
        if db_score:
            db_score.overall_score = analytics.get("overall_score", 100)
            db_score.report_score = analytics.get("report_score", 100)
            db_score.medication_score = analytics.get("medication_score", 100)
            db_score.lifestyle_score = analytics.get("lifestyle_score", 100)
            db_score.goal_score = analytics.get("goal_score", 100)
            db_score.recommendations = recs_str
            db_score.future_risks = risks_str
        else:
            db_score = HealthScore(
                user_id=current_user.id,
                score_date=today,
                overall_score=analytics.get("overall_score", 100),
                report_score=analytics.get("report_score", 100),
                medication_score=analytics.get("medication_score", 100),
                lifestyle_score=analytics.get("lifestyle_score", 100),
                goal_score=analytics.get("goal_score", 100),
                recommendations=recs_str,
                future_risks=risks_str
            )
            db.add(db_score)
            
    db.commit()
    db.refresh(new_report)
    return serialize_report(new_report)

@app.get("/api/reports", response_model=List[MedicalReportResponse])
def list_reports(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reports = db.query(MedicalReport).filter(MedicalReport.user_id == current_user.id).order_by(MedicalReport.created_at.desc()).all()
    return [serialize_report(r) for r in reports]

# ----------------- MEDICATIONS ROUTING -----------------
@app.get("/api/medications", response_model=List[MedicationResponse])
def list_medications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    meds = db.query(Medication).filter(Medication.user_id == current_user.id).all()
    return [serialize_medication(m) for m in meds]

@app.post("/api/medications", response_model=MedicationResponse)
def add_medication(med_data: MedicationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_med = Medication(
        user_id=current_user.id,
        name=med_data.name,
        dosage=med_data.dosage,
        schedule=json.dumps(med_data.schedule),
        start_date=med_data.start_date or datetime.date.today(),
        end_date=med_data.end_date,
        adherence_logs="{}"
    )
    db.add(new_med)
    db.commit()
    db.refresh(new_med)
    return serialize_medication(new_med)

@app.post("/api/medications/upload")
async def upload_prescription(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure upload directory exists
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Save file to disk
    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    safe_filename = f"prescription_{current_user.id}_{timestamp}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
        
    # Perform OCR
    extracted_text = perform_ocr(file_path)
    
    # Process text using LLM to extract medications
    prompt = f"""
    You are an expert medical transcriptionist and clinical pharmacist.
    Given the extracted text from a prescription document, parse and extract all active medications listed.
    For each medication, extract:
    1. The medication name (e.g. Metformin, Amlodipine).
    2. The dosage strength (e.g. 500mg, 5mg).
    3. The intake schedule slots (choose one or more from: 'morning', 'afternoon', 'evening', 'night').

    Extracted Prescription Text:
    ---
    {extracted_text}
    ---

    Output the extracted medications strictly in the following JSON format:
    {{
        "medications": [
            {{
                "name": "Medication Name",
                "dosage": "Dosage Strength",
                "schedule": ["morning", "night"]
            }}
        ]
    }}
    """
    
    added_meds = []
    try:
        response_text = generate_text(prompt, json_mode=True)
        result = json.loads(response_text)
        
        extracted_medications = result.get("medications", [])
        
        for m_data in extracted_medications:
            name = m_data.get("name")
            dosage = m_data.get("dosage")
            times = m_data.get("schedule", [])
            
            if name and dosage and times:
                added_meds.append({
                    "name": name,
                    "dosage": dosage,
                    "schedule": {"times": times}
                })
        
        # Failsafe local rule-based parser if LLM failed or returned 0 medications
        if not added_meds:
            logger.info("LLM extraction returned 0 medications. Applying robust local prescription parser...")
            import re
            
            # Try block-based parsing for structured lists
            blocks = []
            numbered_blocks = re.split(r'\n\s*\d+[\.\)]\s+', "\n" + extracted_text)
            if len(numbered_blocks) > 1:
                blocks = numbered_blocks[1:]
            else:
                bullet_blocks = re.split(r'\n\s*[\-\*\u2022]\s+', "\n" + extracted_text)
                if len(bullet_blocks) > 1:
                    blocks = bullet_blocks[1:]
                    
            if blocks:
                logger.info(f"Local parser: parsing {len(blocks)} structured list blocks...")
                for block in blocks:
                    clean_block = block.replace("**", "").replace("*", "")
                    lines = [l.strip() for l in clean_block.split('\n') if l.strip()]
                    if not lines:
                        continue
                    
                    first_line = lines[0].strip()
                    med_name = first_line
                    remainder = ""
                    if ":" in med_name:
                        parts = med_name.split(":", 1)
                        med_name = parts[0].strip()
                        remainder = parts[1].strip()
                        
                    if not med_name or len(med_name) > 60:
                        continue
                        
                    # Skip metadata blocks or labels that are not medications
                    excluded_names = ["date", "clinical notes", "advice", "patient information", "prescription details", "medication names", "interpretation", "limitations", "note on the document type"]
                    if med_name.lower() in excluded_names:
                        continue
                        
                    dosage = None
                    dosage_pattern = re.compile(
                        r'\b(\d+(?:\.\d+)?\s*(?:mg|mcg|ml|g|tablet|tablets|capsule|capsules|tab|tabs|cap|caps))\b',
                        re.IGNORECASE
                    )
                    
                    if remainder:
                        m = dosage_pattern.search(remainder)
                        if m:
                            dosage = m.group(1)
                            
                    frequency_context = remainder.lower()
                    
                    for line in lines[1:]:
                        if "dosage" in line.lower() or "dose" in line.lower():
                            m = dosage_pattern.search(line)
                            if m:
                                dosage = m.group(1)
                        elif not dosage:
                            m = dosage_pattern.search(line)
                            if m:
                                dosage = m.group(1)
                                
                        if any(k in line.lower() for k in ["frequency", "times", "schedule", "once", "twice", "thrice", "daily", "day", "tid", "bid", "qd"]):
                            frequency_context += " " + line.lower()
                            
                    if med_name:
                        final_dosage = dosage or "1 tablet"
                        times = []
                        if any(k in frequency_context for k in ["morning", "breakfast", "am"]):
                            times.append("morning")
                        if any(k in frequency_context for k in ["afternoon", "lunch", "noon"]):
                            times.append("afternoon")
                        if any(k in frequency_context for k in ["evening", "snack"]):
                            times.append("evening")
                        if any(k in frequency_context for k in ["night", "dinner", "bedtime", "pm"]):
                            times.append("night")
                            
                        if not times:
                            if any(k in frequency_context for k in ["three times", "tid", "t.i.d.", "1-1-1", "thrice"]):
                                times = ["morning", "afternoon", "night"]
                            elif any(k in frequency_context for k in ["twice", "bid", "b.i.d.", "1-0-1"]):
                                times = ["morning", "night"]
                            elif any(k in frequency_context for k in ["once", "qd", "q.d.", "od", "1-0-0"]):
                                times = ["morning"]
                            else:
                                times = ["morning", "night"]
                                
                        added_meds.append({
                            "name": med_name,
                            "dosage": final_dosage,
                            "schedule": {"times": times}
                        })
            
            # Fallback to line-by-line parsing if block parsing yielded nothing
            if not added_meds:
                logger.info("Local parser: block-based parsing returned 0. Falling back to line-by-line regex...")
                lines = extracted_text.split('\n')
                for i, line in enumerate(lines):
                    med_pattern = re.compile(
                        r'\b([A-Za-z]{3,25})\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|ml|g|tablet|tablets|capsule|capsules|tab|tabs|cap|caps))\b', 
                        re.IGNORECASE
                    )
                    matches = med_pattern.findall(line)
                    for m_name, m_dosage in matches:
                        name_key = m_name.strip().capitalize()
                        excluded_words = ["lobe", "size", "width", "height", "depth", "thickness", "diameter", "date", "id", "age", "year", "time", "report", "scan", "page"]
                        if name_key.lower() in excluded_words:
                            continue
                            
                        context = line.lower()
                        if i > 0:
                            context = lines[i-1].lower() + " " + context
                        if i < len(lines) - 1:
                            context = context + " " + lines[i+1].lower()
                        if i < len(lines) - 2:
                            context = context + " " + lines[i+2].lower()
                            
                        times = []
                        if any(k in context for k in ["morning", "breakfast", "am"]):
                            times.append("morning")
                        if any(k in context for k in ["afternoon", "lunch", "noon"]):
                            times.append("afternoon")
                        if any(k in context for k in ["evening", "snack"]):
                            times.append("evening")
                        if any(k in context for k in ["night", "dinner", "bedtime", "pm"]):
                            times.append("night")
                            
                        if not times:
                            if any(k in context for k in ["twice", "b.i.d.", "bid", "1-0-1"]):
                                times = ["morning", "night"]
                            elif any(k in context for k in ["thrice", "t.i.d.", "tid", "1-1-1"]):
                                times = ["morning", "afternoon", "night"]
                            elif any(k in context for k in ["once", "o.d.", "od", "1-0-0"]):
                                times = ["morning"]
                            else:
                                times = ["morning", "night"]
                                
                        added_meds.append({
                            "name": name_key,
                            "dosage": m_dosage.strip(),
                            "schedule": {"times": times}
                        })
    except Exception as e:
        logger.error(f"Error extracting prescription details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to parse prescription: {str(e)}")
        
    return {
        "success": True,
        "message": f"Successfully analyzed prescription and extracted {len(added_meds)} medications.",
        "extracted_medications": added_meds
    }

@app.post("/api/medications/bulk")
def add_medications_bulk(
    meds_data: List[MedicationCreate],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    added = []
    for m in meds_data:
        new_med = Medication(
            user_id=current_user.id,
            name=m.name,
            dosage=m.dosage,
            schedule=json.dumps(m.schedule),
            start_date=m.start_date or datetime.date.today(),
            end_date=m.end_date,
            adherence_logs="{}"
        )
        db.add(new_med)
        added.append(new_med)
    db.commit()
    return {"success": True, "count": len(added)}

@app.post("/api/medications/{id}/log", response_model=MedicationResponse)
def log_medication_adherence(
    id: int,
    log_data: MedicationLog,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    med = db.query(Medication).filter(Medication.id == id, Medication.user_id == current_user.id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
        
    try:
        logs = json.loads(med.adherence_logs) if med.adherence_logs else {}
    except Exception:
        logs = {}
        
    date_str = log_data.log_date.strftime("%Y-%m-%d")
    if date_str not in logs:
        logs[date_str] = {}
        
    logs[date_str][log_data.time_slot] = log_data.status
    med.adherence_logs = json.dumps(logs)
    
    # Recalculate adherence score using MedicationAgent & update HealthScore
    db.commit()
    
    # Trigger agents to refresh dashboard metrics
    shared_context = load_shared_context(current_user.id, db)
    shared_context = MedicationAgent().run(shared_context)
    shared_context = ProgressAnalyticsAgent().run(shared_context)
    
    analytics = shared_context.get("analytics_dashboard", {})
    if analytics:
        today = datetime.date.today()
        db_score = db.query(HealthScore).filter(HealthScore.user_id == current_user.id, HealthScore.score_date == today).first()
        if db_score:
            db_score.medication_score = analytics.get("medication_score", 100)
            db_score.overall_score = analytics.get("overall_score", 100)
            db.commit()
            
    db.refresh(med)
    return serialize_medication(med)

@app.delete("/api/medications/{id}")
def delete_medication(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    med = db.query(Medication).filter(Medication.id == id, Medication.user_id == current_user.id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    db.delete(med)
    db.commit()
    return {"detail": "Medication deleted successfully"}

# ----------------- LIFESTYLE ROUTING -----------------
@app.get("/api/lifestyle", response_model=List[LifestyleLogResponse])
def get_lifestyle_logs(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(LifestyleLog).filter(LifestyleLog.user_id == current_user.id)
    if start_date:
        query = query.filter(LifestyleLog.log_date >= start_date)
    if end_date:
        query = query.filter(LifestyleLog.log_date <= end_date)
    return query.order_by(LifestyleLog.log_date.desc()).all()

@app.get("/api/lifestyle/today", response_model=LifestyleLogResponse)
def get_lifestyle_today(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = datetime.date.today()
    log = db.query(LifestyleLog).filter(LifestyleLog.user_id == current_user.id, LifestyleLog.log_date == today).first()
    if not log:
        log = LifestyleLog(user_id=current_user.id, log_date=today, sleep_hours=0.0, water_ml=0, steps=0, active_minutes=0, exercise_type="None")
        db.add(log)
        db.commit()
        db.refresh(log)
    return log

@app.post("/api/lifestyle", response_model=LifestyleLogResponse)
def log_lifestyle(log_data: LifestyleLogCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log = db.query(LifestyleLog).filter(LifestyleLog.user_id == current_user.id, LifestyleLog.log_date == log_data.log_date).first()
    if log:
        log.sleep_hours = log_data.sleep_hours
        log.water_ml = log_data.water_ml
        log.steps = log_data.steps
        log.active_minutes = log_data.active_minutes
        log.exercise_type = log_data.exercise_type
    else:
        log = LifestyleLog(
            user_id=current_user.id,
            log_date=log_data.log_date,
            sleep_hours=log_data.sleep_hours,
            water_ml=log_data.water_ml,
            steps=log_data.steps,
            active_minutes=log_data.active_minutes,
            exercise_type=log_data.exercise_type
        )
        db.add(log)
        
    db.commit()
    
    # Trigger LifestyleAgent + ProgressAnalyticsAgent to re-evaluate health score
    shared_context = load_shared_context(current_user.id, db)
    shared_context = LifestyleAgent().run(shared_context)
    shared_context = ProgressAnalyticsAgent().run(shared_context)
    
    analytics = shared_context.get("analytics_dashboard", {})
    if analytics:
        today = datetime.date.today()
        db_score = db.query(HealthScore).filter(HealthScore.user_id == current_user.id, HealthScore.score_date == today).first()
        if db_score:
            db_score.lifestyle_score = analytics.get("lifestyle_score", 100)
            db_score.overall_score = analytics.get("overall_score", 100)
        else:
            db_score = HealthScore(
                user_id=current_user.id,
                score_date=today,
                overall_score=analytics.get("overall_score", 100),
                report_score=analytics.get("report_score", 100),
                medication_score=analytics.get("medication_score", 100),
                lifestyle_score=analytics.get("lifestyle_score", 100),
                goal_score=analytics.get("goal_score", 100),
                recommendations=json.dumps(analytics.get("recommendations", [])),
                future_risks=json.dumps(analytics.get("future_risks", []))
            )
            db.add(db_score)
        db.commit()
        
    db.refresh(log)
    return log

# ----------------- GOALS ROUTING -----------------
@app.get("/api/goals", response_model=List[GoalResponse])
def list_goals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Goal).filter(Goal.user_id == current_user.id).all()

@app.post("/api/goals", response_model=GoalResponse)
def create_goal(goal_data: GoalCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_goal = Goal(
        user_id=current_user.id,
        title=goal_data.title,
        target_value=goal_data.target_value,
        current_value=goal_data.current_value or "0",
        target_date=goal_data.target_date,
        period=goal_data.period,
        status="pending"
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return new_goal

@app.put("/api/goals/{id}", response_model=GoalResponse)
def update_goal(id: int, goal_data: GoalUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    if goal_data.current_value is not None:
        goal.current_value = goal_data.current_value
    if goal_data.status is not None:
        goal.status = goal_data.status
        
    db.commit()
    
    # Recalculate goal completions
    shared_context = load_shared_context(current_user.id, db)
    shared_context = ProgressAnalyticsAgent().run(shared_context)
    
    analytics = shared_context.get("analytics_dashboard", {})
    if analytics:
        today = datetime.date.today()
        db_score = db.query(HealthScore).filter(HealthScore.user_id == current_user.id, HealthScore.score_date == today).first()
        if db_score:
            db_score.goal_score = analytics.get("goal_score", 100)
            db_score.overall_score = analytics.get("overall_score", 100)
            db.commit()
            
    db.refresh(goal)
    return goal

# ----------------- ANALYTICS & SCORE DASHBOARD -----------------
@app.get("/api/analytics/dashboard")
def get_dashboard_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = datetime.date.today()
    
    # Ensure a score entry exists for today. If not, trigger a recalculation.
    db_score = db.query(HealthScore).filter(HealthScore.user_id == current_user.id, HealthScore.score_date == today).first()
    if not db_score:
        shared_context = load_shared_context(current_user.id, db)
        shared_context = ProgressAnalyticsAgent().run(shared_context)
        analytics = shared_context.get("analytics_dashboard", {})
        
        recs_str = json.dumps(analytics.get("recommendations", []))
        risks_str = json.dumps(analytics.get("future_risks", []))
        
        db_score = HealthScore(
            user_id=current_user.id,
            score_date=today,
            overall_score=analytics.get("overall_score", 100),
            report_score=analytics.get("report_score", 100),
            medication_score=analytics.get("medication_score", 100),
            lifestyle_score=analytics.get("lifestyle_score", 100),
            goal_score=analytics.get("goal_score", 100),
            recommendations=recs_str,
            future_risks=risks_str
        )
        db.add(db_score)
        db.commit()
        db.refresh(db_score)
        
    try:
        recs = json.loads(db_score.recommendations)
    except Exception:
        recs = []
        
    try:
        risks = json.loads(db_score.future_risks)
    except Exception:
        risks = []
        
    # Get active medications
    db_meds = db.query(Medication).filter(Medication.user_id == current_user.id).all()
    today_meds = []
    for m in db_meds:
        try:
            sched = json.loads(m.schedule)
            logs = json.loads(m.adherence_logs) if m.adherence_logs else {}
            date_str = today.strftime("%Y-%m-%d")
            today_logs = logs.get(date_str, {})
            
            today_meds.append({
                "id": m.id,
                "name": m.name,
                "dosage": m.dosage,
                "times": sched.get("times", []),
                "logged": today_logs
            })
        except Exception:
            pass

    # Get active goals
    db_goals = db.query(Goal).filter(Goal.user_id == current_user.id, Goal.status == "pending").all()
    active_goals = [{"id": g.id, "title": g.title, "period": g.period, "target": g.target_value, "current": g.current_value} for g in db_goals]
    
    # Get today's lifestyle log
    db_lifestyle = db.query(LifestyleLog).filter(LifestyleLog.user_id == current_user.id, LifestyleLog.log_date == today).first()
    lifestyle_data = {
        "sleep_hours": db_lifestyle.sleep_hours if db_lifestyle else 0.0,
        "water_ml": db_lifestyle.water_ml if db_lifestyle else 0,
        "steps": db_lifestyle.steps if db_lifestyle else 0,
        "active_minutes": db_lifestyle.active_minutes if db_lifestyle else 0,
        "exercise_type": db_lifestyle.exercise_type if db_lifestyle else "None"
    }
    
    # Check if there are any active reports
    latest_report = db.query(MedicalReport).filter(MedicalReport.user_id == current_user.id).order_by(MedicalReport.created_at.desc()).first()
    report_analysis_summary = {}
    if latest_report:
        try:
            report_analysis_summary = json.loads(latest_report.analysis_result)
        except Exception:
            pass
            
    # Compile Indian food nutrition highlights
    db_profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    nutrition_plan = {}
    if db_profile:
        # Load profile context and call nutrition agent to fetch highlights
        shared_context = load_shared_context(current_user.id, db)
        # Check if nutrition plan is loaded
        if not shared_context.get("nutrition_plan", {}).get("foods_to_include"):
            shared_context = NutritionAgent().run(shared_context)
        nutrition_plan = shared_context.get("nutrition_plan", {})

    return {
        "overall_score": db_score.overall_score,
        "sub_scores": {
            "reports": db_score.report_score,
            "medications": db_score.medication_score,
            "lifestyle": db_score.lifestyle_score,
            "goals": db_score.goal_score
        },
        "recommendations": recs,
        "future_risks": risks,
        "today_medications": today_meds,
        "active_goals": active_goals,
        "lifestyle": lifestyle_data,
        "latest_report": {
            "filename": latest_report.filename if latest_report else None,
            "date": latest_report.created_at.strftime("%Y-%m-%d") if latest_report else None,
            "summary": report_analysis_summary.get("summary", "No reports uploaded.") if latest_report else "No reports uploaded."
        },
        "nutrition_plan": nutrition_plan
    }

@app.get("/api/analytics/timeline")
def get_analytics_timeline(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns historical scores and metrics for Recharts visualizations.
    """
    scores = db.query(HealthScore).filter(HealthScore.user_id == current_user.id).order_by(HealthScore.score_date.asc()).all()
    lifestyle_logs = db.query(LifestyleLog).filter(LifestyleLog.user_id == current_user.id).order_by(LifestyleLog.log_date.asc()).all()
    
    timeline_data = []
    
    # Map score records by date for easy lookup
    score_by_date = {s.score_date.strftime("%Y-%m-%d"): s for s in scores}
    lifestyle_by_date = {l.log_date.strftime("%Y-%m-%d"): l for l in lifestyle_logs}
    
    # Unify dates
    all_dates = sorted(list(set(list(score_by_date.keys()) + list(lifestyle_by_date.keys()))))
    
    # Get last 30 log points
    for d_str in all_dates[-30:]:
        score = score_by_date.get(d_str)
        life = lifestyle_by_date.get(d_str)
        
        timeline_data.append({
            "date": d_str,
            "overall_score": score.overall_score if score else 100,
            "lifestyle_score": score.lifestyle_score if score else 100,
            "medication_score": score.medication_score if score else 100,
            "reports_score": score.report_score if score else 100,
            "sleep_hours": life.sleep_hours if life else 0.0,
            "water_ml": life.water_ml if life else 0,
            "steps": life.steps if life else 0
        })
        
    return timeline_data

# ----------------- VOICE ENDPOINT -----------------
@app.post("/api/voice/process")
def process_voice_transcript(
    request: CoordinatorRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Receives voice text transcript from frontend speech recognition,
    processes via Multi-Agent pipeline, and returns text and voice friendly advice.
    """
    # 1. Run coordinator agent logic
    shared_context = load_shared_context(current_user.id, db)
    shared_context["symptoms"]["raw_text"] = request.message
    
    coordinator = CoordinatorAgent()
    updated_context = coordinator.run_coordination(request.message, shared_context)
    
    # Save recommended goals/scores
    # (Same persistence logic as standard /api/coordinate to keep databases in sync)
    recommended_goals = updated_context.get("recommended_goals", [])
    for rg in recommended_goals:
        existing = db.query(Goal).filter(Goal.user_id == current_user.id, Goal.title == rg.get("title")).first()
        if not existing:
            db.add(Goal(user_id=current_user.id, title=rg.get("title"), target_value=rg.get("target_value"), period=rg.get("period", "daily"), status="pending"))
            
    analytics = updated_context.get("analytics_dashboard", {})
    if analytics:
        today = datetime.date.today()
        db_score = db.query(HealthScore).filter(HealthScore.user_id == current_user.id, HealthScore.score_date == today).first()
        recs_str = json.dumps(analytics.get("recommendations", []))
        risks_str = json.dumps(analytics.get("future_risks", []))
        if db_score:
            db_score.overall_score = analytics.get("overall_score", 100)
            db_score.recommendations = recs_str
            db_score.future_risks = risks_str
        else:
            db.add(HealthScore(
                user_id=current_user.id,
                score_date=today,
                overall_score=analytics.get("overall_score", 100),
                report_score=analytics.get("report_score", 100),
                medication_score=analytics.get("medication_score", 100),
                lifestyle_score=analytics.get("lifestyle_score", 100),
                goal_score=analytics.get("goal_score", 100),
                recommendations=recs_str,
                future_risks=risks_str
            ))
    db.commit()
    
    # 2. Synthesize short spoken summary (conversational, brief, max 2-3 sentences)
    spoken_prompt = f"""
    You are the voice assistant for HealthPilot AI.
    Review the coordination recommendations below:
    ---
    {updated_context.get("final_recommendation", "")}
    ---
    Provide a highly conversational, short, and friendly spoken response (2-3 sentences max) that summarizes the key recommendation for the user. Do not use markdown format or bullet points; this will be spoken aloud to the user.
    """
    try:
        spoken_response = generate_text(spoken_prompt, model_name="llama-3.3-70b-versatile")
    except Exception:
        spoken_response = "I have updated your health assessment recommendations on the screen. Please review them."
        
    return {
        "text_response": updated_context.get("final_recommendation", ""),
        "voice_response": spoken_response
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=PORT, reload=True)
