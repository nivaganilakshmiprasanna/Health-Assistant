import json
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Dict, Any, Optional
from datetime import datetime, date

# Auth Schemas
class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

# Profile Schemas
class ProfileCreate(BaseModel):
    name: str
    age: int
    gender: str
    occupation: Optional[str] = None
    medical_history: Optional[Dict[str, Any]] = None  # Expected dictionary structure

class ProfileResponse(BaseModel):
    user_id: int
    name: str
    age: int
    gender: str
    occupation: Optional[str] = None
    medical_history: Dict[str, Any]
    created_at: datetime

    @field_validator('medical_history', mode='before')
    @classmethod
    def parse_medical_history(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return {}
        return v

    class Config:
        from_attributes = True

# Medication Schemas
class MedicationCreate(BaseModel):
    name: str
    dosage: str
    schedule: Dict[str, Any]  # e.g., {"times": ["08:00", "20:00"], "frequency": "daily"}
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class MedicationLog(BaseModel):
    log_date: date
    time_slot: str  # e.g., "morning", "night", "08:00"
    status: bool  # True for taken, False for missed

class MedicationResponse(BaseModel):
    id: int
    user_id: int
    name: str
    dosage: str
    schedule: Dict[str, Any]
    start_date: date
    end_date: Optional[date]
    adherence_logs: Dict[str, Any]

    @field_validator('schedule', 'adherence_logs', mode='before')
    @classmethod
    def parse_json_fields(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return {}
        return v

    class Config:
        from_attributes = True

# Lifestyle Schemas
class LifestyleLogCreate(BaseModel):
    log_date: date
    sleep_hours: float = 0.0
    water_ml: int = 0
    steps: int = 0
    active_minutes: int = 0
    exercise_type: Optional[str] = None

class LifestyleLogResponse(BaseModel):
    id: int
    user_id: int
    log_date: date
    sleep_hours: float
    water_ml: int
    steps: int
    active_minutes: int
    exercise_type: Optional[str]

    class Config:
        from_attributes = True

# Goal Schemas
class GoalCreate(BaseModel):
    title: str
    target_value: Optional[str] = None
    current_value: Optional[str] = None
    target_date: Optional[date] = None
    period: str  # 'daily', 'weekly', 'monthly'

class GoalUpdate(BaseModel):
    current_value: Optional[str] = None
    status: Optional[str] = None  # 'pending', 'completed'

class GoalResponse(BaseModel):
    id: int
    user_id: int
    title: str
    target_value: Optional[str]
    current_value: Optional[str]
    target_date: Optional[date]
    period: str
    status: str

    class Config:
        from_attributes = True

# Medical Report Schemas
class MedicalReportResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    file_path: str
    extracted_text: Optional[str]
    analysis_result: Dict[str, Any]
    created_at: datetime

    @field_validator('analysis_result', mode='before')
    @classmethod
    def parse_analysis_result(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return {}
        return v

    class Config:
        from_attributes = True

# Health Score Schemas
class HealthScoreResponse(BaseModel):
    id: int
    user_id: int
    score_date: date
    overall_score: int
    report_score: int
    medication_score: int
    lifestyle_score: int
    goal_score: int
    recommendations: List[str]
    future_risks: List[Any]

    @field_validator('recommendations', 'future_risks', mode='before')
    @classmethod
    def parse_list_fields(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v

    class Config:
        from_attributes = True

# Coordinator Schemas
class CoordinatorRequest(BaseModel):
    message: str
    symptoms: Optional[Dict[str, Any]] = None  # Optional structured symptoms if filled from form

class CoordinatorResponse(BaseModel):
    response: str
    shared_context: Dict[str, Any]
