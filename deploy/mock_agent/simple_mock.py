from flask import Flask, request, jsonify
import sys

app = Flask(__name__)

@app.after_request
def after_request(response):
    response.headers['Content-Type'] = 'application/json; charset=utf-8'
    return response

@app.route("/webhooks/rest/webhook", methods=["POST", "GET"])
def webhook():
    # Простая обработка
    try:
        # Получаем данные любым способом
        if request.is_json:
            data = request.get_json()
        else:
            import json
            data = json.loads(request.data.decode('utf-8'))
        
        message = data.get('message', data.get('text', ''))
        print(f"Received message: {message}", file=sys.stderr)
        
        # Простая логика
        if 'доставк' in message.lower():
            intent = "faq_delivery"
            response_text = "Доставка осуществляется в течение 1-3 дней."
        elif 'оплат' in message.lower():
            intent = "faq_payment"
            response_text = "Мы принимаем банковские карты и электронные платежи."
        elif 'контакт' in message.lower():
            intent = "faq_contacts"
            response_text = "Наши контакты: телефон +7(XXX)XXX-XX-XX"
        elif 'заказ' in message.lower():
            intent = "request_booking"
            response_text = "Для оформления заказа укажите, что вас интересует."
        elif 'привет' in message.lower():
            intent = "greet"
            response_text = "Здравствуйте! Чем могу помочь?"
        else:
            intent = "unknown"
            response_text = "Спасибо за ваше сообщение."
            
        result = [{
            "text": response_text,
            "intent": {
                "name": intent,
                "confidence": 0.9
            },
            "entities": []
        }]
        
        print(f"Responding with intent: {intent}", file=sys.stderr)
        return jsonify(result)
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return jsonify([{
            "text": "Ошибка обработки сообщения",
            "intent": {"name": "unknown", "confidence": 0.0},
            "entities": []
        }])

@app.route("/", methods=["GET"])
def root():
    return "OK", 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5008, debug=True)