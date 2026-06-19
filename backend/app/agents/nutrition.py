import json
import logging
from app.utils.groq_client import generate_text

logger = logging.getLogger(__name__)

class NutritionAgent:
    def __init__(self):
        self.name = "Nutrition Agent"

    def run(self, shared_context: dict) -> dict:
        """
        Creates custom diet plans based on health assessment,
        medical reports, and personal profile.
        """
        logger.info(f"Running {self.name}...")
        
        user_profile = shared_context.get("user_profile", {})
        assessment = shared_context.get("health_assessment", {})
        report = shared_context.get("report_analysis", {})
        abnormalities = report.get("abnormalities", [])
        symptoms = shared_context.get("symptoms", {})
        
        # Compile inputs for dietitian assessment
        prompt = f"""
        You are the Nutrition Agent, an expert clinical dietitian specializing in Indian nutrition.
        Develop a personalized diet plan and meal schedule for a user with the following profile, clinical symptoms, and lab report abnormalities.
        
        User Profile:
        - Age: {user_profile.get('age', 'N/A')}
        - Gender: {user_profile.get('gender', 'N/A')}
        - Occupation: {user_profile.get('occupation', 'N/A')}
        - Medical History: {user_profile.get('medical_history', 'None reported')}
        
        Clinical Status:
        - Health Summary: {assessment.get('summary', 'N/A')}
        - Current Symptoms: {symptoms.get('raw_text', 'None reported')}
        
        Report Abnormalities:
        {json.dumps(abnormalities, indent=2) if abnormalities else "None identified."}
        
        Design a diet that is healthy, tailored to their clinical needs (e.g. low-sodium for high blood pressure, iron-rich for anemia), and focuses on common Indian foods (dal, chapati, sabzi, curd, poha, idli, ragi, beetroot, jaggery, spinach, etc.).
        
        Provide the nutrition plan strictly in the following JSON format:
        {{
            "diet_type": "Name/type of the diet (e.g., Iron-rich Vegetarian Diet, Low-Glycemic Indian Diet)",
            "meals": {{
                "early_morning": "Recommended early morning drink/bite (e.g., soaked almonds, warm lemon water)",
                "breakfast": "Healthy Indian breakfast choice",
                "lunch": "Balanced lunch options (roti, dal, sabji, salad, etc.)",
                "evening_snack": "Nutritious snack recommendation",
                "dinner": "Light, easily digestible dinner suggestion"
            }},
            "foods_to_include": ["List of highly beneficial local Indian foods to consume"],
            "foods_to_avoid": ["List of foods to avoid based on symptoms or lab results"],
            "recommendations": ["General healthy eating habits, hydration tips, or cooking style suggestions"]
        }}
        """
        
        try:
            response_text = generate_text(prompt, json_mode=True)
            result = json.loads(response_text)
            
            # Check if the result is empty or failed due to API rate limit
            if not result.get("meals") or len(result.get("meals", {})) == 0:
                logger.info("LLM returned empty meals. Applying local rule-based fallback dietitian...")
                
                # Detect medical report findings to tailor diet
                has_liver_issue = False
                for ab in abnormalities:
                    param = ab.get("parameter", "").lower()
                    if "liver" in param:
                        has_liver_issue = True
                        break
                        
                # Failsafe: check raw report text directly for liver keywords
                if not has_liver_issue:
                    raw_text = report.get("extracted_text", "").lower()
                    if "rt liver lobe" in raw_text or "lt liver lobe" in raw_text or "liver lobe" in raw_text or "liver" in raw_text:
                        has_liver_issue = True
                        
                if has_liver_issue:
                    result = {
                        "diet_type": "Liver-Friendly Balanced Indian Diet",
                        "meals": {
                            "early_morning": "Warm water with lemon or fenugreek water",
                            "breakfast": "Oatmeal with almonds or vegetable ragi idli",
                            "lunch": "Missi roti or brown rice, boiled dal, sautéed green vegetables (spinach/gourd), curd",
                            "evening_snack": "Green tea with roasted chana",
                            "dinner": "Moong dal khichdi or vegetable soup with paneer salad"
                        },
                        "foods_to_include": ["Garlic", "Grapefruit", "Beetroot", "Green tea", "Turmeric", "Leafy greens"],
                        "foods_to_avoid": ["Alcohol", "Sugary drinks", "Deep-fried foods", "Highly processed flour (maida)", "Excess red meat"],
                        "recommendations": [
                            "Include antioxidant-rich foods to support liver detox pathways.",
                            "Minimize saturated fat and trans-fat intake.",
                            "Maintain moderate daily activity to prevent fatty accumulation."
                        ]
                    }
                else:
                    # Default healthy Indian diet fallback
                    result = {
                        "diet_type": "Healthy Balanced Indian Diet",
                        "meals": {
                            "early_morning": "Soaked almonds and warm water",
                            "breakfast": "Poha, vegetable upma, or oats cheela",
                            "lunch": "Rotis, mixed vegetable curry, bowl of yellow dal, buttermilk",
                            "evening_snack": "Fresh seasonal fruit or roasted makhana",
                            "dinner": "Lauki sabji, plain dal, or light khichdi"
                        },
                        "foods_to_include": ["Whole grains (wheat, ragi)", "Lentils and legumes", "Seasonal vegetables", "Buttermilk"],
                        "foods_to_avoid": ["Refined oil", "Excess salt and sugar", "Carbonated beverages"],
                        "recommendations": [
                            "Consume high-fiber foods for gut motility.",
                            "Drink 2-3 liters of water daily.",
                            "Avoid skipping meals."
                        ]
                    }
            
            # Update shared context
            shared_context["nutrition_plan"] = {
                "diet_type": result.get("diet_type", "Balanced Indian Diet"),
                "meals": result.get("meals", {}),
                "foods_to_include": result.get("foods_to_include", []),
                "foods_to_avoid": result.get("foods_to_avoid", []),
                "recommendations": result.get("recommendations", [])
            }
            logger.info("Nutrition plan generation completed successfully.")
        except Exception as e:
            logger.error(f"Error in NutritionAgent: {str(e)}")
            shared_context["nutrition_plan"] = {
                "diet_type": "Balanced Diet",
                "meals": {
                    "early_morning": "Warm water",
                    "breakfast": "Oatmeal or Idli",
                    "lunch": "Roti, dal, green vegetables",
                    "evening_snack": "Fresh fruit",
                    "dinner": "Khichdi or vegetable soup"
                },
                "foods_to_include": ["Green leafy vegetables", "Whole grains", "Lentils"],
                "foods_to_avoid": ["Processed sugar", "Excessive deep-fried foods"],
                "recommendations": ["Eat meals at regular intervals.", "Stay well hydrated."]
            }
            
        return shared_context
