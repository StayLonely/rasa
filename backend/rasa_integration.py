import requests
import json
from typing import Dict, Any, List, Optional
from datetime import datetime


class RasaIntegration:
    def __init__(self):
        self.base_url = "http://localhost"

    async def send_message(self, agent_port: int, message: str, sender: str = "user") -> Dict[str, Any]:
        """
        Отправка сообщения Rasa агенту и получение ответа
        """
        try:
            # Основной запрос к Rasa
            url = f"{self.base_url}:{agent_port}/webhooks/rest/webhook"

            payload = {
                "sender": sender,
                "message": message
            }

            print(f"🔵 Отправляем сообщение '{message}' на порт {agent_port}")
            response = requests.post(url, json=payload, timeout=10)

            if response.status_code == 200:
                rasa_response = response.json()
                responses = [resp.get("text", "") for resp in rasa_response]

                print(f"🟢 Rasa ответил: {responses}")

                # Получаем метаданные через УМНУЮ заглушку
                metadata = self._get_smart_metadata(message, responses)

                return {
                    "success": True,
                    "responses": responses,
                    "metadata": metadata,
                    "raw_response": rasa_response
                }
            else:
                error_msg = f"HTTP {response.status_code}"
                print(f"🔴 Ошибка Rasa: {error_msg}")
                return {
                    "success": False,
                    "error": error_msg,
                    "responses": [],
                    "metadata": None
                }

        except Exception as e:
            error_msg = f"Ошибка соединения: {str(e)}"
            print(f"🔴 {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "responses": [],
                "metadata": None
            }

    def _get_smart_metadata(self, message: str, responses: List[str]) -> Dict[str, Any]:
        """
        Умная заглушка для метаданных - определяет интент по ключевым словам
        """
        message_lower = message.lower()

        # Определяем интент по ключевым словам
        intent_name = "unknown"
        confidence = 0.8

        if any(word in message_lower for word in ['привет', 'здравствуй', 'хай', 'добрый', 'здорово']):
            intent_name = "greet"
            confidence = 0.95
        elif any(word in message_lower for word in ['пока', 'до свидания', 'прощай', 'всего']):
            intent_name = "goodbye"
            confidence = 0.9
        elif any(word in message_lower for word in ['доставк', 'доставят', 'курьер']):
            intent_name = "faq_delivery"
            confidence = 0.85
        elif any(word in message_lower for word in ['оплат', 'карт', 'деньги']):
            intent_name = "faq_payment"
            confidence = 0.85
        elif any(word in message_lower for word in ['контакт', 'телефон', 'адрес']):
            intent_name = "faq_contacts"
            confidence = 0.85
        elif any(word in message_lower for word in ['запис', 'бронирован']):
            intent_name = "request_booking"
            confidence = 0.9

        # Определяем сущности по шаблонам
        entities = []

        return {
            "intent": {
                "name": intent_name,
                "confidence": confidence
            },
            "entities": entities,
            "timestamp": datetime.now().isoformat(),
            "confidence": confidence,
            "text": message
        }

    def check_agent_health(self, agent_port: int) -> bool:
        """
        Проверка доступности Rasa сервера
        """
        try:
            response = requests.get(f"{self.base_url}:{agent_port}/", timeout=3)
            return response.status_code == 200
        except:
            return False


# Глобальный экземпляр
rasa_integration = RasaIntegration()