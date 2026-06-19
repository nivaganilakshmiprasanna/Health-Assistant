import json
import logging
from app.utils.groq_client import generate_text

logger = logging.getLogger(__name__)

class GoalPlanningAgent:
    def __init__(self):
        self.name = "Goal Planning Agent"

    def run(self, shared_context: dict) -> dict:
        """
        Formulates personalized health goals (daily, weekly, monthly)
        based on the compiled clinical context.
        """
        logger.info(f"Running {self.name}...")
        
        user_profile = shared_context.get("user_profile", {})
        assessment = shared_context.get("health_assessment", {})
        report = shared_context.get("report_analysis", {})
        medications = shared_context.get("medications", [])
        lifestyle_analysis = shared_context.get("lifestyle_analysis", {})
        symptoms = shared_context.get("symptoms", {})
        
        prompt = f"""
        You are the Goal Planning Agent, an expert preventive care health coach.
        Formulate actionable, realistic health and wellness goals for a user with the following health context:
        
        User Profile:
        - Medical History: {user_profile.get('medical_history', 'None reported')}
        - Current Symptoms: {symptoms.get('raw_text', 'None reported')}
        
        Assessment & Medical Report Insights:
        - Risk Summary: {assessment.get('summary', 'N/A')}
        - Lab Abnormalities: {json.dumps(report.get('abnormalities', []), indent=2)}
        
        Habits & Medications:
        - Active Medications: {len(medications)} active prescriptions.
        - Sleep Score: {lifestyle_analysis.get('sleep_score', 0)}/100
        - Hydration Score: {lifestyle_analysis.get('hydration_score', 0)}/100
        - Activity Score: {lifestyle_analysis.get('activity_score', 0)}/100
        
        Formulate a set of 3-5 specific, measurable goals categorized by period ('daily', 'weekly', 'monthly'). Examples include 'Drink 3L water', 'Complete 30 mins cardiovascular activity', 'Take iron supplements at 8 AM', 'Test HbA1c levels'.
        
        Provide the goal list strictly in the following JSON format:
        {{
            "goals": [
                {{
                    "title": "Clear action title (e.g. Walk 8000 Steps)",
                    "period": "daily" or "weekly" or "monthly",
                    "target_value": "The target quantity/metric (e.g. 8000 steps, 3 times, once)",
                    "current_value": "The starting point or current status (e.g. 0 steps, 0 times, pending)"
                }}
            ]
        }}
        """
        
        try:
            response_text = generate_text(prompt, json_mode=True)
            result = json.loads(response_text)
            
            # Save recommended goals to shared context
            shared_context["recommended_goals"] = result.get("goals", [])
            logger.info("Goal planning completed successfully.")
        except Exception as e:
            logger.error(f"Error in GoalPlanningAgent: {str(e)}")
            shared_context["recommended_goals"] = [
                {"title": "Walk 6000 Steps", "period": "daily", "target_value": "6000 steps", "current_value": "0 steps"},
                {"title": "Drink 2.5L Water", "period": "daily", "target_value": "2500 ml", "current_value": "0 ml"},
                {"title": "Sleep by 11:00 PM", "period": "daily", "target_value": "11:00 PM", "current_value": "Pending"}
            ]
            
        return shared_context
