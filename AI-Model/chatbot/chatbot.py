import requests
import time
import random
import re
import json

OLLAMA_API_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "mistral"

SYSTEM_PROMPT = """You are COMPASS, a specialized maritime vessel tracking assistant designed exclusively for ship tracking inquiries. You operate with precision, brevity, and professionalism.

**YOUR CORE IDENTITY:**
- Name: COMPASS (Cargo & Oceanic Maritime Position Assistant Shipping System)
- Purpose: Provide ship & vessel tracking information via IMO ID lookups and parse AIS UN/LOCODEs to human-readable port names.
- Domain: Maritime vessel tracking ONLY
- Tone: Professional, concise, helpful
- Response length: 2-3 lines maximum, 4-5 lines only if absolutely necessary

**INITIALIZATION GREETING:**
"Hi! I'm COMPASS, your maritime tracking assistant. I can help you find ship details, destinations, AIS parsing, and vessel confirmations—but I need an IMO ID to get started. What IMO would you like me to look up?"

**CRITICAL BEHAVIOR:**
When user provides an IMO ID, respond ONLY with: FETCH_DATA:[IMO_ID]
This tells the system to retrieve actual ship data. You will then receive the ship data and should format it according to the user's question.

RULE 1 - IMO ID IS MANDATORY:
- If user provides ship name only: "I can't identify by vessel name alone—there are too many duplicates. Please provide the IMO ID."
- If user asks without IMO ID: "I'll need the IMO ID to help you. That's the unique vessel identifier."

RULE 2 - RESPONSE FORMATS:
**Full Details:** "Ship name: [name] | Type: [type] | Destination: [destination] | Flag: [flag]"
**Destination Only:** "This ship is heading towards [Port Name], [Country]."
**AIS Code Parsing (If two UN/LOCODE or locations found):** "This ship is coming from [Origin Port], [Origin Country] and heading to [Destination Port], [Destination Country]."
**AIS Code Parsing (If only one UN/LOCODE or location found):** "This ship is heading to [Destination Port], [Destination Country]."
**No Data:** "IMO [ID] not found in our database. Please verify the IMO ID is correct."

RULE 3 - BREVITY:
- Answer in 2-3 lines maximum
- NO lengthy explanations
- NO filler text
- Just the facts
- Try to make every response different from other to make it sound realistic

RULE 4 - AIS CODE PARSING (UN/LOCODE):
Common codes:
- EGSUZ = Suez Canal, Egypt
- TRTUZ = Tuzla, Turkey
- SGSIN = Singapore
- HKHKG = Hong Kong
- PA BLB = Balboa, Panama
- IN MAA = Chennai, India
Always decode to readable format: "From [Port], [Country] to [Port], [Country]"

RULE 5 - DOMAIN BOUNDARIES:
✓ Ship tracking, destinations, specs, AIS codes
✗ Weather, route planning, cargo details, maritime law

RULE 6 - NEVER MAKE UP DATA:
- Only provide information from actual ship data you receive
- If data is missing, say so

**EXAMPLE INTERACTIONS:**

User: "Where is Ruby going?"
You: "I can't identify by vessel name alone—there are too many duplicates. Please provide the IMO ID."

User: "Check IMO 1234567"
You: FETCH_DATA:1234567

After receiving ship data:
You: "Ship name: Ruby | Type: Tanker | Destination: Tuzla, Turkey | Flag: Panama"

User: "What does EGSUZ>TRTUZ mean?"
You: "That means the ship is coming from Suez Canal, Egypt, and heading to Tuzla, Turkey."

**FINAL RULES:**
- NEVER deviate from maritime vessel tracking
- NEVER provide information you don't have
- ALWAYS prioritize brevity
- ALWAYS require IMO ID for lookups
- When you need ship data, ALWAYS respond with: FETCH_DATA:[IMO_ID]
"""

user_agents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17 Safari/605.1.15",
]


def get_random_ua():
    """Rotate user agents."""
    return random.choice(user_agents)


def fetch_with_retry(url, headers, retries=3, delay=1.0):
    """Retry logic with exponential backoff."""
    for attempt in range(1, retries + 1):
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"HTTP error! status: {response.status_code}")
        except Exception as e:
            if attempt == retries:
                raise e
            time.sleep(delay * attempt)


def ship_data_retrieval(imo_id):
    """Fetch vessel data from AISFriends API."""
    url = f"https://www.aisfriends.com/vessel/position/imo:{imo_id}"
    headers = {
        "User-Agent": get_random_ua(),
        "Accept": "application/json,text/plain,*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.aisfriends.com/",
        "Connection": "keep-alive",
    }

    try:
        data = fetch_with_retry(url, headers, retries=4, delay=1.2)
        if not data or not data.get("imo"):
            return None
        return data
    except Exception as e:
        print(f"[DEBUG] API Error: {e}")
        return None


def extract_imo_from_text(text):
    """Extract IMO ID from user input. IMO is 7 digits."""
    match = re.search(r'\b(\d{7})\b', text)
    return match.group(1) if match else None


def format_ship_data(data):
    """Format ship data as readable text for Mistral."""
    if not data:
        return "No data available"
    
    lines = []
    if data.get("name"):
        lines.append(f"Ship Name: {data['name']}")
    if data.get("type"):
        lines.append(f"Type: {data['type']}")
    if data.get("imo"):
        lines.append(f"IMO: {data['imo']}")
    if data.get("destination"):
        lines.append(f"Destination: {data['destination']}")
    if data.get("flag"):
        lines.append(f"Flag: {data['flag']}")
    if data.get("position"):
        lines.append(f"Last Position: {data['position']}")
    
    return "\n".join(lines) if lines else "No data available"


def ask_mistral(user_query, ship_data=None):
    """Call Mistral with optional ship data context."""
    if ship_data:
        ship_context = format_ship_data(ship_data)
        full_prompt = f"""{SYSTEM_PROMPT}

[SHIP DATA RETRIEVED]:
{ship_context}

User: {user_query}
AI:"""
    else:
        full_prompt = f"{SYSTEM_PROMPT}\n\nUser: {user_query}\nAI:"

    payload = {
        "model": MODEL_NAME,
        "prompt": full_prompt,
        "stream": False
    }

    try:
        response = requests.post(OLLAMA_API_URL, json=payload, timeout=30)
        data = response.json()
        return data.get("response", "No response from Mistral").strip()
    except Exception as e:
        print(f"[DEBUG] Mistral Error: {e}")
        return "Sorry, I couldn't process your request. Please try again."


def process_user_input(user_input):
    """
    Main chatbot logic:
    1. Ask Mistral what to do
    2. If Mistral says FETCH_DATA, retrieve ship data and ask again
    3. Otherwise, return Mistral's response
    """
    # Get initial Mistral response
    response = ask_mistral(user_input)
    
    # Check if Mistral wants to fetch data
    if "FETCH_DATA:" in response:
        # Extract IMO from the response
        fetch_match = re.search(r'FETCH_DATA:(\d{7})', response)
        if fetch_match:
            imo_to_fetch = fetch_match.group(1)
            ship_data = ship_data_retrieval(imo_to_fetch)
            
            if ship_data:
                # Get Mistral's response with the actual data
                response = ask_mistral(user_input, ship_data)
            else:
                response = f"IMO {imo_to_fetch} not found in our database. Please verify the IMO ID is correct."
    
    return response


def get_greeting():
    """Get initial greeting from COMPASS."""
    return ask_mistral("Hello, start the conversation")
