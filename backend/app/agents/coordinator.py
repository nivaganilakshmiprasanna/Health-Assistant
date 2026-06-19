import json
import logging
from typing import List, Dict, Any

from backend.app.utils.groq_client import generate_text
from backend.app.agents.assessment import HealthAssessmentAgent
from backend.app.agents.report import MedicalReportAgent
from backend.app.agents.medication import MedicationAgent
from backend.app.agents.nutrition import NutritionAgent
from backend.app.agents.lifestyle import LifestyleAgent
from backend.app.agents.emergency import EmergencyAgent
from backend.app.agents.goal_planning import GoalPlanningAgent
from backend.app.agents.analytics import ProgressAnalyticsAgent

logger = logging.getLogger(__name__)

class CoordinatorAgent:
    def __init__(self):
        self.name = "Coordinator Agent"
        
        # Instantiate all sub-agents
        self.agents = {
            "emergency": EmergencyAgent(),
            "health_assessment": HealthAssessmentAgent(),
            "medical_report": MedicalReportAgent(),
            "medication": MedicationAgent(),
            "nutrition": NutritionAgent(),
            "lifestyle": LifestyleAgent(),
            "goal_planning": GoalPlanningAgent(),
            "progress_analytics": ProgressAnalyticsAgent()
        }

    def decide_agents(self, user_message: str, shared_context: dict) -> List[str]:
        """
        Calls Gemini to dynamically determine which sub-agents are relevant
        for the given user message and state.
        """
        prompt = f"""
        You are the Coordinator Agent (Brain of the Health Assistant Intellegent multi-agent system).
        Analyze the user's message and the current context. Decide which specialized health sub-agents should be executed.
        
        User Message: "{user_message}"
        
        Available Sub-Agents:
        - "emergency": Run this if the user describes acute symptoms (e.g. chest pain, breathing difficulty, stroke signs, severe pain).
        - "health_assessment": Run this if the user lists new symptoms, requests a health risk profile, or asks for general medical diagnostics.
        - "medical_report": Run this if a medical lab report text is provided in the context, or the user asks to analyze/compare lab tests.
        - "medication": Run this if the user asks about prescriptions, dosage, adherence, scheduling, or drug interactions.
        - "nutrition": Run this if the user asks for diet advice, meal plans, recipes, or if their lab report indicates dietary needs (like low iron or high sugar).
        - "lifestyle": Run this if the user mentions sleep, hydration, exercise, water logs, or physical habits.
        - "goal_planning": Run this if new goals need to be formulated or if the user asks for daily wellness targets.
        - "progress_analytics": Run this if they want to see health trends, dynamic health score calculations, or future risk predictions.
        
        Context Indicators:
        - Report text present? {"Yes" if shared_context.get("report_analysis", {}).get("extracted_text") else "No"}
        - Medications present? {"Yes" if shared_context.get("medications") else "No"}
        
        Provide your decision strictly in the following JSON format:
        {{
            "selected_agents": ["list", "of", "agent_keys"]
        }}
        
        Rules:
        1. Always run "emergency" first if any physical symptoms are mentioned to ensure user safety.
        2. Always run "progress_analytics" at the end if any clinical profile changes occur to recalculate the health score.
        3. Only select agents that are directly relevant to the user request.
        """
        
        try:
            response_text = generate_text(prompt, json_mode=True)
            result = json.loads(response_text)
            selected = result.get("selected_agents", [])
            
            # Ensure safety order: 'emergency' is always first, 'progress_analytics' is always last
            ordered_selection = []
            if "emergency" in selected:
                ordered_selection.append("emergency")
            
            for agent in selected:
                if agent not in ordered_selection and agent != "progress_analytics":
                    ordered_selection.append(agent)
            
            if "progress_analytics" in selected or len(ordered_selection) > 0:
                # If we ran other agents, also run progress_analytics to update the scores
                if "progress_analytics" not in ordered_selection:
                    ordered_selection.append("progress_analytics")
                    
            logger.info(f"Coordinator decided to run agents: {ordered_selection}")
            return ordered_selection
        except Exception as e:
            logger.error(f"Error deciding agents: {str(e)}")
            # Safe default fallback execution path
            return ["emergency", "health_assessment", "progress_analytics"]

    def compile_final_response(self, user_message: str, shared_context: dict) -> str:
        """
        Synthesizes the output of all executed sub-agents into a single, cohesive,
        clinical and wellness coordinator recommendation report.
        """
        prompt = f"""
        You are the Coordinator Agent. Synthesize the findings of all executed sub-agents into a single, cohesive, empathetic, and professional health report for the user.
        
        User's Request: "{user_message}"
        
        Sub-Agent Context:
        {json.dumps(shared_context, indent=2)}
        
        Draft a comprehensive, highly organized recommendation report.
        
        CRITICAL FORMATTING RULES:
        1. NO NARRATIVE PARAGRAPHS: Do not write paragraphs or long blocks of text. Every recommendation, explanation, or summary point under a section MUST be formatted as a concise bullet point (starting with "- ").
        2. NO HTML TAGS: Use standard Markdown ONLY. Do NOT use HTML tags (e.g. no `<font>`, no `<div>`, no `<span>`, etc.).
        3. POINT-BY-POINT STRUCTURE: Break down all details into clean, short, direct bullet points. Keep each point to 1-2 concise sentences max so it is easy for a patient to read and understand.
        4. WARNINGS & ALERTS: If there is a warning or alert (such as emergency risk or high concerns), format it as a markdown blockquote starting with `> ` and bold prefix. For example: `> **WARNING: Medium Risk Level** - [reasons/instructions]`. Never use colors or HTML formatting.
        
        Ensure you include the following sections if data is present in the context:
        1. **Emergency & Safety Alert** (Include this first if risk_level is High or Medium. Format using a blockquote: e.g., `> **WARNING: Medium Risk Level** - [reasons/instructions]`)
        2. **Clinical Health Assessment** (Symptom analysis & risk summary in brief bullet points)
        3. **Medical Report Insights** (Abnormal values simplified in bullet points)
        4. **Medication & Adherence Plan** (Schedule alerts & food interactions in bullet points)
        5. **Personalized Nutrition Blueprint** (Indian meal plans & foods to include/avoid in bullet points)
        6. **Lifestyle & Habits Coaching** (Sleep, water, exercise feedback in bullet points)
        7. **Recommended Health Action Plan (Goals)** (Daily/weekly/monthly goals lists)
        8. **Health Score & Next Steps** (Present the health score & why it was given in bullet points)
        
        Tone: Empathetic, expert, clinical but extremely simple and readable.
        Disclaimer: Include a standard medical disclaimer at the bottom stating that this is an AI assistant and does not replace professional medical advice.
        """
        
        try:
            return generate_text(prompt, model_name="llama-3.3-70b-versatile")
        except Exception as e:
            logger.error(f"Error compiling final response: {str(e)}")
            
            # Fallback report compilation when Gemini API fails
            fallback_report = []
            fallback_report.append("# Health Assistant Intellegent - Coordinated Health Report")
            fallback_report.append("\n> [!NOTE]\n> The Google Gemini API is currently offline or the API key is invalid. Displaying a localized rules-based coordinated assessment synthesized from active healthcare agents.")
            
            # 1. Emergency & Safety Alert
            emerg = shared_context.get("emergency_status", {})
            if emerg.get("is_emergency") or emerg.get("risk_level") in ["High", "Medium"]:
                fallback_report.append("\n## 🚨 Emergency & Safety Alert")
                fallback_report.append(f"**Emergency Risk Classification:** **{emerg.get('risk_level')}**")
                if emerg.get("reason"):
                    fallback_report.append(f"\n**Clinical Assessment:** {emerg.get('reason')}")
                if emerg.get("instructions"):
                    fallback_report.append(f"\n**Immediate Directions:** {emerg.get('instructions')}")
            
            # 2. Clinical Health Assessment
            assess = shared_context.get("health_assessment", {})
            if assess.get("summary"):
                fallback_report.append("\n## 🩺 Clinical Health Assessment")
                fallback_report.append(assess.get("summary"))
                concerns = assess.get("concerns", [])
                if concerns:
                    fallback_report.append("\n**Primary Health Concerns Identified:**")
                    for c in concerns:
                        fallback_report.append(f"- {c}")
                recs = assess.get("recommendations", [])
                if recs:
                    fallback_report.append("\n**Recommended Preventive Care:**")
                    for r in recs:
                        fallback_report.append(f"- {r}")
                
            # 3. Medical Report Insights
            report = shared_context.get("report_analysis", {})
            if report.get("summary") or report.get("abnormalities"):
                fallback_report.append("\n## 📋 Medical Report Insights")
                if report.get("summary"):
                    fallback_report.append(report.get("summary"))
                abns = report.get("abnormalities", [])
                if abns:
                    fallback_report.append("\n**Lab Parameter Abnormalities:**")
                    for ab in abns:
                        param = ab.get('parameter')
                        val = ab.get('value')
                        ref = ab.get('reference_range')
                        status = ab.get('status')
                        fallback_report.append(f"- **{param}**: {val} (Reference Range: {ref}) - *{status}*")
                insights = report.get("insights", [])
                if insights:
                    fallback_report.append("\n**Lab Recommendations:**")
                    for ins in insights:
                        fallback_report.append(f"- {ins}")
            
            # 4. Medication & Adherence Plan
            meds = shared_context.get("medications", [])
            if meds:
                fallback_report.append("\n## 💊 Medication & Adherence Plan")
                for m in meds:
                    schedule_slots = m.get('schedule', {}).get('times', [])
                    fallback_report.append(f"- **{m.get('name')}** ({m.get('dosage')}) - Scheduled Slots: {', '.join(schedule_slots)}")
                    
            # 5. Personalized Nutrition Blueprint
            nutr = shared_context.get("nutrition_plan", {})
            if nutr.get("diet_type"):
                fallback_report.append("\n## 🥗 Personalized Nutrition Blueprint")
                fallback_report.append(f"**Diet Classification:** {nutr.get('diet_type')}")
                meals = nutr.get("meals", {})
                if meals:
                    fallback_report.append("\n**Recommended Indian Meal Schedule:**")
                    for meal_name, desc in meals.items():
                        pretty_meal = meal_name.replace("_", " ").title()
                        fallback_report.append(f"- **{pretty_meal}**: {desc}")
                inc = nutr.get("foods_to_include", [])
                if inc:
                    fallback_report.append(f"\n**Include in Diet:** {', '.join(inc)}")
                avd = nutr.get("foods_to_avoid", [])
                if avd:
                    fallback_report.append(f"\n**Foods to Avoid/Limit:** {', '.join(avd)}")
                recs = nutr.get("recommendations", [])
                if recs:
                    fallback_report.append("\n**General Dietitian Advice:**")
                    for r in recs:
                        fallback_report.append(f"- {r}")
                    
            # 6. Lifestyle & Habits Coaching
            life = shared_context.get("lifestyle", {})
            if life.get("steps") or life.get("sleep_hours") or life.get("water_ml"):
                fallback_report.append("\n## 🏃 Lifestyle & Habits Coaching")
                fallback_report.append(f"- **Sleep Log:** {life.get('sleep_hours')} hours")
                fallback_report.append(f"- **Hydration Log:** {life.get('water_ml')} ml")
                fallback_report.append(f"- **Physical Activity Log:** {life.get('steps')} steps ({life.get('active_minutes')} mins active, type: {life.get('exercise_type')})")
                
            # 7. Goals Action Plan
            goals = shared_context.get("goals", [])
            if goals:
                fallback_report.append("\n## 🎯 Recommended Health Action Plan (Goals)")
                for g in goals:
                    fallback_report.append(f"- **{g.get('title')}** ({g.get('period')}) - Current Progress: {g.get('current_value')} / Target: {g.get('target_value')} - *{g.get('status')}*")
                    
            # 8. Score & Next Steps
            score = shared_context.get("health_score", {})
            analytics = shared_context.get("analytics_dashboard", {})
            fallback_report.append("\n## 📈 Health Score & Next Steps")
            fallback_report.append(f"- **Overall Calculated Health Score:** **{analytics.get('overall_score') or score.get('overall', 100)} / 100**")
            fallback_report.append(f"  - Clinical Reports Score: {analytics.get('report_score') or score.get('reports', 100)} / 100")
            fallback_report.append(f"  - Medication Adherence Score: {analytics.get('medication_score') or score.get('meds', 100)} / 100")
            fallback_report.append(f"  - Lifestyle Habits Score: {analytics.get('lifestyle_score') or score.get('lifestyle', 100)} / 100")
            fallback_report.append(f"  - Goals Completion Score: {analytics.get('goal_score') or score.get('goals', 100)} / 100")
            
            risks = analytics.get("future_risks", [])
            if risks:
                fallback_report.append("\n**Predicted Future Health Risks:**")
                for r in risks:
                    fallback_report.append(f"- **{r.get('risk_name')}** ({r.get('risk_level')} Probability): Factors - {r.get('factors')}. Preventive Action - {r.get('preventive_action')}")
            
            fallback_report.append("\n---\n**Disclaimer:** Health Assistant Intellegent is an advanced agentic healthcare assistant designed for informational and coordinative support. It does not provide official medical diagnoses, treatment instructions, or prescriptions. Always consult a qualified medical professional for health issues or clinical decisions.")
            
            return "\n".join(fallback_report)

    def run_coordination(self, user_message: str, shared_context: dict) -> dict:
        """
        Runs the coordination pipeline:
        1. Parse request and decide which sub-agents to run.
        2. Execute the sub-agents sequentially, updating the shared context.
        3. Compile a final human-readable recommendation.
        """
        # Step 1: Decide agents
        selected_agents = self.decide_agents(user_message, shared_context)
        
        # Step 2: Execute sub-agents
        for agent_key in selected_agents:
            if agent_key in self.agents:
                agent = self.agents[agent_key]
                try:
                    shared_context = agent.run(shared_context)
                    
                    # Safety bypass: If emergency agent flags a high-risk emergency,
                    # stop execution of other agents immediately to respond as fast as possible.
                    if agent_key == "emergency":
                        emergency_status = shared_context.get("emergency_status", {})
                        if emergency_status.get("is_emergency") and emergency_status.get("risk_level") == "High":
                            logger.warning("HIGH RISK EMERGENCY DETECTED. Bypassing subsequent agents.")
                            break
                            
                except Exception as e:
                    logger.error(f"Failed to run agent {agent_key}: {str(e)}")
        
        # Step 3: Compile final coordinated response
        final_report = self.compile_final_response(user_message, shared_context)
        shared_context["final_recommendation"] = final_report
        
        return shared_context
