import json
import logging
from backend.app.utils.groq_client import generate_text

logger = logging.getLogger(__name__)

class ProgressAnalyticsAgent:
    def __init__(self):
        self.name = "Progress Analytics Agent"

    def run(self, shared_context: dict) -> dict:
        """
        Processes historical trends, lifestyle logs, medications, and clinical values
        to generate an overall Health Score (0-100) and future health risk predictions.
        """
        logger.info(f"Running {self.name}...")
        
        assessment = shared_context.get("health_assessment", {})
        med_analysis = shared_context.get("medication_analysis", {})
        lifestyle_analysis = shared_context.get("lifestyle_analysis", {})
        goals = shared_context.get("goals", [])
        
        # 1. Deterministic calculation of sub-scores
        risk_score = assessment.get("risk_score", 0)
        report_score = max(0, 100 - risk_score)  # Higher risk = lower report score
        
        medication_score = med_analysis.get("adherence_score", 100)
        
        sleep_score = lifestyle_analysis.get("sleep_score", 100)
        hydration_score = lifestyle_analysis.get("hydration_score", 100)
        activity_score = lifestyle_analysis.get("activity_score", 100)
        lifestyle_score = int((sleep_score + hydration_score + activity_score) / 3)
        
        # Calculate goal completion score
        if goals:
            completed_goals = sum(1 for g in goals if g.get("status") == "completed")
            goal_score = int((completed_goals / len(goals)) * 100.0)
        else:
            goal_score = 100  # Default if no goals set yet
            
        # Overall Score weights:
        # Clinical Risk/Reports: 30%
        # Medication Adherence: 25%
        # Lifestyle Habits: 25%
        # Goal Completion: 20%
        overall_score = int(
            (report_score * 0.30) +
            (medication_score * 0.25) +
            (lifestyle_score * 0.25) +
            (goal_score * 0.20)
        )
        
        # Clamp overall score between 0 and 100
        overall_score = max(0, min(100, overall_score))
        
        # 2. Call Gemini for Future Risk Predictions & consolidated advice
        prompt = f"""
        You are the Progress Analytics Agent, an expert clinical data analyst and epidemiologist.
        Analyze the following consolidated health markers to predict future health risks and generate clinical recommendations.
        
        Scores & Status:
        - Overall Calculated Health Score: {overall_score}/100
        - Clinical Report Score: {report_score}/100
        - Medication Adherence Score: {medication_score}/100
        - Lifestyle Habit Score: {lifestyle_score}/100
        - Goal Completion Score: {goal_score}/100
        
        Assessments & Habits Details:
        - Health assessment summary: {assessment.get('summary', 'N/A')}
        - Medication adherence summary: {med_analysis.get('missed_doses_summary', 'N/A')}
        - Lifestyle feedback: {lifestyle_analysis.get('feedback', 'N/A')}
        
        Predict future health risk profiles (e.g. Risk of Vitamin D deficiency, Risk of Diabetes, Lifestyle burnout risk) based on their age, gender, report abnormalities, and habit scores. Give each a risk probability level ('High', 'Medium', 'Low') and key factors.
        
        Provide your analytical assessment strictly in the following JSON format:
        {{
            "future_risks": [
                {{
                    "risk_name": "Name of the risk (e.g., Type 2 Diabetes Risk)",
                    "risk_level": "High" or "Medium" or "Low",
                    "factors": "Specific lifestyle/clinical factors contributing to this risk.",
                    "preventive_action": "Actionable step to prevent this."
                }}
            ],
            "recommendations": ["Consolidated recommendations addressing clinical trends and habits."]
        }}
        """
        
        try:
            response_text = generate_text(prompt, json_mode=True)
            result = json.loads(response_text)
            
            # Update shared context
            shared_context["analytics_dashboard"] = {
                "overall_score": overall_score,
                "report_score": report_score,
                "medication_score": medication_score,
                "lifestyle_score": lifestyle_score,
                "goal_score": goal_score,
                "future_risks": result.get("future_risks", []),
                "recommendations": result.get("recommendations", [])
            }
            logger.info("Progress analytics assessment completed successfully.")
        except Exception as e:
            logger.error(f"Error in ProgressAnalyticsAgent: {str(e)}")
            shared_context["analytics_dashboard"] = {
                "overall_score": overall_score,
                "report_score": report_score,
                "medication_score": medication_score,
                "lifestyle_score": lifestyle_score,
                "goal_score": goal_score,
                "future_risks": [
                    {"risk_name": "Lifestyle Risk", "risk_level": "Medium", "factors": "Self-reported inputs.", "preventive_action": "Maintain healthy sleep and active minutes."}
                ],
                "recommendations": ["Keep logging metrics to build trend reports."]
            }
            
        return shared_context
