import requests
import os
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_upload():
    print("Logging in to get authentication token...")
    login_payload = {
        "email": "patient@healthpilot.ai",
        "password": "password123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        response.raise_for_status()
        token_data = response.json()
        token = token_data["access_token"]
        print("Login successful! Token acquired.")
    except Exception as e:
        print(f"Login failed: {e}")
        return

    headers = {
        "Authorization": f"Bearer {token}"
    }

    file_path = "c:\\Users\\DELL\\Desktop\\multi health ai\\backend\\uploads\\prescription_1_20260618140523_Screenshot_2026-06-18_140514.png"
    if not os.path.exists(file_path):
        print(f"Prescription file not found: {file_path}")
        return

    print(f"\nUploading prescription file {os.path.basename(file_path)}...")
    try:
        with open(file_path, "rb") as f:
            files = {"file": (os.path.basename(file_path), f, "image/png")}
            # We hit the upload endpoint
            res = requests.post(f"{BASE_URL}/api/medications/upload", files=files, headers=headers)
            res.raise_for_status()
            print("Upload API response success!")
            
            data = res.json()
            import json
            print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"Upload failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print("Response detail:", e.response.text)

if __name__ == "__main__":
    test_upload()
