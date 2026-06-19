import json
import logging
from app.utils.groq_client import generate_text

logger = logging.getLogger(__name__)

class MedicationAgent:
    def __init__(self):
        self.name = "Medication Agent"

    def run(self, shared_context: dict) -> dict:
        """
        Processes active medications and logs, checks for interactions,
        calculates adherence rate, and updates shared_context.
        """
        logger.info(f"Running {self.name}...")
        
        medications = shared_context.get("medications", [])
        
        if not medications:
            logger.info("No medications found in context. Setting default medication metrics.")
            shared_context["medication_analysis"] = {
                "adherence_score": 100,
                "missed_doses_summary": "No medications scheduled.",
                "schedule_details": "No medications.",
                "drug_warnings": [],
                "recommendations": []
            }
            return shared_context
            
        # Compile medication details for Gemini analysis
        prompt = f"""
        You are the Medication Agent, an expert clinical pharmacist.
        Analyze the following user medication details and adherence history. Compute an adherence percentage, identify missed doses, suggest schedule optimizations, and check for potential drug-drug or food-drug interactions.
        
        Medications:
        {json.dumps(medications, indent=2)}
        
        Provide your pharmaceutical assessment strictly in the following JSON format:
        {{
            "adherence_score": <an integer between 0 and 100 representing calculated adherence percentage based on logs>,
            "missed_doses_summary": "Brief summary of any missed doses, patterns, or warnings.",
            "schedule_details": "Summary of optimized daily intake schedule (morning, afternoon, evening, night).",
            "drug_warnings": ["List of potential interactions, side-effect alerts, or food-intake warnings (e.g. Avoid taking calcium with thyroid medicine)"],
            "recommendations": ["Actionable tips to improve adherence, refill warnings, or scheduling advice."]
        }}
        """
        
        try:
            response_text = generate_text(prompt, json_mode=True)
            result = json.loads(response_text)
            
            # Update shared context
            shared_context["medication_analysis"] = {
                "adherence_score": result.get("adherence_score", 100),
                "missed_doses_summary": result.get("missed_doses_summary", ""),
                "schedule_details": result.get("schedule_details", ""),
                "drug_warnings": result.get("drug_warnings", []),
                "recommendations": result.get("recommendations", [])
            }
            logger.info("Medication analysis completed successfully.")
        except Exception as e:
            logger.error(f"Error in MedicationAgent: {str(e)}")
            shared_context["medication_analysis"] = {
                "adherence_score": 100,
                "missed_doses_summary": "Unable to calculate adherence.",
                "schedule_details": "No adjustments made.",
                "drug_warnings": ["Warning analysis failed"],
                "recommendations": ["Please discuss your medication schedule with your doctor."]
            }
            
        return shared_context
