from flask import Flask, request, jsonify
from flask_cors import CORS
from chatbot.chatbot import process_user_input, get_greeting
from helper import AISPortMatcher

app = Flask(__name__)
CORS(app)

# --- Initialize your parser class ---
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
    result = parser.match_destination(destination)
    return jsonify(result)

@app.route('/api/chat', methods=['POST'])
def chat():
    """Endpoint for chatbot messages"""
    try:
        data = request.json
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'error': 'Message cannot be empty'}), 400
        
        ai_response = process_user_input(user_message)
        
        return jsonify({
            'success': True,
            'userMessage': user_message,
            'aiResponse': ai_response
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/chat/init', methods=['GET'])
def init_chat():
    """Get initial greeting from COMPASS"""
    try:
        greeting = get_greeting()
        return jsonify({
            'success': True,
            'greeting': greeting
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(debug=True, port=5000)