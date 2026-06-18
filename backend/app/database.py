import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from backend.app.config import DATABASE_URL

# Create database engine (check_same_thread=False is needed for SQLite multi-thread FastAPI)
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Users Table
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    profile = relationship("Profile", uselist=False, back_populates="user", cascade="all, delete-orphan")
    reports = relationship("MedicalReport", back_populates="user", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="user", cascade="all, delete-orphan")
    lifestyle_logs = relationship("LifestyleLog", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    health_scores = relationship("HealthScore", back_populates="user", cascade="all, delete-orphan")

# Profiles Table
class Profile(Base):
    __tablename__ = "profiles"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    occupation = Column(String(100), nullable=True)
    medical_history = Column(Text, default="{}")  # Stored as JSON string
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="profile")

# Medical Reports Table
class MedicalReport(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(255), nullable=False)
    extracted_text = Column(Text, nullable=True)
    analysis_result = Column(Text, default="{}")  # Stored as JSON string
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="reports")

# Medications Table
class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    dosage = Column(String(100), nullable=False)
    schedule = Column(Text, default="{}")  # Stored as JSON string (e.g. times, days)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    adherence_logs = Column(Text, default="{}")  # Stored as JSON string (e.g., {"2026-06-11": {"morning": True, "night": False}})

    user = relationship("User", back_populates="medications")

# Lifestyle Logs Table
class LifestyleLog(Base):
    __tablename__ = "lifestyle_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    log_date = Column(Date, nullable=False, index=True)
    sleep_hours = Column(Float, default=0.0)
    water_ml = Column(Integer, default=0)
    steps = Column(Integer, default=0)
    active_minutes = Column(Integer, default=0)
    exercise_type = Column(String(100), nullable=True)

    user = relationship("User", back_populates="lifestyle_logs")

# Goals Table
class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    target_value = Column(String(100), nullable=True)
    current_value = Column(String(100), nullable=True)
    target_date = Column(Date, nullable=True)
    period = Column(String(20), nullable=False)  # 'daily', 'weekly', 'monthly'
    status = Column(String(20), default="pending")  # 'pending', 'completed'

    user = relationship("User", back_populates="goals")

# Health Scores Table
class HealthScore(Base):
    __tablename__ = "health_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score_date = Column(Date, nullable=False, index=True)
    overall_score = Column(Integer, nullable=False)
    report_score = Column(Integer, nullable=False)
    medication_score = Column(Integer, nullable=False)
    lifestyle_score = Column(Integer, nullable=False)
    goal_score = Column(Integer, nullable=False)
    recommendations = Column(Text, default="[]")  # Stored as JSON string list
    future_risks = Column(Text, default="[]")  # Stored as JSON string list

    user = relationship("User", back_populates="health_scores")

# Helper function to create all tables
def create_tables():
    Base.metadata.create_all(bind=engine)
