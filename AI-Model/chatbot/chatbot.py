import os
import json
import re
import requests
import time
import random
from google import genai
from google.genai import types
from dotenv import load_dotenv # NEW IMPORT

# Load environment variables from .env file
load_dotenv()

# ----------------- CONFIGURATION -----------------

MODEL_NAME = "gemini-2.5-flash" 

SYSTEM_INSTRUCTION_PROMPT = """You are COMPASS, a specialized, highly constrained, and efficient maritime vessel tracking assistant. Your sole function is to provide immediate, brief, and factual ship information based on a valid IMO ID or to interpret AIS destination codes.

**CORE IDENTITY & HIERARCHICAL INSTRUCTIONS:**
1.  **Name:** COMPASS (Cargo & Oceanic Maritime Position Assistant Shipping System).
2.  **Purpose:** Provide ship & vessel tracking information via IMO ID lookups and parse AIS UN/LOCODEs to human-readable port names.
3.  **Domain Focus (P0):** Strictly Maritime Vessel Tracking and AIS data interpretation. **Reject all other topics concisely.**
4.  **Brevity & Tone (P1):** All responses must be **2-3 lines max** (4-5 lines only if absolutely necessary). Be professional, direct, and efficient, but use **varied, natural phrasing** to avoid sounding like a simple template. Avoid all filler/fluff.
5.  **IMO ID (P2):** The **7-digit IMO ID is MANDATORY** for lookups. If an IMO is not provided, enforce this rule immediately.

---

**PROCEDURES & FUNCTION CALLING:**

A. **Initial Greeting (First Turn Only):**
    "Welcome! I'm COMPASS, your specialized maritime assistant. I can look up vessel details, confirm destinations, and decode AIS codes. To start, please provide the ship's **7-digit IMO ID**."

B. **Data Lookup (Function Call):**
    If the user provides a valid 7-digit IMO ID, you **MUST** call the `get_vessel_data` function with the IMO ID as the argument. **DO NOT generate a textual response until the function result is returned.**

---

**DATA INTERPRETATION & MANDATORY OUTPUT FORMATS:**

The JSON data contains the following primary keys: `name`, `detailed_type` (preferred over `type`), `flag`, `ais_destination`, `navigational_status`, `latitude`, and `longitude`.

C1. **Full Details Requested:** (e.g., "Tell me about IMO 1234567")
    * **Goal:** Present key facts concisely, varying phrasing (2-3 lines).
    * **Example 1:** "Vessel: CONCORDE (Flag: Bahamas). It's an LPG Tanker, currently Underway, with a destination of **Singapore** to **Houston, USA**."
    * **Example 2:** "The CONCORDE (Flag: BHS) is an LPG Tanker. Status: Underway. Full route is: **Singapore** to **Houston, USA**."

C2. **Specific Detail (Destination/Route) Requested:** (e.g., "Where is it headed?")
    * **Goal:** State the destination directly, using varied openings.
    * **Example 1:** "The current destination reported for this vessel is **Tuzla, Turkey**."
    * **Example 2:** "It is underway, headed straight for **Tuzla, Turkey**."

C3. **AIS Code Parsing Requested:** (e.g., "What does EGSUZ->TRTUZ mean?")
    * **Goal:** Provide clear, immediate translation of the AIS code.
    * **Example 1 (Route):** "The reported routing is from **Suez Canal, Egypt**, with the destination being **Tuzla, Turkey**."
    * **Example 2 (Single):** "That specific AIS code identifies the port of **Singapore**."
    
C4. **Current Location/Position Requested:** (e.g., "Where is it now?")
    * **Goal:** Provide navigational status, coordinates, and a concise geographic context. Use `latitude` and `longitude` to estimate a human-readable location.
    * **Example 1:** "The vessel is at Lat: [latitude], Lon: [longitude]. It is **Sailing in the Indian Ocean**, status: [navigational_status]."
    * **Example 2:** "Current position is [latitude] [longitude]. The ship appears to be near the **Suez Canal Bridge**."

---

**ERROR HANDLING & EDGE CASES (Priority Order):**

D1. **IMO Missing/Ambiguous:** (User provides name or vague query without IMO)
    * **Goal:** Insist on the IMO ID using varied, polite phrasing.
    * **Example 1:** "Vessel names can be easily confused. I must have the unique 7-digit IMO number to begin tracking."
    * **Example 2:** "To ensure I find the correct ship, please confirm the full IMO identifier. That's the only reliable way I can track it."

D2. **Domain Violation:** (User asks about weather, law, etc.)
    * **Response:** "My scope is limited strictly to vessel tracking and AIS data. Please provide an IMO ID for me to assist."

D3. **Function Data Failure:** (Function returns empty JSON (`{}`) or lacks 'imo' key)
    * **Response:** "IMO [Last Queried ID] was not found in our database. Please verify the number and try again."
"""

# ---------------- AIS API HELPER FUNCTIONS ----------------

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
            response = requests.get(url, headers=headers, timeout=15) 
            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"HTTP error! status: {response.status_code}")
        except Exception as e:
            if attempt == retries:
                raise e
            time.sleep(delay * attempt)


# ---------------- GEMINI TOOL FUNCTION ----------------

def get_vessel_data(imo_id: str) -> str:
    """
    Retrieves vessel data in JSON format using a 7-digit IMO ID.
    
    Returns a JSON string containing the vessel's details. Key fields include: 
    'name', 'detailed_type', 'flag', 'ais_destination', and 'navigational_status'.
    Returns an empty JSON string ('{}') if the IMO ID is invalid or data is unavailable.
    """
    
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
            return json.dumps({})
             
        return json.dumps(data)
        
    except Exception as e:
        print(f"[DEBUG] API Error during data retrieval for IMO {imo_id}: {e}")
        return json.dumps({}) 


# ---------------- CHATBOT CLASS ----------------

class COMPASSChatbot:
    """Manages the persistent Gemini ChatSession for the COMPASS assistant."""
    
    def __init__(self):
        self.client = None
        self.chat_session = None
        
        # Check if the key is available via os.getenv after load_dotenv() has run
        if not os.getenv("GEMINI_API_KEY"):
            print("FATAL: GEMINI_API_KEY not found in environment or .env file.")
            raise RuntimeError("Gemini service unavailable: API key missing.")

        try:
            # Initialize the Gemini Client. It automatically uses the GEMINI_API_KEY env var.
            self.client = genai.Client()
        except Exception as e:
            # Catch general client initialization errors
            print(f"FATAL: Could not initialize Gemini client. Error: {e}")
            raise RuntimeError("Gemini service unavailable.")

    def init_session(self):
        """Initializes a new chat session and gets the initial greeting."""
        
        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION_PROMPT,
            tools=[get_vessel_data] # Pass the function definition here
        )
        
        # Create the chat session
        self.chat_session = self.client.chats.create(
            model=MODEL_NAME,
            config=config,
        )
        
        # Get the initial greeting, which is defined in the system prompt (A)
        # We send a simple message to kick off the conversation
        initial_response = self.chat_session.send_message("Initial session setup.")
        
        return initial_response.text.strip()

    def process_message(self, user_input: str):
        """
        Handles the back-and-forth conversation, including function calling logic.
        Assumes self.chat_session has already been initialized.
        """
        if not self.chat_session:
            raise RuntimeError("Chat session not initialized. Call init_session() first.")

        # 1. Send user message to the model
        response = self.chat_session.send_message(user_input)
        
        # 2. Check if the model wants to call a function
        if response.function_calls:
            function_calls = response.function_calls
            tool_responses = []

            for call in function_calls:
                function_name = call.name
                args = dict(call.args)
                
                # Match the function name to the local Python function
                if function_name == "get_vessel_data":
                    imo_id = args.get("imo_id")
                    function_result = get_vessel_data(imo_id) # Execute the external API call
                    
                    # Prepare the result to be sent back to the model
                    tool_responses.append(
                        types.Part.from_function_response(
                            name=function_name,
                            response={"data": function_result} # Send the JSON string result
                        )
                    )

            # 3. Send the function result back to the model for the final, concise answer
            if tool_responses:
                final_response = self.chat_session.send_message(tool_responses)
                return final_response.text.strip()

        # 4. If no function call, the model's first response is the final response
        return response.text.strip()

# ---------------- CONSOLE TEST ENVIRONMENT ----------------
# Uncomment to run in console

# def run_console_test():
#     """Initializes and runs the main chat loop for console testing."""
    
#     try:
#         compass_test = COMPASSChatbot()
#     except RuntimeError:
#         print("\n❌ Cannot run console test: Gemini client failed to initialize (Check API key).")
#         return

#     print("\n🚢 --- COMPASS Vessel Tracker Console Test --- 🚢")
#     print("Type 'exit' or 'quit' to end the session.")
#     print("Use a valid 7-digit IMO ID for lookups (e.g., 9734678).\n")
    
#     try:
#         # Initial Greeting
#         greeting = compass_test.init_session()
#         print(f"COMPASS: {greeting}")
#     except Exception as e:
#         print(f"Initial session failed: {e}")
#         return

#     while True:
#         user_input = input("\nYou: ").strip()
#         if user_input.lower() in ["exit", "quit", "end", "bye"]:
#             print("COMPASS: Shipping away! Goodbye.")
#             break
#         if not user_input:
#             continue

#         try:
#             ai_response = compass_test.process_message(user_input)
#             print(f"COMPASS: {ai_response}")
#         except Exception as e:
#             # Catches unexpected runtime errors
#             print(f"An unexpected chat error occurred: {e}")
#             print("COMPASS: I apologize, there was an unexpected error. Please try your request again.")

# if __name__ == "__main__":
#     run_console_test()
