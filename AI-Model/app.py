from flask import Flask, request, jsonify
from helper import AISPortMatcher

app = Flask(__name__)

# --- Initialize your parser class ---
parser = AISPortMatcher("helper/locode.json")

# ----------- ROUTES -------------
@app.route('/')
def home():
    return jsonify({"message": "Vessel Tracker Backend is Live 🚢"})


@app.route('/api/match-destination', methods=['POST'])
def match_destination():
    data = request.get_json()
    if not data or 'destination' not in data:
        return jsonify({"error": "Missing 'destination'"}), 400

    destination = data['destination']
    result = parser.match_destination(destination)
    return jsonify(result)

# --- Main entry ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)


