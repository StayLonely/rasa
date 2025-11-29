import requests
import json
from typing import Dict, Any


class RasaIntegration:
    @staticmethod
    def send_message_to_agent(agent_url: str, message: str, sender: str = "user") -> Dict[str, Any]:
        """
        Отправка сообщения Rasa агенту через HTTP API
        """
        try:
            payload = {
                "sender": sender,
                "message": message
            }

            response = requests.post(
                f"{agent_url}/webhooks/rest/webhook",
                json=payload,
                timeout=10
            )

            if response.status_code == 200:
                return {
                    "success": True,
                    "responses": response.json(),
                    "status_code": response.status_code
                }
            else:
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}",
                    "status_code": response.status_code
                }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    @staticmethod
    def get_agent_health(agent_url: str) -> bool:
        """
        Проверка здоровья Rasa агента
        """
        try:
            response = requests.get(f"{agent_url}/", timeout=5)
            return response.status_code == 200
        except:
            return False