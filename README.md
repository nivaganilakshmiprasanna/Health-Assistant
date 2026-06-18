# 🏥 HealthPilot — Multi-Agent AI Health Assistant

<div align="center">

![HealthPilot Banner](https://img.shields.io/badge/HealthPilot-Multi--Agent%20AI-6C63FF?style=for-the-badge&logo=heart&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-AI-F55036?style=for-the-badge&logo=groq&logoColor=white)

**An intelligent, multi-agent healthcare platform powered by AI — capable of health assessments, medical report analysis, medication tracking, nutrition planning, lifestyle monitoring, and emergency detection.**

</div>

---

## ✨ Features

| Module | Description |
|---|---|
| 🧠 **Coordinator Agent** | Dynamically routes queries to the right specialist sub-agents using LLM reasoning |
| 🚨 **Emergency Detection** | Identifies critical symptoms (chest pain, stroke, etc.) and provides immediate guidance |
| 🩺 **Health Assessment** | Symptom analysis, risk profiling, and personalized diagnostics |
| 📄 **Medical Report Analysis** | OCR + AI analysis of uploaded PDF/image lab reports |
| 💊 **Medication Manager** | Prescription tracking, adherence monitoring, dosage scheduling & drug interaction checks |
| 🥗 **Nutrition Planning** | AI-generated meal plans, dietary recommendations, calorie/macro guidance |
| 🏃 **Lifestyle Tracking** | Sleep, hydration, exercise, and daily habit logging with insights |
| 🎯 **Goal Planning** | Personal health goal setting, progress milestones, and adaptive planning |
| 📊 **Progress Analytics** | Charts, trends, and data-driven health summaries |

---

## 🏗️ Architecture

```
multi-health-ai/
├── backend/                    # FastAPI Python Backend
│   ├── app/
│   │   ├── agents/             # Specialist AI sub-agents
│   │   │   ├── coordinator.py  # Master orchestrator (LLM-based routing)
│   │   │   ├── assessment.py   # Health assessment agent
│   │   │   ├── emergency.py    # Emergency detection agent
│   │   │   ├── medication.py   # Medication management agent
│   │   │   ├── nutrition.py    # Nutrition planning agent
│   │   │   ├── lifestyle.py    # Lifestyle tracking agent
│   │   │   ├── goal_planning.py# Goal planning agent
│   │   │   ├── report.py       # Medical report analysis agent
│   │   │   └── analytics.py    # Progress analytics agent
│   │   ├── main.py             # FastAPI routes & application entry point
│   │   ├── database.py         # SQLAlchemy models & DB setup
│   │   ├── schemas.py          # Pydantic request/response schemas
│   │   ├── security.py         # JWT auth, password hashing
│   │   ├── config.py           # Environment config
│   │   └── utils/              # OCR, Groq client helpers
│   ├── requirements.txt
│   └── .env
│
└── frontend/                   # React + Vite Frontend
    ├── src/
    │   ├── pages/              # Full-page views
    │   │   ├── Dashboard.jsx
    │   │   ├── HealthAssessment.jsx
    │   │   ├── MedicalReports.jsx
    │   │   ├── Medications.jsx
    │   │   ├── NutritionPlans.jsx
    │   │   ├── LifestyleTracking.jsx
    │   │   ├── ProgressAnalytics.jsx
    │   │   ├── EmergencyAlerts.jsx
    │   │   ├── Login.jsx
    │   │   └── Register.jsx
    │   ├── components/         # Reusable UI components
    │   ├── services/           # Axios API service layer
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

### 🤖 Multi-Agent Flow

```
User Query
    │
    ▼
Coordinator Agent  ──(LLM routing)──►  Emergency Agent
                                   ►  Health Assessment Agent
                                   ►  Medical Report Agent
                                   ►  Medication Agent
                                   ►  Nutrition Agent
                                   ►  Lifestyle Agent
                                   ►  Goal Planning Agent
                                   ►  Progress Analytics Agent
    │
    ▼
Aggregated AI Response → User
```

---

## 🛠️ Tech Stack

### Backend
- **[FastAPI](https://fastapi.tiangolo.com/)** — High-performance Python REST API framework
- **SQLAlchemy** — ORM for SQLite database
- **PyJWT + bcrypt** — Secure JWT authentication
- **Groq AI (LLaMA / Gemma)** — Ultra-fast LLM inference for all agents
- **Google Generative AI (Gemini)** — Supplementary AI capabilities
- **pdfplumber + pytesseract + Pillow** — Medical report OCR processing
- **python-dotenv** — Environment configuration

### Frontend
- **[React 18](https://react.dev/)** — UI framework
- **[Vite](https://vitejs.dev/)** — Lightning-fast build tool
- **[MUI (Material UI v5)](https://mui.com/)** — Component library
- **[Recharts](https://recharts.org/)** — Health data visualizations
- **[React Router v6](https://reactrouter.com/)** — Client-side routing
- **Axios** — HTTP client for API calls

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Tesseract OCR** installed on your system ([download](https://github.com/tesseract-ocr/tesseract))
- A **Groq API Key** — [get one free here](https://console.groq.com/)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/multi-health-ai.git
cd multi-health-ai
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `.env` file inside `backend/` (copy the template below):

```env
DATABASE_URL=sqlite:///./healthpilot.db
SECRET_KEY=your_super_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here   # optional
PORT=8000
```

#### Run the Backend Server

```bash
# From the project root
uvicorn backend.app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`  
Interactive docs at `http://localhost:8000/docs`

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

---

### 4. (Optional) Seed the Database

```bash
# From the project root, with venv active
python backend/seed_db.py
```

---

## 🔑 API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT token |
| `GET`  | `/api/profile` | Get current user profile |
| `PUT`  | `/api/profile` | Update user profile |
| `POST` | `/api/coordinator/chat` | Send message to multi-agent coordinator |
| `POST` | `/api/reports/upload` | Upload medical report (PDF/image) |
| `GET`  | `/api/reports` | List all uploaded reports |
| `GET`  | `/api/medications` | List medications |
| `POST` | `/api/medications` | Add a new medication |
| `POST` | `/api/medications/{id}/log` | Log medication intake |
| `GET`  | `/api/lifestyle` | Get lifestyle logs |
| `POST` | `/api/lifestyle` | Add a lifestyle log entry |
| `GET`  | `/api/goals` | List health goals |
| `POST` | `/api/goals` | Create a new goal |
| `GET`  | `/api/health-score` | Get current health score |
| `GET`  | `/api/analytics` | Get progress analytics data |

> 🔒 All endpoints (except `/api/auth/*`) require a `Bearer` JWT token in the `Authorization` header.

---

## 🌐 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | SQLAlchemy connection string |
| `SECRET_KEY` | ✅ | JWT signing secret (use a long random string) |
| `ALGORITHM` | ✅ | JWT algorithm (default: `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ✅ | Token expiry in minutes |
| `GROQ_API_KEY` | ✅ | Groq cloud API key for LLM inference |
| `GEMINI_API_KEY` | ❌ | Google Gemini API key (optional) |
| `PORT` | ❌ | Server port (default: `8000`) |

---

## 📸 Pages & Modules

- **Dashboard** — Overview of health score, recent activity, quick stats
- **Health Assessment** — AI-powered symptom checker and risk profiling
- **Medical Reports** — Upload, view, and analyze lab reports via OCR + AI
- **Medications** — Manage prescriptions, set reminders, log doses
- **Nutrition Plans** — Get personalized AI meal plans and nutritional advice
- **Lifestyle Tracking** — Log sleep, hydration, and exercise data
- **Progress Analytics** — Interactive charts and trend analysis
- **Emergency Alerts** — Immediate guidance for critical health situations

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## ⚠️ Disclaimer

> **HealthPilot is an AI-assisted informational tool and is NOT a substitute for professional medical advice, diagnosis, or treatment.** Always consult a qualified healthcare provider for medical decisions. In a medical emergency, contact your local emergency services immediately.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ for better healthcare access through AI

</div>

