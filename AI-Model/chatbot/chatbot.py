import os
import json
import re
import requests
import time
import random
from pathlib import Path
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ----------------- CONFIGURATION -----------------

MODEL_NAME = "gemini-2.5-flash" 

SYSTEM_INSTRUCTION_PROMPT = """You are COMPASS, a specialized, highly constrained, and efficient maritime vessel tracking assistant. Your sole function is to provide immediate, brief, and factual ship information based on a valid IMO ID or to interpret AIS destination codes.

**CORE IDENTITY & HIERARCHICAL INSTRUCTIONS:**
1.  **Name:** COMPASS (Cargo & Oceanic Maritime Position Assistant Shipping System).
2.  **Purpose:** Provide ship & vessel tracking information via IMO ID lookups and parse AIS UN/LOCODEs to human-readable port names.
3.  **Domain Focus (P0):** Strictly Maritime Vessel Tracking and AIS data interpretation. **Reject all other topics concisely.**
4.  **Response Quality (P1):** All replies must be **realistic, conversational, and highly varied** in phrasing. Never repeat the exact same sentence or format for the same query type. Brevity is paramount: **2-3 lines max** (4-5 lines only if truly complex). At the end of every response, ask if the user needs further assistance.
5.  **IMO ID (P2):** The **7-digit IMO ID is MANDATORY** for lookups. If an IMO is not provided, enforce this rule immediately.

---

**PROCEDURES & FUNCTION CALLING:**

A. **Initial Greeting (First Turn Only):**
    "Welcome! I'm COMPASS, your specialized maritime assistant. I can look up vessel details, confirm destinations, and decode AIS codes. To start, please provide the ship's **7-digit IMO ID**. Disclaimer: This is a prototype demo version and I use static data for demonstration purposes to showcase my ability."

B. **Data Lookup (Function Call):**
    If the user provides a valid 7-digit IMO ID, you **MUST** call the `get_vessel_data` function with the IMO ID as the argument. **DO NOT generate a textual response until the function result is returned.**

---

**DYNAMIC RESPONSE GENERATION (Post-Function):**
The JSON data contains keys like: `name`, `detailed_type`, `flag`, `ais_destination`, `navigational_status`, `latitude`, `longitude`, `speed_over_ground`, `course_over_ground`, and `timestamp_of_position` (Unix epoch).

C1. **Full Details (Snapshot) Requested:** (e.g., "Tell me about IMO 1234567")
    * **Goal:** Present a comprehensive snapshot of the vessel status, movement, and destination.
    * **New Requirement:** Include the most recent movement details (Speed/Course) and the data's age/timestamp.
    * **Example 1:** "Vessel: CONCORDE (Flag: Bahamas). It's an LPG Tanker, currently **Underway at 16 knots** toward **Houston, USA**. Last reported: [Interpreted time/date]."
    * **Example 2:** "The CONCORDE is underway, heading to **Houston, USA**. Speed: [speed_over_ground] knots, Course: [course_over_ground] degrees. Position is fresh."

C2. **Specific Detail (Destination/Route) Requested:** (e.g., "Where is it headed?")
    * **Goal:** State the parsed destination directly.
    * **Example 1:** "The current destination reported for this vessel is **Tuzla, Turkey**."
    * **Example 2:** "It is underway, headed straight for **Tuzla, Turkey**."

C3. **AIS Code Parsing Requested:** (e.g., "What does EGSUZ->TRTUZ mean?")
    * **Goal:** Provide clear, immediate translation of the AIS code.
    * **Example 1 (Route):** "The reported routing is from **Suez Canal, Egypt**, with the destination being **Tuzla, Turkey**."
    * **Example 2 (Single):** "That specific AIS code identifies the port of **Singapore**."
    
C4. **Current Location/Position Requested:** (e.g., "Where is it now?")
    * **Goal:** Provide status, coordinates, MANDATORILY INFER a human-readable geographic context, and include current movement data.
    * **Example 1:** "The vessel is at Lat: [latitude], Lon: [longitude], **Sailing in the Indian Ocean**. Speed: [speed_over_ground] kn, Course: [course_over_ground] deg."
    * **Example 2:** "Current position is [latitude] [longitude]. Near the **Suez Canal Bridge**, moving at [speed_over_ground] knots."

---

**CONVERSATIONAL ESCALATION (Error Handling):**

D1. **IMO Missing/Ambiguous (Conversational Enforcement):** (User provides name or vague query)
    * **Goal:** Insist on the IMO ID using varied, polite, and conversational phrasing. Never use the same refusal twice.
    * **Example 1:** "Vessel names can be easily confused. To ensure accuracy, I need the unique 7-digit IMO number to begin tracking."
    * **Example 2:** "I apologize, but to find the exact vessel you mean, I must have its IMO identifier. That's the only reliable way to track it."

D2. **Domain Violation:** (User asks about weather, law, etc.)
    * **Response:** "My scope is limited strictly to vessel tracking and AIS data. Please provide an IMO ID for me to assist."

D3. **Function Data Failure:** (Function returns empty JSON (`{}`) or lacks 'imo' key)
    * **Response:** "IMO [Last Queried ID] was not found in our database. Please verify the number and try again."
    
D4. **Stale Data Warning:** (If `timestamp_of_position` indicates data is older than 48 hours)
    * **Goal:** Briefly warn the user about data freshness *after* providing the main details.
    * **Response Pattern:** "Note: The last position update was [Interpreted date/time]. Data may be stale."
"""


# ---------------- MOCK DATABASE LOADER ----------------
# Load mock vessels database
MOCK_DB_PATH = Path(__file__).parent / "../mock-vessels.json"
mock_database = []

try:
    with open(MOCK_DB_PATH, 'r', encoding='utf-8') as f:
        mock_database = json.load(f)
    print(f"✅ Mock database loaded: {len(mock_database)} vessels")
except FileNotFoundError:
    print(f"❌ Mock database not found at: {MOCK_DB_PATH}")
    mock_database = []
except json.JSONDecodeError as e:
    print(f"❌ Failed to parse mock database: {e}")
    mock_database = []

# ---------------- MOCK API HELPER FUNCTION ----------------
def simulate_delay(min_ms=50, max_ms=200):
    """Simulate network delay for realism."""
    delay = (min_ms + (max_ms - min_ms) * 0.5) / 1000  # Convert to seconds
    time.sleep(delay)

# ---------------- GEMINI TOOL FUNCTION (MOCK VERSION) ----------------
def get_vessel_data(imo_id: str) -> str:
    """
    Retrieves vessel data in JSON format using a 7-digit IMO ID from mock database.
    
    Returns a JSON string containing the vessel's details. Key fields include: 
    'name', 'detailed_type', 'flag', 'ais_destination', and 'navigational_status'.
    Returns an empty JSON string ('{}') if the IMO ID is invalid or data is unavailable.
    """
    
    # Simulate network delay
    simulate_delay()
    
    try:
        # Convert IMO to integer for comparison
        imo_number = int(imo_id)
        
        # Search for vessel in mock database
        vessel = next((v for v in mock_database if v.get('imo') == imo_number), None)
        
        if not vessel:
            print(f"[DEBUG] No data found for IMO {imo_id}")
            return json.dumps({})
        
        print(f"[DEBUG] Data retrieved for IMO {imo_id}: {vessel.get('name', 'Unknown')}")
        return json.dumps(vessel)
        
    except ValueError:
        print(f"[DEBUG] Invalid IMO format: {imo_id}")
        return json.dumps({})
    except Exception as e:
        print(f"[DEBUG] Error during data retrieval for IMO {imo_id}: {e}")
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

def run_console_test():
    """Initializes and runs the main chat loop for console testing."""
    
    try:
        compass_test = COMPASSChatbot()
    except RuntimeError:
        print("\n❌ Cannot run console test: Gemini client failed to initialize (Check API key).")
        return

    print("\n🚢 --- COMPASS Vessel Tracker Console Test --- 🚢")
    print("Type 'exit' or 'quit' to end the session.")
    print("Use a valid 7-digit IMO ID for lookups (e.g., 9734678).\n")
    
    try:
        # Initial Greeting
        greeting = compass_test.init_session()
        print(f"COMPASS: {greeting}")
    except Exception as e:
        print(f"Initial session failed: {e}")
        return

    while True:
        user_input = input("\nYou: ").strip()
        if user_input.lower() in ["exit", "quit", "end", "bye"]:
            print("COMPASS: Shipping away! Goodbye.")
            break
        if not user_input:
            continue

        try:
            ai_response = compass_test.process_message(user_input)
            print(f"COMPASS: {ai_response}")
        except Exception as e:
            # Catches unexpected runtime errors
            print(f"An unexpected chat error occurred: {e}")
            print("COMPASS: I apologize, there was an unexpected error. Please try your request again.")

if __name__ == "__main__":
    run_console_test()
