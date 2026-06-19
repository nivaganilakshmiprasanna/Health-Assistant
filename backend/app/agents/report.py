import json
import logging
from app.utils.groq_client import generate_text

logger = logging.getLogger(__name__)

class MedicalReportAgent:
    def __init__(self):
        self.name = "Medical Report Agent"

    def run(self, shared_context: dict) -> dict:
        """
        Processes medical report texts, detects abnormal values,
        and compares with previous report trends.
        """
        logger.info(f"Running {self.name}...")
        
        report_data = shared_context.get("report_analysis", {})
        extracted_text = report_data.get("extracted_text", "")
        previous_reports = shared_context.get("previous_reports", [])
        
        if not extracted_text:
            logger.warning("No extracted text found in context for medical report. Skipping report agent.")
            return shared_context
            
        prompt = f"""
        You are the Medical Report Agent, an expert clinical pathologist, radiologist, and medical report analyzer.
        Analyze the following extracted text or visual/anatomical description from a medical document.
        
        Extracted Medical Document details:
        ---
        {extracted_text}
        ---
        
        Historical Reports for Trend Analysis:
        {json.dumps(previous_reports, indent=2) if previous_reports else "None available."}
        
        Provide your analysis strictly in the following JSON format.
        
        If this is a raw medical scan (like an ultrasound, X-ray, MRI, or ECG) and does not contain structured laboratory test parameters, use the fields to describe the scan educationally. Detail the visualized organs/structures (e.g., liver lobes, aorta), describe any visible labels/annotations, and explain what a radiologist typically looks for:
        {{
            "summary": "A high-level summary of the medical report or raw scan in simple terms.",
            "abnormalities": [
                {{
                    "parameter": "Name of parameter or visualized structure (e.g. Hemoglobin, Right Liver Lobe)",
                    "value": "Patient's value or scan finding (e.g. 10.5, Labeled on Scan)",
                    "reference_range": "Normal range or healthy state description (e.g. 12.0 - 15.0, Normal size, shape, and echogenicity)",
                    "status": "Indicator or info tag (e.g. Low, High, Info)",
                    "explanation": "What this finding or visualized structure means for the user's health, or what radiologists check it for in plain language."
                }}
            ],
            "trends": "Description of improvements, regressions, or visual correlations compared to historical records.",
            "insights": ["Bullet points of key clinical takeaways, and a friendly request to upload the written text report (impression/findings page) from the radiologist for complete clinical analysis."],
            "tracked_metrics": {{
                "ParameterName": <float value of the parameter, if numeric. Extract up to 5 key parameters for charting if available>
            }}
        }}
        """
        
        try:
            response_text = generate_text(prompt, json_mode=True)
            result = json.loads(response_text)
            
            # Check if the result is empty or failed (indicating a rate limit or API failure)
            if not result.get("summary") or result.get("summary") == "":
                logger.info("LLM returned empty summary. Applying clinical rule-based local parser...")
                
                # Simple rule-based parser for raw scans (Ultrasound / MRI / X-ray)
                if "ultrasound" in extracted_text.lower() or "scan" in extracted_text.lower() or "lobe" in extracted_text.lower():
                    # We extract anatomical labels from the text
                    detected_labels = []
                    if "rt liver lobe" in extracted_text.lower() or "right liver" in extracted_text.lower():
                        detected_labels.append("Right Liver Lobe")
                    if "lt liver lobe" in extracted_text.lower() or "left liver" in extracted_text.lower():
                        detected_labels.append("Left Liver Lobe")
                    if "aorta" in extracted_text.lower():
                        detected_labels.append("Abdominal Aorta")
                    if "gallbladder" in extracted_text.lower():
                        detected_labels.append("Gallbladder")
                    if "kidney" in extracted_text.lower():
                        detected_labels.append("Kidneys")
                        
                    if not detected_labels:
                        detected_labels = ["Visualized Structures"]

                    abnormalities = []
                    for label in detected_labels:
                        explanation = ""
                        ref_desc = ""
                        if "Liver" in label:
                            ref_desc = "Homogeneous texture, normal liver size and margins"
                            explanation = "Radiologists check this area to evaluate liver size, fatty tissue accumulation (steatosis), and scan for any cysts or nodules."
                        elif "Aorta" in label:
                            ref_desc = "Normal caliber, no dilation or aneurysm"
                            explanation = "Radiologists check the abdominal aorta to measure its diameter and rule out aortic dilation or aneurysmal changes."
                        else:
                            ref_desc = "Normal anatomical appearance"
                            explanation = "Anatomical structure visualized on raw ultrasound scan. Radiologists inspect shape, margins, and echogenicity."
                            
                        abnormalities.append({
                            "parameter": label,
                            "value": "Visualized / Labeled on Scan",
                            "reference_range": ref_desc,
                            "status": "Info",
                            "explanation": explanation
                        })
                    
                    result = {
                        "summary": f"Raw ultrasound scan showing {' and '.join(detected_labels) if detected_labels else 'anatomical structures'}. Visual description and annotations parsed locally.",
                        "abnormalities": abnormalities,
                        "trends": "No previous baseline scan reports available for visual trend comparison.",
                        "insights": [
                            "The uploaded file is a raw ultrasound capture. Radiologists evaluate visual texture, dimensions, and blood flow dynamically.",
                            "For a complete diagnostic finding, please upload the written radiology report page from your doctor which contains the written 'Findings' and 'Impression'."
                        ],
                        "tracked_metrics": {}
                    }
                else:
                    # Fallback for general laboratory/blood reports
                    result = {
                        "summary": "Laboratory medical report text extracted. API rate limits/errors prevented LLM parsing.",
                        "abnormalities": [
                            {
                                "parameter": "Report Analysis Status",
                                "value": "Offline / Rate-limited",
                                "reference_range": "Online",
                                "status": "Info",
                                "explanation": "The clinical report text was extracted successfully via OCR but the AI service is currently rate-limited. Please try again in a moment."
                            }
                        ],
                        "trends": "Unable to compute trends.",
                        "insights": [
                            "Lab values were transcribed. Please consult the 'Raw Transcribed Text' section below to view the exact values.",
                            "Discuss these results directly with your healthcare provider for diagnostic confirmation."
                        ],
                        "tracked_metrics": {}
                    }
            
            # Update report analysis section in shared context
            shared_context["report_analysis"] = {
                "extracted_text": extracted_text,
                "summary": result.get("summary", ""),
                "abnormalities": result.get("abnormalities", []),
                "trends": result.get("trends", ""),
                "insights": result.get("insights", []),
                "tracked_metrics": result.get("tracked_metrics", {})
            }
            logger.info("Medical report analysis completed successfully.")
        except Exception as e:
            logger.error(f"Error in MedicalReportAgent: {str(e)}")
            shared_context["report_analysis"] = {
                "extracted_text": extracted_text,
                "summary": "Unable to complete report analysis due to an error.",
                "abnormalities": [],
                "trends": "Analysis failed",
                "insights": ["Please re-upload or try again."],
                "tracked_metrics": {}
            }
            
        return shared_context
