# 🤖 AI-Model - Maritime Intelligence + Flask Backend

> Flask-powered AI assistant and AIS destination decoder for maritime vessel tracking

[Back to Main Project](../README.md)

---

## 📖 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Components Deep Dive](#components-deep-dive)
- [Configuration](#configuration)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## 🌟 Overview

The AI-Model backend is the intelligence layer of the Live Ship Vessel Tracker system. It consists of two primary components:

1. **COMPASS AI Chatbot** - Google Gemini-powered conversational assistant for maritime queries
2. **AIS Port Matcher** - Intelligent destination decoder that transforms messy AIS codes into readable port information

This Flask application acts as a microservice, processing maritime data and providing AI-driven insights to the main Express backend.

---

## ✨ Key Features

### 🤖 COMPASS AI Assistant

- **Context-Aware Conversations** - Remembers conversation history within sessions
- **Maritime Domain Expertise** - Specialized in vessel tracking and port information
- **Function Calling** - Automatically fetches real vessel data when needed
- **IMO ID Enforcement** - Ensures accurate vessel identification
- **Dynamic Response Generation** - Varied, natural language responses
- **Error Handling** - Graceful handling of invalid queries and API failures

### 🗺️ AIS Destination Decoder

- **15+ Format Parsers** - Handles diverse AIS destination formats
- **UN/LOCODE Database** - 100,000+ maritime locations
- **Fuzzy Matching** - 98% accuracy with intelligent similarity algorithms
- **Route Extraction** - Identifies final destination from multi-leg routes
- **Geocoding** - Provides precise coordinates for map visualization
- **Noise Filtering** - Removes common AIS noise words and symbols

### Supported AIS Formats

```python
✅ Supported Input Formats:
• UN/LOCODE: "TRIST", "SGSIN", "USNYC"
• Spaced LOCODE: "AE FJR", "BR PNG"
• Hyphenated: "CA-VAN", "GB-LHR"
• Port Names: "PORT SAID", "SINGAPORE"
• Port + Country: "LAGOS NIGERIA", "DAMPIER, AUSTRALIA"
• Route Format: "BEZEE <> GBHUL", "SGSIN=>BRPMA"
• Multiple Arrows: "LYBEN>>MTMAR", "MXDBT --> USPOA"
• With Noise: "GIBRALTAR EAST ANCH", "FUJAIRAH BUNKERING"
• Mixed Format: "CNSHA PORT OF SHANGHAI"
```

---

## 🏗️ Architecture

### System Flow

```
┌─────────────────────────────────────────────────────────┐
│                    EXPRESS BACKEND                      │
│              (Main Application Server)                  │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴────────────┐
         │                        │
         ▼                        ▼
┌──────────────────┐    ┌──────────────────┐
│ /api/destination │    │   /api/chat/*    │
│                  │    │                  │
│ AIS Decoder      │    │ COMPASS Chatbot  │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│  Port Matcher    │    │  Gemini API      │
│  Algorithm       │    │  Integration     │
│                  │    │                  │
│ • Pattern Match  │    │ • Session Mgmt   │
│ • LOCODE Lookup  │    │ • Function Call  │
│ • Fuzzy Search   │    │ • Response Gen   │
│ • Geocoding      │    │                  │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│  locode.json     │    │  Vessel API      │
│  (100K+ ports)   │    │  (via function)  │
└──────────────────┘    └──────────────────┘
```

### Request Flow Example

#### Destination Decoding
```
1. Express → POST /api/destination {"destination": "BEZEE <> GBHUL"}
2. Flask receives request
3. AISPortMatcher processes:
   ├─ Extract route: "BEZEE" → "GBHUL"
   ├─ Focus on destination: "GBHUL"
   ├─ LOCODE lookup: "GBHUL" found
   └─ Return: {port: "Hull", country: "United Kingdom", lat: 53.7444, lon: -0.3369}
4. Express receives decoded data
5. Frontend displays: "Hull, United Kingdom"
```

#### AI Chat Interaction
```
1. User: "What is vessel 9626390?"
2. Frontend → POST /api/chat {"message": "..."}
3. Flask → Gemini API (with context)
4. Gemini identifies need for vessel data
5. Gemini → Function call: get_vessel_data(9626390)
6. Flask executes function → Fetches from AIS API
7. Flask → Gemini (with vessel data)
8. Gemini generates natural response
9. Flask → Frontend: "Ruby is an LPG Tanker, heading to Istanbul..."
```

---

## 🛠️ Technology Stack

### Core Framework
- **Flask 3.0.0** - Lightweight WSGI web framework
- **Flask-CORS 4.0.0** - Cross-Origin Resource Sharing
- **Python 3.10+** - Runtime environment

### AI & Machine Learning
- **Google Generative AI (Gemini)** - Advanced language model
  - Model: `gemini-2.5-flash`
  - Function calling capabilities
  - Context-aware conversations

### Data Processing
- **Python Standard Library**
  - `json` - Data serialization
  - `re` - Regular expression parsing
  - `difflib` - Fuzzy string matching
  - `collections` - Data structures

### External APIs
- **AIS Friends API** - Real-time vessel data
- **UN/LOCODE Database** - Maritime location codes

### Development Tools
- **python-dotenv** - Environment variable management
- **Requests** - HTTP library for API calls
- **Gunicorn** - Production WSGI server

---

## 📁 Project Structure

```
AI-Model/
├── chatbot/                      # AI Chatbot Implementation
│   ├── chatbot.py               # Gemini-powered COMPASS assistant
│   │   ├── get_vessel_data()   # Function to fetch vessel info
│   │   ├── COMPASSChatbot      # Main chatbot class
│   │   │   ├── init_session()  # Initialize chat session
│   │   │   └── process_message() # Handle conversations
│   │   └── run_console_test()  # CLI testing interface
│   │
│   └── testbot.py               # Ollama Mistral test version
│       ├── ask_mistral()        # Local LLM integration
│       └── process_user_input() # Message handler
│
├── helper/                       # Utility Functions & Data
│   ├── ais_port_matcher.py      # UN/LOCODE matching algorithm
│   │   └── AISPortMatcher       # Main matching class
│   │       ├── match_destination() # Primary matching function
│   │       ├── _normalize_text() # Text normalization
│   │       ├── _remove_noise()   # Filter common noise
│   │       ├── _extract_destination_from_route() # Route parsing
│   │       ├── _extract_country() # Country extraction
│   │       ├── _fuzzy_match_port_name() # Similarity matching
│   │       ├── _is_locode()      # LOCODE validation
│   │       └── _format_response() # Output formatting
│   │
│   ├── script.py                 # Database generation script
│   │   └── generate_locode_json() # Creates locode.json
│   │
│   ├── code-list.csv             # UN/LOCODE raw data
│   ├── country-codes.csv         # Country reference data
│   └── locode.json               # Generated port database
│       └── [                     # 100,000+ entries
│           {
│             "locode": "TRIST",
│             "port": "Istanbul",
│             "country": "Turkey",
│             "countryCode": "TR",
│             "portCode": "IST",
│             "lat": 41.0082,
│             "lon": 28.9784
│           }
│         ]
│
├── app.py                        # Flask Application & Routes
│   ├── Flask app initialization
│   ├── CORS configuration
│   ├── Route: GET /             # Health check
│   ├── Route: POST /api/destination # Decode AIS destination
│   ├── Route: GET /api/chat/init    # Initialize chat
│   └── Route: POST /api/chat        # Chat message handler
│
├── requirements.txt              # Python Dependencies
├── mock-vessels.json             # Mock data for deployment
├── .env                          # Environment Variables
│   ├── PORT=10000
│   └── GEMINI_API_KEY=xxx
│
└── .gitignore                    # Git ignore rules
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Python 3.10+**
  ```bash
  python --version  # Should be >= 3.10
  ```

- **pip** (Python package manager)
  ```bash
  pip --version
  ```

- **Virtual Environment** (recommended)
  ```bash
  python -m venv --help
  ```

### Installation

#### 1️⃣ Navigate to AI-Model Directory

```bash
cd AI-Model
```

#### 2️⃣ Create Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate

# On Mac/Linux:
source venv/bin/activate
```

You should see `(venv)` prefix in your terminal.

#### 3️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

**Dependencies installed:**
```
Flask==3.0.0
Flask-CORS==4.0.0
google-generativeai==0.8.3
python-dotenv==1.0.0
requests==2.31.0
gunicorn==21.2.0
```

#### 4️⃣ Set Up Environment Variables

```bash
# Create .env file
touch .env  # On Windows: type nul > .env
```

**Edit `.env` file:**
```env
# Server Configuration
PORT=10000

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
```

**Get Gemini API Key:**
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the generated key
5. Paste into `.env` file

#### 5️⃣ Verify Setup

```bash
# Test if dependencies are installed
python -c "import flask; import google.generativeai; print('✅ All dependencies installed')"
```

**Expected output:**
```
✅ All dependencies installed
```

---

## 🎯 Running the Application

### Development Mode

```bash
# Ensure virtual environment is activated
# You should see (venv) in terminal

python app.py
```

**Expected output:**
```
🚢 Loading UN/LOCODE port database...
✅ Port matcher initialized with 100,000+ locations
 * Serving Flask app 'app'
 * Debug mode: on
WARNING: This is a development server. Do not use it in production.
 * Running on http://127.0.0.1:10000
Press CTRL+C to quit
```

### Production Mode (Gunicorn)

```bash
gunicorn -w 4 -b 0.0.0.0:10000 app:app
```

**Flags explained:**
- `-w 4` - Use 4 worker processes
- `-b 0.0.0.0:10000` - Bind to all interfaces on port 10000
- `app:app` - Use `app` module and `app` Flask instance

### Console Testing (Chatbot)

Test the COMPASS chatbot directly in terminal:

```bash
cd chatbot
python chatbot.py
```

**Example interaction:**
```
🚢 --- COMPASS Vessel Tracker Console Test --- 🚢
Type 'exit' or 'quit' to end the session.

COMPASS: Welcome! I'm COMPASS, your specialized maritime assistant...

You: Tell me about IMO 9626390
COMPASS: [Fetching data...] Vessel: Ruby (Flag: Bahamas). It's an LPG Tanker,
         currently Underway at 10 knots toward Istanbul, Turkey.

You: What does TRTUZ mean?
COMPASS: That specific AIS code identifies the port of Tuzla, Turkey.

You: exit
COMPASS: Shipping away! Goodbye.
```

---

## 🌐 API Endpoints

### Base URL
```
http://localhost:10000
```

### Endpoints

#### 1. Health Check
```http
GET /
```

**Response:**
```json
{
  "status": "operational",
  "service": "GMS Vessel Tracker - AI Model Backend",
  "endpoints": {
    "destination_decoder": "/api/destination",
    "chat_init": "/api/chat/init",
    "chat_message": "/api/chat"
  }
}
```

---

#### 2. Decode AIS Destination
```http
POST /api/destination
Content-Type: application/json
```

**Request Body:**
```json
{
  "destination": "BEZEE <> GBHUL"
}
```

**Response (Matched):**
```json
{
  "reportedDestination": "BEZEE <> GBHUL",
  "locode": "GBHUL",
  "port": "Hull",
  "country": "United Kingdom",
  "lat": 53.7444,
  "lon": -0.3369,
  "matched": true
}
```

**Response (Unmatched):**
```json
{
  "reportedDestination": "UNKNOWN PORT XYZ",
  "matched": false
}
```

**Error Response:**
```json
{
  "error": "Invalid request: 'destination' field required"
}
```

**Test with cURL:**
```bash
curl -X POST http://localhost:10000/api/destination \
  -H "Content-Type: application/json" \
  -d '{"destination": "SGSIN"}'
```

---

#### 3. Initialize Chat Session
```http
GET /api/chat/init
```

**Response:**
```json
{
  "response": "Welcome! I'm COMPASS, your specialized maritime assistant. I can look up vessel details, confirm destinations, and decode AIS codes. To start, please provide the ship's 7-digit IMO ID."
}
```

**Test with cURL:**
```bash
curl http://localhost:10000/api/chat/init
```

---

#### 4. Send Chat Message
```http
POST /api/chat
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "Tell me about vessel 9626390"
}
```

**Response:**
```json
{
  "response": "Vessel: Ruby (Flag: Bahamas). It's an LPG Tanker, currently Underway at 10 knots toward Istanbul, Turkey. Last reported: October 31, 2025."
}
```

**Function Call Example:**

When user provides IMO, Gemini automatically calls `get_vessel_data()`:

```
User Message: "Check IMO 9626390"
     ↓
Gemini Analysis: "User wants vessel data"
     ↓
Function Call: get_vessel_data("9626390")
     ↓
Flask Executes: Fetches from AIS API
     ↓
Returns JSON: {...vessel data...}
     ↓
Gemini Processes: Generates natural response
     ↓
Response: "Ruby is an LPG Tanker heading to Istanbul..."
```

**Test with cURL:**
```bash
curl -X POST http://localhost:10000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is IMO 9626390?"}'
```

---

## 🔧 Components Deep Dive

### 1. COMPASS AI Chatbot (`chatbot/chatbot.py`)

#### Architecture

The chatbot uses Google's Gemini model with function calling capabilities:

```python
class COMPASSChatbot:
    """Manages persistent Gemini ChatSession for COMPASS assistant"""
    
    def __init__(self):
        self.client = genai.Client()  # Initialize Gemini client
        self.chat_session = None       # Will hold active session
    
    def init_session(self):
        """Creates new chat session with system instructions"""
        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION_PROMPT,
            tools=[get_vessel_data]  # Register function
        )
        self.chat_session = self.client.chats.create(
            model="gemini-2.5-flash",
            config=config
        )
    
    def process_message(self, user_input: str):
        """Handles conversation with function calling logic"""
        response = self.chat_session.send_message(user_input)
        
        # Check if model wants to call function
        if response.function_calls:
            for call in response.function_calls:
                if call.name == "get_vessel_data":
                    imo_id = call.args.get("imo_id")
                    result = get_vessel_data(imo_id)
                    
                    # Send result back to model
                    tool_response = types.Part.from_function_response(
                        name="get_vessel_data",
                        response={"data": result}
                    )
                    final_response = self.chat_session.send_message([tool_response])
                    return final_response.text
        
        return response.text
```

#### System Instruction Design

The system prompt defines COMPASS's behavior:

```python
SYSTEM_INSTRUCTION_PROMPT = """
You are COMPASS, a specialized maritime vessel tracking assistant.

CORE IDENTITY:
1. Name: COMPASS (Cargo & Oceanic Maritime Position Assistant)
2. Purpose: Provide ship tracking info via IMO ID lookups
3. Domain Focus: STRICTLY Maritime Vessel Tracking
4. Response Quality: Realistic, conversational, varied (2-3 lines max)
5. IMO ID: 7-digit IMO ID is MANDATORY

PROCEDURES:

A. Initial Greeting:
   "Welcome! I'm COMPASS, your specialized maritime assistant..."

B. Data Lookup (Function Call):
   When user provides valid IMO → call get_vessel_data(imo)

C. Response Generation:
   - Full Details: "Vessel: X (Flag: Y). Type: Z, heading to Port..."
   - Destination Only: "Heading to Port, Country"
   - AIS Code: "From Port A to Port B"
   - Location: "At Lat/Lon, near Geographic Feature"

D. Error Handling:
   - Missing IMO: "I need the 7-digit IMO number to track vessels"
   - Not Found: "IMO X not found. Please verify the number"
   - Domain Violation: "My scope is limited to vessel tracking"
"""
```

#### Function Tool

```python
def get_vessel_data(imo_id: str) -> str:
    """
    Retrieves vessel data using IMO ID from AIS Friends API.
    
    Args:
        imo_id: 7-digit IMO number
    
    Returns:
        JSON string with vessel details or empty JSON if not found
    """
    url = f"https://www.aisfriends.com/vessel/position/imo:{imo_id}"
    headers = {
        "User-Agent": get_random_ua(),
        "Accept": "application/json",
        "Referer": "https://www.aisfriends.com/"
    }
    
    try:
        response = fetch_with_retry(url, headers, retries=4)
        if response and response.get("imo"):
            return json.dumps(response)
        return json.dumps({})
    except Exception:
        return json.dumps({})
```

---

### 2. AIS Port Matcher (`helper/ais_port_matcher.py`)

#### Core Algorithm

The matcher uses a multi-stage approach for maximum accuracy:

```python
class AISPortMatcher:
    def match_destination(self, destination: str) -> dict:
        """
        Main matching function with hierarchical strategy:
        
        1. Extract destination from route format (A → B)
        2. Remove noise words and symbols
        3. Check exact port name (highest priority)
        4. Extract country information
        5. Try exact LOCODE match
        6. Fuzzy match within country (if known)
        7. Fuzzy match globally
        8. Try port code only (3 letters)
        9. Return unmatched if all fail
        """
```

#### Matching Stages

**Stage 1: Route Extraction**
```python
def _extract_destination_from_route(self, text: str) -> str:
    """Extract final destination from route formats"""
    arrows = ['<>', '>>', '-->', '=>', '->', '>']
    
    for arrow in arrows:
        if arrow in text:
            parts = text.split(arrow)
            return parts[-1].strip()  # Take last part
    
    # Check for "TO" keyword
    if re.search(r'\bTO\b', text, re.IGNORECASE):
        parts = re.split(r'\bTO\b', text, flags=re.IGNORECASE)
        return parts[-1].strip()
    
    return text
```

**Example:**
```
"BEZEE <> GBHUL" → "GBHUL"
"SGSIN=>BRPMA"   → "BRPMA"
```

---

**Stage 2: Noise Removal**
```python
def _remove_noise(self, text: str) -> str:
    """Remove common noise words and symbols"""
    noise_words = [
        'TBA', 'ANCH', 'ANCHORING', 'BUNKERING', 'OPL',
        'FOR ORDER', 'FOR ORDERS', 'ORDERS', 'UNKNOWN'
    ]
    
    text = text.upper()
    text = re.sub(r'\([^)]*\)', '', text)  # Remove brackets
    text = re.sub(r'[<>=>|/\\._\-]+', ' ', text)  # Remove symbols
    
    for noise in noise_words:
        text = re.sub(rf'\b{noise}\b', '', text)
    
    return re.sub(r'\s+', ' ', text).strip()
```

**Example:**
```
"GIBRALTAR EAST ANCH"     → "GIBRALTAR"
"FUJAIRAH BUNKERING"      → "FUJAIRAH"
"SG SIN (ANCHORAGE)"      → "SG SIN"
```

---

**Stage 3: Exact Port Name Match**
```python
# Priority 1: Check if cleaned text is exact port name
cleaned_upper = self._normalize_text(cleaned)
if cleaned_upper in self.port_name_index:
    return self._format_response(self.port_name_index[cleaned_upper][0])
```

**Example:**
```
"PORT SAID" → Found in index → Return immediately
```

---

**Stage 4: Country Extraction**
```python
def _extract_country(self, text: str) -> tuple:
    """Extract country code/name and port text"""
    parts = re.split(r'[,\-./\s]+', text)
    
    # Check if last part is country
    potential_country = parts[-1]
    if potential_country.upper() in self.country_name_index:
        return potential_country.upper(), ' '.join(parts[:-1])
    
    # Check if first part is country (e.g., "INDIA, KOCHI")
    if parts[0].upper() in self.country_name_index:
        return parts[0].upper(), ' '.join(parts[1:])
    
    return None, text
```

**Example:**
```
"DAMPIER, AUSTRALIA" → country: "AUSTRALIA", port: "DAMPIER"
"INDIA, KOCHI"       → country: "INDIA", port: "KOCHI"
```

---

**Stage 5: LOCODE Match**
```python
def _is_locode(self, text: str) -> bool:
    """Check if text matches LOCODE format (5 chars: CC+PPP)"""
    text = text.upper().replace(' ', '').replace('-', '')
    return (len(text) == 5 and 
            text[:2].isalpha() and 
            text[2:].isalpha() and
            text in self.locode_index)
```

**Example:**
```
"TRIST"  → Valid LOCODE → Lookup in index
"SGSIN"  → Valid LOCODE → Return Singapore
"AE FJR" → Normalize → "AEFJR" → Valid LOCODE
```

---

**Stage 6: Fuzzy Matching**
```python
def _fuzzy_match_port_name(self, name: str, country_filter: str = None, 
                           threshold: float = 0.75) -> List[Dict]:
    """
    Fuzzy match using SequenceMatcher for similarity scoring
    """
    matches = []
    name_upper = name.upper()
    
    for port in search_space:
        port_name = port['port'].upper()
        similarity = SequenceMatcher(None, name_upper, port_name).ratio()
        
        # Boost score if substring match
        if name_upper in port_name:
            similarity = max(similarity, 0.85)
        
        if similarity >= threshold:
            matches.append((port, similarity))
    
    matches.sort(key=lambda x: x[1], reverse=True)
    return [m[0] for m in matches]
```

**Example:**
```
"SINGAPROE" → Fuzzy match → "SINGAPORE" (similarity: 0.89)
"ROTREDAM"  → Fuzzy match → "ROTTERDAM" (similarity: 0.88)
```

---

#### Database Structure

**locode.json format:**
```json
[
  {
    "locode": "TRIST",
    "port": "Istanbul",
    "country": "Turkey",
    "countryCode": "TR",
    "portCode": "IST",
    "lat": 41.0082,
    "lon": 28.9784
  },
  {
    "locode": "SGSIN",
    "port": "Singapore",
    "country": "Singapore",
    "countryCode": "SG",
    "portCode": "SIN",
    "lat": 1.2644,
    "lon": 103.8224
  }
]
```

**Indexes built on initialization:**
```python
self.locode_index = {port['locode']: port}           # LOCODE → port
self.port_name_index = {port['port'].upper(): [port]} # Name → ports
self.country_index = {port['countryCode']: [port]}   # CC → ports
self.port_code_index = {port['portCode']: [port]}    # Code → ports
```

---

### 3. Database Generation (`helper/script.py`)

This script processes raw UN/LOCODE CSV files into optimized JSON:

```python
import csv
import json

def generate_locode_json():
    """
    Reads code-list.csv and country-codes.csv
    Generates locode.json with merged data
    """
    
    # Load country codes
    countries = {}
    with open('country-codes.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            countries[row['CountryCode']] = row['CountryName']
    
    # Process LOCODE data
    ports = []
    with open('code-list.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            country_code = row['CountryCode']
            port_code = row['PortCode']
            
            ports.append({
                "locode": f"{country_code}{port_code}",
                "port": row['PortName'],
                "country": countries.get(country_code, "Unknown"),
                "countryCode": country_code,
                "portCode": port_code,
                "lat": float(row['Latitude']),
                "lon": float(row['Longitude'])
            })
    
    # Write to JSON
    with open('locode.json', 'w', encoding='utf-8') as f:
        json.dump(ports, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Generated locode.json with {len(ports)} ports")

if __name__ == "__main__":
    generate_locode_json()
```

**Run script:**
```bash
cd helper
python script.py
```

**Output:**
```
✅ Generated locode.json with 100,000+ ports
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the AI-Model directory:

```env
# Server Configuration
PORT=10000
FLASK_ENV=development

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Custom model name
GEMINI_MODEL=gemini-2.5-flash
```

### app.py Configuration

```python
# Flask App Settings
DEBUG = True  # Set to False in production
HOST = '0.0.0.0'  # Bind to all interfaces
PORT = int(os.getenv('PORT', 10000))

# CORS Settings
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://localhost:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})
```

### Chatbot Configuration

```python
# Model Selection
MODEL_NAME = "gemini-2.5-flash"  # Fast, efficient model

# Response Length Limits
MAX_RESPONSE_LINES = 3  # Keep responses concise
MAX_RESPONSE_LINES_COMPLEX = 5  # For detailed queries

# Retry Logic
API_RETRIES = 4
API_RETRY_DELAY = 1.2  # seconds
API_TIMEOUT = 15  # seconds
```

### Port Matcher Configuration

```python
# Fuzzy Matching Thresholds
HIGH_THRESHOLD = 0.80   # Very confident match
MEDIUM_THRESHOLD = 0.70 # Acceptable match
LOW_THRESHOLD = 0.65    # Last resort (with country filter)

# Noise Words (can be extended)
NOISE_WORDS = [
    'TBA', 'ANCH', 'ANCHORING', 'BUNKERING', 'OPL',
    'OPEN', 'IN ORDER', 'FOR ORDER', 'FOR ORDERS',
    'ORDERS', 'ORDER', 'UNKNOWN', 'N/A', 'NONE'
]
```

---

## 🧪 Testing

### Manual Testing

#### Test Destination Decoder

```bash
# Start Flask app
python app.py

# In another terminal, test with cURL
curl -X POST http://localhost:10000/api/destination \
  -H "Content-Type: application/json" \
  -d '{"destination": "SGSIN"}'
```

**Expected Response:**
```json
{
  "reportedDestination": "SGSIN",
  "locode": "SGSIN",
  "port": "Singapore",
  "country": "Singapore",
  "lat": 1.2644,
  "lon": 103.8224,
  "matched": true
}
```

#### Test Chatbot

```bash
cd chatbot
python chatbot.py
```

**Test Conversation:**
```
You: Hello
COMPASS: Welcome! I'm COMPASS, your specialized maritime assistant...

You: Tell me about IMO 9626390
COMPASS: [Calls function] Vessel: Ruby (Flag: Bahamas). It's an LPG Tanker...

You: What does TRTUZ mean?
COMPASS: That specific AIS code identifies the port of Tuzla, Turkey.

You: What's the weather like?
COMPASS: My scope is limited strictly to vessel tracking and AIS data.
```

### Python Testing Script

Create `test_api.py`:

```python
import requests
import json

BASE_URL = "http://localhost:10000"

def test_health_check():
    """Test root endpoint"""
    response = requests.get(f"{BASE_URL}/")
    print("Health Check:", response.json())
    assert response.status_code == 200

def test_destination_decoder():
    """Test destination decoding"""
    test_cases = [
        "SGSIN",
        "TRIST",
        "BEZEE <> GBHUL",
        "PORT SAID",
        "DAMPIER, AUSTRALIA"
    ]
    
    for destination in test_cases:
        response = requests.post(
            f"{BASE_URL}/api/destination",
            json={"destination": destination}
        )
        result = response.json()
        print(f"\nInput: {destination}")
        print(f"Matched: {result.get('matched')}")
        if result.get('matched'):
            print(f"Port: {result['port']}, {result['country']}")

def test_chat_init():
    """Test chat initialization"""
    response = requests.get(f"{BASE_URL}/api/chat/init")
    print("\nChat Init:", response.json())
    assert "response" in response.json()

def test_chat_message():
    """Test chat message"""
    # First initialize
    requests.get(f"{BASE_URL}/api/chat/init")
    
    # Then send message
    response = requests.post(
        f"{BASE_URL}/api/chat",
        json={"message": "What does TRIST mean?"}
    )
    print("\nChat Response:", response.json())
    assert "response" in response.json()

if __name__ == "__main__":
    print("🧪 Testing AI-Model Backend...\n")
    
    test_health_check()
    test_destination_decoder()
    test_chat_init()
    test_chat_message()
    
    print("\n✅ All tests passed!")
```

**Run tests:**
```bash
python test_api.py
```

### Port Matcher Unit Tests

```python
from helper.ais_port_matcher import AISPortMatcher

def test_port_matcher():
    matcher = AISPortMatcher("helper/locode.json")
    
    test_cases = {
        "SGSIN": "Singapore",
        "TRIST": "Istanbul",
        "PORT SAID": "Port Said",
        "BEZEE <> GBHUL": "Hull",
        "DAMPIER, AUSTRALIA": "Dampier"
    }
    
    for input_dest, expected_port in test_cases.items():
        result = matcher.match_destination(input_dest)
        print(f"\n{input_dest} → {result.get('port')}")
        assert result['matched'] == True
        assert result['port'] == expected_port

if __name__ == "__main__":
    test_port_matcher()
    print("\n✅ Port matcher tests passed!")
```

---

## 🚀 Deployment

### Deployment to Render

#### 1️⃣ Prepare for Deployment

Ensure these files exist:

**requirements.txt** (already exists)
```txt
Flask==3.0.0
Flask-CORS==4.0.0
google-generativeai==0.8.3
python-dotenv==1.0.0
requests==2.31.0
gunicorn==21.2.0
```

**Procfile** (create if not exists)
```
web: gunicorn app:app
```

#### 2️⃣ Create Render Web Service

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - **Name**: `vessel-tracker-ai-model`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Plan**: Free

#### 3️⃣ Set Environment Variables

In Render dashboard, add:
```
GEMINI_API_KEY=your_gemini_api_key
PORT=10000
FLASK_ENV=production
```

#### 4️⃣ Deploy

Click "Create Web Service"

**Deployment URL:**
```
https://vessel-tracker-ai-model.onrender.com
```

#### 5️⃣ Update Express Backend

In Express backend `.env`:
```env
DESTINATION_DECODER_API=https://vessel-tracker-ai-model.onrender.com/api/destination
AI_CHATBOT_API=https://vessel-tracker-ai-model.onrender.com/api/chat
```

### Health Check

After deployment, verify:
```bash
curl https://vessel-tracker-ai-model.onrender.com/
```

**Expected:**
```json
{
  "status": "operational",
  "service": "GMS Vessel Tracker - AI Model Backend"
}
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Gemini API Key Error

**Error:**
```
FATAL: GEMINI_API_KEY not found in environment
```

**Solution:**
```bash
# Check if .env exists
ls -la | grep .env

# Verify key is set
cat .env | grep GEMINI_API_KEY

# If missing, add it
echo "GEMINI_API_KEY=your_key_here" >> .env
```

#### 2. Port Already in Use

**Error:**
```
OSError: [Errno 48] Address already in use
```

**Solution:**
```bash
# Find process using port 10000
lsof -i :10000

# Kill the process
kill -9 <PID>

# Or use different port
export PORT=10001
python app.py
```

#### 3. locode.json Not Found

**Error:**
```
FileNotFoundError: [Errno 2] No such file or directory: 'locode.json'
```

**Solution:**
```bash
# Generate the database
cd helper
python script.py

# Verify file was created
ls -lh locode.json
```

#### 4. Import Errors

**Error:**
```
ModuleNotFoundError: No module named 'flask'
```

**Solution:**
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

#### 5. CORS Errors

**Error (in browser):**
```
Access to fetch blocked by CORS policy
```

**Solution:**

In `app.py`, update CORS origins:
```python
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",
            "http://localhost:5173",
            "https://your-frontend-domain.com"  # Add production domain
        ]
    }
})
```

#### 6. Chatbot Not Responding

**Error:**
```
Chat session not initialized
```

**Solution:**
```bash
# Initialize chat before sending messages
curl http://localhost:10000/api/chat/init

# Then send message
curl -X POST http://localhost:10000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

#### 7. Slow Response Times

**Issue:** API taking too long to respond

**Solution:**
```python
# In app.py, add request timeout
@app.before_request
def before_request():
    request.start_time = time.time()

@app.after_request
def after_request(response):
    elapsed = time.time() - request.start_time
    if elapsed > 5.0:
        print(f"⚠️ Slow request: {elapsed:.2f}s")
    return response
```

### Debug Mode

Enable detailed logging:

```python
# In app.py
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app.logger.setLevel(logging.DEBUG)
```

### Performance Monitoring

```python
# Add timing decorator
import time
from functools import wraps

def timing_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        elapsed = time.time() - start
        print(f"⏱️ {func.__name__} took {elapsed:.3f}s")
        return result
    return wrapper

# Use on slow functions
@timing_decorator
def match_destination(self, destination):
    ...
```

---

## 📚 Additional Resources

### UN/LOCODE References
- **Official Database**: https://unece.org/trade/cefact/unlocode-code-list-country-and-territory
- **Documentation**: https://unece.org/trade/uncefact/unlocode

### Google Gemini Documentation
- **API Reference**: https://ai.google.dev/docs
- **Function Calling Guide**: https://ai.google.dev/docs/function_calling
- **Best Practices**: https://ai.google.dev/docs/best_practices

### Flask Documentation
- **Official Docs**: https://flask.palletsprojects.com/
- **Deployment Guide**: https://flask.palletsprojects.com/en/3.0.x/deploying/

### Testing Tools
- **Postman**: https://www.postman.com/
- **cURL Documentation**: https://curl.se/docs/

---

## 🤝 Contributing

Contributions to improve the AI-Model backend are welcome!

### Areas for Improvement

1. **Port Matcher Enhancements**
   - Add support for more AIS formats
   - Improve fuzzy matching accuracy
   - Handle multi-language port names

2. **Chatbot Features**
   - Add vessel comparison capabilities
   - Implement route prediction
   - Support multiple languages

3. **Performance Optimization**
   - Cache port matcher results
   - Optimize database indexing
   - Reduce API response times

4. **Testing**
   - Add comprehensive unit tests
   - Create integration tests
   - Add load testing

### Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/improve-port-matching

# 2. Make changes
# Edit files...

# 3. Test changes
python test_api.py

# 4. Commit
git add .
git commit -m "Improve port matching accuracy"

# 5. Push and create PR
git push origin feature/improve-port-matching
```

---

## 🙏 Acknowledgments

- **Google Gemini** - Advanced AI capabilities
- **UN/LOCODE** - Comprehensive port database
- **AIS Friends** - Vessel data source
- **Flask Community** - Excellent web framework

---

<div align="center">

**Part of the Live Ship Vessel Tracker System**

[Main Project](../README.md) | [Express Backend](../backend/README.md) | [Frontend](../frontend/README.md)

🤖 Built with AI-powered intelligence for maritime tracking ~ Ryan Tusi, Full Stack + AI/ML Engineer

</div>