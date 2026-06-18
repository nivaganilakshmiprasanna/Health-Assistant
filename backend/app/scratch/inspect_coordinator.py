with open("c:\\Users\\DELL\\Desktop\\multi health ai\\backend\\app\\agents\\coordinator.py", "r", encoding="utf-8") as f:
    lines = f.readlines()
    for i, line in enumerate(lines):
        if "healthpilot" in line.lower():
            print(f"Line {i+1}: {line.strip()}")
