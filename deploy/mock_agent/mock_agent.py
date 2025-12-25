from flask import Flask, request, jsonify
app = Flask(__name__)

@app.route("/webhooks/rest/webhook", methods=["POST", "GET"])
def webhook():
    j = request.get_json(silent=True) or {}
    # accept different field names
    text = j.get("message") or j.get("text") or "hello"
    return jsonify([{"text": f"Echo: {text}"}])

@app.route("/", methods=["GET"])
def root():
    return "OK", 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5008)
