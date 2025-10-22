from flask import Flask, request, jsonify
from flask_cors import CORS
from chatbot import COMPASSChatbot
from helper import AISPortMatcher 

app = Flask(__name__)
CORS(app)

# --- Global Chatbot and Parser State ---
# The COMPASSChatbot instance manages the persistent Gemini session
try:
    COMPASS = COMPASSChatbot()
except RuntimeError:
    # Handle case where Gemini client couldn't initialize (e.g., missing API key)
    COMPASS = None
    print("Warning: COMPASS Chatbot is disabled due to a runtime error during initialization.")

# Initialize your parser class (AISPortMatcher is assumed to be in 'helper.py')
parser = AISPortMatcher("helper/locode.json")

# ----------- ROUTES -------------
@app.route('/')
def home():
    return jsonify({"message": "Vessel Tracker Backend is Live 🚢"})


@app.route('/api/destination', methods=['POST'])
def match_destination():
    data = request.get_json()
    if not data or 'destination' not in data:
        return jsonify({"error": "Missing 'destination'"}), 400

    destination = data['destination']
    # Uses the local AIS parser
    result = parser.match_destination(destination) 
    return jsonify(result)

@app.route('/api/chat', methods=['POST'])
def chat():
    """Endpoint for chatbot messages. Uses the persistent Gemini session."""
    if not COMPASS:
        return jsonify({'error': 'Chat service is currently unavailable.'}), 503
        
    try:
        data = request.json
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'error': 'Message cannot be empty'}), 400
        
        # Use the COMPASS instance to process the message
        ai_response = COMPASS.process_message(user_message)
        
        return jsonify({
            'success': True,
            'userMessage': user_message,
            'aiResponse': ai_response
        })
    except Exception as e:
        print(f"Chat processing error: {e}")
        return jsonify({'error': 'A communication error occurred with the COMPASS AI.'}), 500


@app.route('/api/chat/init', methods=['GET'])
def init_chat():
    """Initializes the Gemini Chat Session and gets the greeting."""
    if not COMPASS:
        return jsonify({'error': 'Chat service is currently unavailable.'}), 503
        
    try:
        # Calls the method to initialize the session and get the AI's greeting
        greeting = COMPASS.init_session()
        return jsonify({
            'success': True,
            'greeting': greeting
        })
    except Exception as e:
        print(f"Chat initialization error: {e}")
        return jsonify({'error': 'Failed to start COMPASS session.'}), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
