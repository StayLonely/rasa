import requests
import json
from typing import Dict, Any, List, Optional
from datetime import datetime


class RasaIntegration:
    def __init__(self):
        self.base_url = "http://localhost"

    async def send_message(self, agent_port: int, message: str, sender: str = "user") -> Dict[str, Any]:
        """
        Отправка сообщения Rasa агенту и получение ответа с метаданными
        """
        try:
            url = f"{self.base_url}:{agent_port}/webhooks/rest/webhook"

            payload = {
                "sender": sender,
                "message": message
            }

            print(f"DEBUG: Sending to Rasa: {url}")  # 👈 ОТЛАДКА

            response = requests.post(
                url,
                json=payload,
                timeout=10
            )

            print(f"DEBUG: Rasa response status: {response.status_code}")  # 👈 ОТЛАДКА
            print(f"DEBUG: Rasa response: {response.text}")  # 👈 ОТЛАДКА

            if response.status_code == 200:
                rasa_response = response.json()

                # 👇 ВРЕМЕННО - возвращаем успех даже без метаданных
                return {
                    "success": True,
                    "responses": [resp.get("text", "") for resp in rasa_response],
                    "metadata": {
                        "intent": {"name": "greet", "confidence": 0.95},  # 👈 ЗАГЛУШКА
                        "entities": [],
                        "timestamp": datetime.now().isoformat(),
                        "text": message
                    },
                    "raw_response": rasa_response
                }
            else:
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}",
                    "responses": [],
                    "metadata": None
                }

        except Exception as e:
            print(f"DEBUG: Rasa integration error: {e}")  # 👈 ОТЛАДКА
            return {
                "success": False,
                "error": str(e),
                "responses": [],
                "metadata": None
            }

    def check_agent_health(self, agent_port: int) -> bool:
        """
        Проверка доступности Rasa сервера агента
        """
        try:
            response = requests.get(f"{self.base_url}:{agent_port}/", timeout=5)
            return response.status_code == 200
        except:
            return False


# Глобальный экземпляр интеграции
rasa_integration = RasaIntegration()