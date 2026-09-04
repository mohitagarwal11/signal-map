#!/usr/bin/env python3
"""
Test script to verify the chatbot works end-to-end
Run this from: cd backend
"""

import os
import sys
import json
import asyncio
from dotenv import load_dotenv, dotenv_values

GEMINI_MODEL = "gemini-3.1-flash-lite"

# Load environment variables from .env
env_vars = dotenv_values('.env')
for k, v in env_vars.items():
    os.environ[k] = v

print("=== Testing LLM Chatbot from Backend ===")
print(f"GEMINI_API_KEY present: {'GEMINI_API_KEY' in os.environ}")

gemini_key = os.environ.get('GEMINI_API_KEY')
if not gemini_key:
    print("No GEMINI_API_KEY found")
    sys.exit(1)

print(f"Key starts with: {gemini_key[:10]}...")

# Test connection
print("\n--- Test 1: Connect to Gemini ---")
try:
    from google import genai
    client = genai.Client(api_key=gemini_key)
    print("[OK] Connected to Gemini")
except Exception as e:
    print(f"[FAIL] Connection error: {e}")
    sys.exit(1)

# Test simple generation
print("\n--- Test 2: Simple Generation ---")
try:
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=["What is 2+2?"],
        config={"temperature": 0.1}
    )
    print(f"Response: {response.text.strip()}")
    print("[OK] Simple generation works")
except Exception as e:
    print(f"[FAIL] Error: {e}")

# Test intent extraction
print("\n--- Test 3: Intent Extraction ---")
try:
    # Import directly from the controller
    sys.path.insert(0, '.')
    from src.controllers.llm_controller import extract_intent

    test_query = "How many towers are in Delhi?"
    print(f"Query: '{test_query}'")

    result = asyncio.run(extract_intent(test_query, []))

    if result:
        print("[OK] Intent extracted successfully:")
        print(json.dumps(result, indent=2))
    else:
        print("[FAIL] Intent extraction returned None")

except Exception as e:
    print(f"[FAIL] Error: {e}")
    import traceback
    traceback.print_exc()

# Test full query handling
print("\n--- Test 4: Full Query Flow ---")
try:
    # Need database for full query, but we can test the pipeline
    from src.controllers.llm_controller import get_intent_extraction_prompt

    full_prompt = f"{get_intent_extraction_prompt([])}\n\nUser question: Show me Jio towers in Mumbai\n\nRespond with JSON only:"

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=[full_prompt],
        config={
            "temperature": 0.1,
            "response_mime_type": "application/json",
        }
    )

    if hasattr(response, 'text'):
        print(f"LLM Response: {response.text}")
        try:
            intent = json.loads(response.text)
            print("[OK] Full pipeline test successful")
            print(json.dumps(intent, indent=2))
        except json.JSONDecodeError as e:
            print(f"[FAIL] JSON parse error: {e}")
    else:
        print("[FAIL] No text in response")

except Exception as e:
    print(f"[FAIL] Error: {e}")
    import traceback
    traceback.print_exc()

print("\n=== Test Complete ===")
print("\nNext steps:")
print("1. Start backend: uvicorn src.main:app --reload --port 8000")
print("2. Test API: curl -X POST http://localhost:8000/llm/query -H 'Content-Type: application/json' -d '{\"message\": \"How many towers are in Delhi?\"}'")
