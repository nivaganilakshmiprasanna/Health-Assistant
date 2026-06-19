import json
import logging
from app.utils.groq_client import generate_text

logger = logging.getLogger(__name__)

class EmergencyAgent:
    def __init__(self):
        self.name = "Emergency Agent"

    def run(self, shared_context: dict) -> dict:
        """
        Inspects symptoms for high-risk clinical indicators and classifies
        emergency risk (Low, Medium, High) with immediate alerts.
        """
        logger.info(f"Running {self.name}...")
        
        symptoms = shared_context.get("symptoms", {})
        raw_text = symptoms.get("raw_text", "")
        
        if not raw_text:
            logger.info("No current symptoms reported. Defaulting to Low Risk.")
            shared_context["emergency_status"] = {
                "is_emergency": False,
                "risk_level": "Low",
                "reason": "No active symptoms reported.",
                "immediate_instructions": "",
                "alerts": []
            }
            return shared_context
            
        prompt = f"""
        You are the Emergency Agent, an expert clinical triage nurse.
        Analyze the following symptom description to check for life-threatening emergency situations.
        Examples of emergencies include: chest pain, pressure in chest, difficulty breathing, shortness of breath, sudden numbness or weakness in face/arm/leg, sudden difficulty speaking or understanding, severe headache with no known cause, loss of consciousness, poisoning, or severe bleeding.
        
        User Symptoms:
        "{raw_text}"
        
        Perform a clinical triage. Classify the situation as:
        - "Low" (Normal/Non-urgent symptoms like mild headache, sore throat, running nose)
        - "Medium" (Needs attention but not immediately life-threatening, e.g. moderate fever for 3 days, sprained ankle, minor burn)
        - "High" (Life-threatening emergency. Immediate hospitalization or ambulance required)
        
        Provide your triage assessment strictly in the following JSON format:
        {{
            "is_emergency": <true if risk_level is High, false otherwise>,
            "risk_level": "Low" or "Medium" or "High",
            "reason": "Clear explanation of why this risk level was assigned based on symptoms.",
            "immediate_instructions": "Clear, direct, and actionable steps to take immediately (e.g. 'Sit down and rest, chew a standard aspirin, and call an ambulance immediately'). Leave empty if Low risk.",
            "alerts": ["List of warning flags or red flag symptoms to watch out for that would elevate their condition."]
        }}
        """
        
        try:
            response_text = generate_text(prompt, json_mode=True)
            result = json.loads(response_text)
            
            # Update shared context
            shared_context["emergency_status"] = {
                "is_emergency": result.get("is_emergency", False),
                "risk_level": result.get("risk_level", "Low"),
                "reason": result.get("reason", ""),
                "immediate_instructions": result.get("immediate_instructions", ""),
                "alerts": result.get("alerts", [])
            }
            logger.info(f"Emergency triage complete. Risk level: {result.get('risk_level', 'Low')}")
        except Exception as e:
            logger.error(f"Error in EmergencyAgent: {str(e)}")
            shared_context["emergency_status"] = {
                "is_emergency": False,
                "risk_level": "Low",
                "reason": "Unable to perform triage assessment.",
                "immediate_instructions": "",
                "alerts": ["If you are experiencing severe chest pain or breathing difficulty, seek emergency care immediately."]
            }
            
        return shared_context
