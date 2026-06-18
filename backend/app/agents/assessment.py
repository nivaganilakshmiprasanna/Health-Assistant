import json
import logging
from backend.app.utils.groq_client import generate_text

logger = logging.getLogger(__name__)

class HealthAssessmentAgent:
    def __init__(self):
        self.name = "Health Assessment Agent"

    def run(self, shared_context: dict) -> dict:
        """
        Reads user profile and symptoms from shared_context,
        analyzes clinical risk, and updates shared_context.
        """
        logger.info(f"Running {self.name}...")
        
        user_profile = shared_context.get("user_profile", {})
        symptoms = shared_context.get("symptoms", {})
        
        # If no profile or symptoms are present, return unchanged
        if not user_profile and not symptoms:
            logger.warning("No profile or symptoms found in context. Skipping assessment.")
            return shared_context
            
        prompt = f"""
        You are the Health Assessment Agent, a specialist clinical risk profiler.
        Analyze the following user profile and symptoms to assess health risks and construct a medical summary.
        
        User Profile:
        - Name: {user_profile.get('name', 'N/A')}
        - Age: {user_profile.get('age', 'N/A')}
        - Gender: {user_profile.get('gender', 'N/A')}
        - Occupation: {user_profile.get('occupation', 'N/A')}
        - Medical History: {user_profile.get('medical_history', 'None reported')}
        
        Current Symptoms:
        - Details: {symptoms.get('raw_text', 'None reported')}
        - Parsed Symptoms: {symptoms.get('parsed_symptoms', [])}
        - Duration: {symptoms.get('duration', 'N/A')}
        - Severity: {symptoms.get('severity', 'N/A')}
        
        Provide your assessment strictly in the following JSON format:
        {{
            "summary": "A concise clinical summary of the patient's current health status.",
            "risk_score": <an integer between 0 and 100 representing health risk; 0 is perfectly healthy, 100 is critical risk>,
            "concerns": ["list of key health/symptom concerns"],
            "recommendations": ["list of preventive care actions based on their age, gender, and symptoms"]
        }}
        """
        
        try:
            response_text = generate_text(prompt, json_mode=True)
            result = json.loads(response_text)
            
            # Update shared context
            shared_context["health_assessment"] = {
                "summary": result.get("summary", ""),
                "risk_score": result.get("risk_score", 0),
                "concerns": result.get("concerns", []),
                "recommendations": result.get("recommendations", [])
            }
            logger.info("Health assessment completed successfully.")
        except Exception as e:
            logger.error(f"Error in HealthAssessmentAgent: {str(e)}")
            # Fallback values
            shared_context["health_assessment"] = {
                "summary": "Unable to complete health assessment due to an error.",
                "risk_score": 0,
                "concerns": ["Assessment failed"],
                "recommendations": ["Please contact support or try again later."]
            }
            
        return shared_context
