import os

def search_files(directory, query):
    results = []
    for root, dirs, files in os.walk(directory):
        # Skip node_modules, .git, venv, pycache
        if any(p in root for p in ["node_modules", ".git", "venv", "__pycache__"]):
            continue
            
        for file in files:
            file_path = os.path.join(root, file)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    if query.lower() in content.lower():
                        results.append(file_path)
            except Exception:
                pass
    return results

# Search frontend and backend
print("Searching in frontend...")
frontend_results = search_files("c:\\Users\\DELL\\Desktop\\multi health ai\\frontend", "HealthPilot")
for r in frontend_results:
    print(r)

print("\nSearching in backend...")
backend_results = search_files("c:\\Users\\DELL\\Desktop\\multi health ai\\backend", "HealthPilot")
for r in backend_results:
    print(r)
