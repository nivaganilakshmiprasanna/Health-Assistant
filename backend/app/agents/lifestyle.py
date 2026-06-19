import json
import logging
from app.utils.groq_client import generate_text

logger = logging.getLogger(__name__)

class LifestyleAgent:
    def __init__(self):
        self.name = "Lifestyle Agent"

    def run(self, shared_context: dict) -> dict:
        """
        Calculates sleep, hydration, and activity scores from lifestyle logs
        and utilizes Gemini to provide qualitative feedback.
        """
        logger.info(f"Running {self.name}...")
        
        lifestyle = shared_context.get("lifestyle", {})
        sleep_hours = float(lifestyle.get("sleep_hours", 0.0))
        water_ml = int(lifestyle.get("water_ml", 0))
        steps = int(lifestyle.get("steps", 0))
        active_minutes = int(lifestyle.get("active_minutes", 0))
        exercise_type = lifestyle.get("exercise_type", "None")
        
        # 1. Deterministic calculations
        # Targets: Sleep = 8 hours, Water = 3000ml, Steps = 10000, Active Minutes = 30
        sleep_score = int(min(100.0, (sleep_hours / 8.0) * 100.0)) if sleep_hours > 0 else 0
        
        # Penalize oversleeping slightly (e.g. > 10 hours)
        if sleep_hours > 10:
            sleep_score = max(70, 100 - int((sleep_hours - 10) * 10))
            
        hydration_score = int(min(100.0, (water_ml / 3000.0) * 100.0)) if water_ml > 0 else 0
        
        # Activity: 50% steps, 50% active minutes
        steps_part = min(50.0, (steps / 10000.0) * 50.0) if steps > 0 else 0.0
        active_part = min(50.0, (active_minutes / 30.0) * 50.0) if active_minutes > 0 else 0.0
        activity_score = int(steps_part + active_part)
        
        # 2. Get AI feedback based on scores
        prompt = f"""
        You are the Lifestyle Agent, a wellness coach.
        Analyze the following user health habits and scores:
        - Sleep: {sleep_hours} hours (Score: {sleep_score}/100)
        - Hydration: {water_ml} ml (Score: {hydration_score}/100)
        - Activity: {steps} steps, {active_minutes} mins of {exercise_type} (Score: {activity_score}/100)
        
        Generate concise feedback on how they are doing and list three personalized wellness tips.
        
        Provide your assessment strictly in the following JSON format:
        {{
            "feedback": "A summary of their lifestyle habits, celebrating successes and highlighting gaps.",
            "wellness_tips": ["Tip 1", "Tip 2", "Tip 3"]
        }}
        """
        
        try:
            response_text = generate_text(prompt, json_mode=True)
            result = json.loads(response_text)
            
            # Update shared context
            shared_context["lifestyle_analysis"] = {
                "sleep_score": sleep_score,
                "hydration_score": hydration_score,
                "activity_score": activity_score,
                "feedback": result.get("feedback", ""),
                "wellness_tips": result.get("wellness_tips", [])
            }
            logger.info("Lifestyle analysis completed successfully.")
        except Exception as e:
            logger.error(f"Error in LifestyleAgent: {str(e)}")
            shared_context["lifestyle_analysis"] = {
                "sleep_score": sleep_score,
                "hydration_score": hydration_score,
                "activity_score": activity_score,
                "feedback": "Lifestyle log analyzed. Continue tracking sleep, water, and exercise daily.",
                "wellness_tips": ["Aim for 7-8 hours of sleep.", "Drink 3 liters of water.", "Walk 8,000+ steps daily."]
            }
            
        return shared_context
