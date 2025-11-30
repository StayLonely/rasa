import json
import os
from datetime import datetime
from typing import List, Optional

from backend.models import DialogLog, DialogLogCreate


class DialogLogger:
    def __init__(self):
        self.logs: List[DialogLog] = []
        self.log_id_counter = 1
        self.logs_file = "dialogs_state.json"
        self._ensure_logs_file()
        self.load_logs_state()

    def _ensure_logs_file(self):
        """Создает пустой файл логов если его нет"""
        if not os.path.exists(self.logs_file):
            with open(self.logs_file, 'w', encoding='utf-8') as f:
                json.dump({"next_id": 1, "logs": []}, f, indent=2)

    def load_logs_state(self):
        """Загрузка логов из файла"""
        try:
            with open(self.logs_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            self.logs = [DialogLog(**log_data) for log_data in data.get('logs', [])]
            self.log_id_counter = data.get('next_id', 1)
            print(f"📊 Загружено {len(self.logs)} логов диалогов")

        except Exception as e:
            print(f"❌ Ошибка загрузки логов: {e}")
            self.logs = []
            self.log_id_counter = 1

    def save_logs_state(self):
        """Сохранение логов в файл"""
        try:
            logs_data = [log.dict() for log in self.logs]
            state_data = {
                'next_id': self.log_id_counter,
                'logs': logs_data,
                'saved_at': datetime.now().isoformat()
            }

            with open(self.logs_file, 'w', encoding='utf-8') as f:
                json.dump(state_data, f, ensure_ascii=False, indent=2)

        except Exception as e:
            print(f"❌ Ошибка сохранения логов: {e}")

    async def log_dialog(self, log_data: DialogLogCreate) -> DialogLog:
        """Логирование диалога"""
        log = DialogLog(
            id=self.log_id_counter,
            agent_id=log_data.agent_id,
            sender=log_data.sender,
            user_message=log_data.user_message,
            bot_response=log_data.bot_response,
            intent=log_data.intent,
            intent_confidence=log_data.intent_confidence,
            entities=log_data.entities,
            timestamp=datetime.now().isoformat(),
            processing_time_ms=log_data.processing_time_ms
        )

        self.logs.append(log)
        self.log_id_counter += 1
        self.save_logs_state()

        return log

    def get_logs_by_agent(self, agent_id: int) -> List[DialogLog]:
        return [log for log in self.logs if log.agent_id == agent_id]

    def get_all_logs(self) -> List[DialogLog]:
        return self.logs

    def get_agent_statistics(self, agent_id: int) -> dict:
        agent_logs = self.get_logs_by_agent(agent_id)
        return {
            "total_dialogs": len(agent_logs),
            "last_activity": max(log.timestamp for log in agent_logs) if agent_logs else None
        }

    def clear_logs(self, agent_id: Optional[int] = None) -> None:
        if agent_id:
            self.logs = [log for log in self.logs if log.agent_id != agent_id]
        else:
            self.logs = []
            self.log_id_counter = 1
        self.save_logs_state()


dialog_logger = DialogLogger()