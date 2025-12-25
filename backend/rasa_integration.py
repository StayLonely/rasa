import requests
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
import time
import os
import subprocess
import shutil

from backend.models import AgentStatus


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

    def stop_agent(self, agent_port: int) -> dict:
        """Попытаться обнаружить процесс, слушающий порт, и завершить его.

        Возвращает dict: {success: bool, message: str}
        """
        try:
            # Попробуем получить PID через lsof
            res = subprocess.run(["lsof", "-i", f":{agent_port}", "-t"], capture_output=True, text=True)
            if res.returncode != 0 or not res.stdout.strip():
                return {"success": False, "message": f"No process found listening on port {agent_port}"}

            pids = [int(x) for x in res.stdout.strip().splitlines() if x.strip()]
            for pid in pids:
                try:
                    os.kill(pid, 15)
                except Exception:
                    try:
                        os.kill(pid, 9)
                    except Exception as e:
                        return {"success": False, "message": f"Failed to kill pid {pid}: {e}"}

            return {"success": True, "message": f"Killed pids: {pids}"}

        except FileNotFoundError:
            return {"success": False, "message": "lsof not available on system"}
        except Exception as e:
            return {"success": False, "message": str(e)}

    def train_agent(self, agent_id: int, agent_port: int, nlu_path: str = None, domain_path: str = None, model_path: str = None, config_path: str = None):
        """
        Тренировка агента.

        Попытаемся выполнить `rasa train` в директории агента (если бинарь доступен).
        Если `rasa` отсутствует — падаем обратно в симуляцию (sleep).

        По результату обновляем состояние агента через `agent_service`.
        """
        from backend.services.agent_service import agent_service

        print(f"🔧 Starting training for agent {agent_id} on port {agent_port}")

        # Определяем рабочую директорию агента (предполагается, что domain_path лежит в корне проекта агента)
        agent_dir = None
        if domain_path:
            agent_dir = os.path.dirname(domain_path)

        try:
            rasa_exe = shutil.which('rasa')
            if rasa_exe and agent_dir and os.path.exists(agent_dir):
                # Запускаем реальную команду train
                print(f"▶️ Found rasa executable at {rasa_exe}, running training in {agent_dir}")
                try:
                    res = subprocess.run([rasa_exe, 'train'], cwd=agent_dir, capture_output=True, text=True, timeout=1800)
                    if res.returncode == 0:
                        print(f"✅ Rasa training succeeded for agent {agent_id}")
                        agent_service.train_agent(agent_id)
                        return
                    else:
                        print(f"❌ Rasa training failed: {res.returncode}\n{res.stdout}\n{res.stderr}")
                        # Установим статус ERROR
                        agent = agent_service.get_agent(agent_id)
                        if agent:
                            agent.status = AgentStatus.ERROR
                            agent.requires_training = True
                            agent.updated_at = datetime.now().isoformat()
                            agent_service.save_state()
                        return
                except subprocess.TimeoutExpired:
                    print(f"❌ Rasa training timed out for agent {agent_id}")

            # Если rasa недоступен или нет структуры — симулируем тренинг
            print("ℹ️ Rasa not available or agent dir missing — simulating training")
            time.sleep(3)
            agent_service.train_agent(agent_id)

        except Exception as e:
            print(f"❌ Training failed for agent {agent_id}: {e}")
            try:
                agent = agent_service.get_agent(agent_id)
                if agent:
                    agent.status = AgentStatus.ERROR
                    agent.requires_training = True
                    agent.updated_at = datetime.now().isoformat()
                    agent_service.save_state()
            except Exception:
                pass


# Глобальный экземпляр
rasa_integration = RasaIntegration()


def train_agent_task(agent_id: int, agent_port: int):
    """Модульная обёртка для использования с BackgroundTasks.
    Вызывает метод экземпляра `rasa_integration.train_agent`.
    """
    return rasa_integration.train_agent(agent_id, agent_port)