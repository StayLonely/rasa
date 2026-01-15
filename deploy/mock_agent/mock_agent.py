from flask import Flask, request, jsonify
app = Flask(__name__)

@app.after_request
def after_request(response):
    response.headers['Content-Type'] = 'application/json; charset=utf-8'
    return response

@app.route("/webhooks/rest/webhook", methods=["POST", "GET"])
def webhook():
    # Простой способ получения данных
    print("=== REQUEST DEBUG ===")
    print("Method:", request.method)
    print("Content-Type:", request.content_type)
    print("Raw data:", request.data.decode('utf-8'))
    
    # Попробуем разные способы получения JSON
    j = {}
    try:
        if request.is_json:
            j = request.get_json(force=True) or {}
        else:
            # Если не JSON, попробуем распарсить вручную
            import json
            raw_data = request.data.decode('utf-8')
            if raw_data.strip():
                j = json.loads(raw_data)
    except Exception as e:
        print("JSON parse error:", e)
        j = {}
    
    print("Final parsed data:", j)
    
    # accept different field names
    text = j.get("message") or j.get("text") or "hello"
    print("Final extracted text:", text)
    print("=== END DEBUG ===")
    
    # Умная логика для определения интента
    text_lower = text.lower()
    
    # Определяем интент по ключевым словам
    if any(word in text_lower for word in ['привет', 'здравствуй', 'хай', 'добрый', 'здорово']):
        intent = "greet"
        confidence = 0.95
        response = "Здравствуйте! Рад вас видеть. Чем могу помочь?"
    elif any(word in text_lower for word in ['пока', 'до свидания', 'прощай', 'всего']):
        intent = "goodbye"
        confidence = 0.9
        response = "До свидания! Всего хорошего!"
    elif any(word in text_lower for word in ['доставк', 'доставят', 'курьер']):
        intent = "faq_delivery"
        confidence = 0.85
        response = "Доставка осуществляется в течение 1-3 дней. Стоимость зависит от региона."
    elif any(word in text_lower for word in ['оплат', 'карт', 'деньги', 'стоит']):
        intent = "faq_payment"
        confidence = 0.85
        response = "Мы принимаем банковские карты, наличные и электронные платежи."
    elif any(word in text_lower for word in ['контакт', 'телефон', 'адрес', 'связаться']):
        intent = "faq_contacts"
        confidence = 0.85
        response = "Наши контакты: телефон +7(XXX)XXX-XX-XX, email: info@example.com"
    elif any(word in text_lower for word in ['заказ', 'бронирован', 'запис']):
        intent = "request_booking"
        confidence = 0.9
        response = "Для оформления заказа укажите, пожалуйста, что именно вас интересует."
    else:
        intent = "unknown"
        confidence = 0.7
        response = "Спасибо за ваше сообщение. Я постараюсь помочь вам."
    
    # Определяем сущности
    entities = []
    if "@" in text:
        entities.append({
            "entity": "email",
            "value": text.split("@")[0] + "@example.com",
            "confidence": 0.92,
            "start": text.find("@"),
            "end": len(text)
        })
    
    # Ищем числа
    import re
    numbers = re.findall(r'\d+', text)
    for num in numbers:
        entities.append({
            "entity": "number",
            "value": num,
            "confidence": 0.88,
            "start": text.find(num),
            "end": text.find(num) + len(num)
        })
    
    return jsonify([{
        "text": response,
        "intent": {
            "name": intent,
            "confidence": confidence
        },
        "entities": entities
    }])

@app.route("/", methods=["GET"])
def root():
    return "OK", 200


@app.route("/shutdown", methods=["POST"])
def shutdown():
    func = request.environ.get('werkzeug.server.shutdown')
    if func is None:
        return jsonify({"error": "shutdown not available"}), 500
    func()
    return jsonify({"message": "shutting down"}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5008)
