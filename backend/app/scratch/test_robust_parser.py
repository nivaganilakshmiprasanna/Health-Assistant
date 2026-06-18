import re

ocr_text = """
This is a handwritten medical note or prescription with some printed sections. The document appears to be a medical bill or visit summary from a healthcare provider, likely in India, given the mention of "Gita Nursing Home" and the use of a barcode and QR code.

**Transcribed Text:**

* **Date:** 27 Jun 2019
* **Clinical Notes:** 
	+ The text here appears to be a mix of English and possibly Hindi, but the legibility is poor. However, based on context and common medical abbreviations, here is a possible interpretation:
		- "Rt. Knee pain" could be written here, though not entirely clear.
* **Advice:** 
	+ Again, the handwriting is difficult to decipher, but it seems to include:
		- "Zerodol," which could be a medication (likely a brand name for a pain reliever or anti-inflammatory).
		- "Pantocid," which is likely Pantoprazole, a proton pump inhibitor.
		- "TID" which stands for "Ter In Die," Latin for "three times a day."

**Medication Names, Dosages, and Instructions:**

* **Zerodol:** Dosage and specific instructions unclear, but mentioned to be taken possibly three times a day (TID).
* **Pantocid:** Dosage unclear, but also possibly to be taken TID.
"""

def parse_prescription_text(text: str):
    added_meds = []
    
    # Try block-based parsing for structured lists
    blocks = []
    numbered_blocks = re.split(r'\n\s*\d+[\.\)]\s+', "\n" + text)
    if len(numbered_blocks) > 1:
        blocks = numbered_blocks[1:]
    else:
        bullet_blocks = re.split(r'\n\s*[\-\*\u2022]\s+', "\n" + text)
        if len(bullet_blocks) > 1:
            blocks = bullet_blocks[1:]
            
    if blocks:
        print(f"Found {len(blocks)} blocks. Parsing blocks...")
        for block in blocks:
            # Clean markdown formatting inside each block
            clean_block = block.replace("**", "").replace("*", "")
            lines = [l.strip() for l in clean_block.split('\n') if l.strip()]
            if not lines:
                continue
                
            first_line = lines[0]
            
            # If the first line has a colon, split it
            # e.g., "Zerodol: Dosage and specific instructions..." -> "Zerodol"
            med_name = first_line.strip()
            remainder = ""
            if ":" in med_name:
                parts = med_name.split(":", 1)
                med_name = parts[0].strip()
                remainder = parts[1].strip()
                
            # If name is too long or empty, skip
            if not med_name or len(med_name) > 60:
                continue
                
            # Skip metadata blocks or labels that are not medications
            excluded_names = ["date", "clinical notes", "advice", "patient information", "prescription details", "medication names", "interpretation", "limitations", "note on the document type"]
            if med_name.lower() in excluded_names:
                continue
                
            # Search for dosage
            dosage = None
            dosage_pattern = re.compile(
                r'\b(\d+(?:\.\d+)?\s*(?:mg|mcg|ml|g|tablet|tablets|capsule|capsules|tab|tabs|cap|caps))\b',
                re.IGNORECASE
            )
            
            # Check remainder of the first line first
            if remainder:
                m = dosage_pattern.search(remainder)
                if m:
                    dosage = m.group(1)
            
            frequency_context = remainder.lower()
            
            for line in lines[1:]:
                if "dosage" in line.lower() or "dose" in line.lower():
                    m = dosage_pattern.search(line)
                    if m:
                        dosage = m.group(1)
                elif not dosage:
                    m = dosage_pattern.search(line)
                    if m:
                        dosage = m.group(1)
                        
                if any(k in line.lower() for k in ["frequency", "times", "schedule", "once", "twice", "thrice", "daily", "day", "tid", "bid", "qd"]):
                    frequency_context += " " + line.lower()
            
            # If name is valid, we accept it even if dosage is not found
            if med_name:
                final_dosage = dosage or "1 tablet"
                
                # Determine schedule
                times = []
                if any(k in frequency_context for k in ["morning", "breakfast", "am"]):
                    times.append("morning")
                if any(k in frequency_context for k in ["afternoon", "lunch", "noon"]):
                    times.append("afternoon")
                if any(k in frequency_context for k in ["evening", "snack"]):
                    times.append("evening")
                if any(k in frequency_context for k in ["night", "dinner", "bedtime", "pm"]):
                    times.append("night")
                    
                if not times:
                    if any(k in frequency_context for k in ["three times", "tid", "t.i.d.", "1-1-1", "thrice"]):
                        times = ["morning", "afternoon", "night"]
                    elif any(k in frequency_context for k in ["twice", "bid", "b.i.d.", "1-0-1"]):
                        times = ["morning", "night"]
                    elif any(k in frequency_context for k in ["once", "qd", "q.d.", "od", "1-0-0"]):
                        times = ["morning"]
                    else:
                        times = ["morning", "night"]
                        
                added_meds.append({
                    "name": med_name,
                    "dosage": final_dosage,
                    "schedule": {"times": times}
                })
                
    return added_meds

print("Parsing...")
res = parse_prescription_text(ocr_text)
import json
print(json.dumps(res, indent=2))
