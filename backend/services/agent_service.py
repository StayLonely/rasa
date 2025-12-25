import os
import yaml
import shutil
import json
from datetime import datetime
from typing import List, Optional

from backend.models import Agent, AgentCreate, AgentType, AgentStatus


class AgentService:
    def __init__(self):
        self.agents_db = []
        self.agent_id_counter = 1
        self.base_agents_path = "lab_complex/agents"
        self.state_file = "agents_state.json"
        self.load_state()

    def load_state(self):
        """Загрузка состояния агентов из файла"""
        try:
            if os.path.exists(self.state_file):
                with open(self.state_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                print(f"🔄 Загружаем {len(data.get('agents', []))} агентов")

                self.agents_db = []
                for agent_data in data.get('agents', []):
                    try:
                        agent = Agent(**agent_data)
                        self.agents_db.append(agent)
                        print(f"   ✅ {agent.name} (ID: {agent.id})")
                    except Exception as e:
                        print(f"   ❌ Ошибка загрузки агента: {e}")

                self.agent_id_counter = data.get('next_id', 1)

                # Проверяем коллизии портов между агентами (несколько агентов на одном порту)
                used_ports = set()
                changed = False
                for agent in self.agents_db:
                    if agent.port in used_ports:
                        # Если порт дублируется в состоянии — переназначаем новому агенту свободный порт
                        new_port = self.find_free_port()
                        print(f"⚠️ Порт {agent.port} дублируется -> переназначаем {agent.name} на порт {new_port}")
                        agent.port = new_port
                        agent.updated_at = datetime.now().isoformat()
                        changed = True
                    used_ports.add(agent.port)

                if changed:
                    self.save_state()
        except Exception as e:
            print(f"❌ Ошибка загрузки состояния: {e}")
            self.agents_db = []
            self.agent_id_counter = 1

    def save_state(self):
        """Сохранение состояния агентов в файл"""
        try:
            state_data = {
                'next_id': self.agent_id_counter,
                'agents': [agent.__dict__ for agent in self.agents_db],
                'saved_at': datetime.now().isoformat(),
                'total_agents': len(self.agents_db)
            }

            with open(self.state_file, 'w', encoding='utf-8') as f:
                json.dump(state_data, f, ensure_ascii=False, indent=2)

            print(f"💾 Сохранено {len(self.agents_db)} агентов")
            return True

        except Exception as e:
            print(f"❌ Ошибка сохранения: {e}")
            return False

    def create_agent(self, agent_data: AgentCreate) -> Agent:
        """Создание нового агента"""
        print(f"🆕 Создаем агента: {agent_data.name}")

        agent_id = self.agent_id_counter
        self.agent_id_counter += 1
        # Подбираем свободный порт (избегаем коллизий с уже существующими агентами и занятными портами)
        agent_port = self.find_free_port()
        template_agent = "faq_agent" if agent_data.agent_type == AgentType.FAQ else "form_agent"
        new_agent_folder = f"{agent_data.name.lower().replace(' ', '_')}_{agent_id}"
        new_agent_path = os.path.join(self.base_agents_path, new_agent_folder)

        try:
            # Копируем шаблон
            template_path = os.path.join(self.base_agents_path, template_agent)
            if os.path.exists(template_path):
                shutil.copytree(template_path, new_agent_path)
                print(f"📁 Скопирован шаблон в {new_agent_path}")

            # Создаем объект агента
            agent = Agent(
                id=agent_id,
                name=agent_data.name,
                description=agent_data.description,
                agent_type=agent_data.agent_type,
                status=AgentStatus.READY,
                port=agent_port,
                config_path=os.path.join(new_agent_path, "config.yml"),
                domain_path=os.path.join(new_agent_path, "domain.yml"),
                nlu_data_path=os.path.join(new_agent_path, "data/nlu.yml"),
                stories_path=os.path.join(new_agent_path, "data/stories.yml"),
                model_path=os.path.join(new_agent_path, "models"),
                created_at=datetime.now().isoformat(),
                updated_at=datetime.now().isoformat(),
                requires_training=False
            )

            self.agents_db.append(agent)

            # Сохраняем состояние
            if self.save_state():
                print(f"✅ Агент {agent.name} создан (ID: {agent.id}, порт: {agent.port})")
            else:
                print(f"⚠️ Агент создан, но состояние не сохранено!")

            return agent

        except Exception as e:
            print(f"❌ Ошибка создания агента: {e}")
            # Создаем агента без файловой структуры
            agent = Agent(
                id=agent_id,
                name=agent_data.name,
                description=agent_data.description,
                agent_type=agent_data.agent_type,
                status=AgentStatus.ERROR,
                port=agent_port,
                created_at=datetime.now().isoformat(),
                updated_at=datetime.now().isoformat(),
                requires_training=False
            )
            self.agents_db.append(agent)
            self.save_state()
            return agent

    def _is_port_in_use(self, port: int) -> bool:
        import socket
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("0.0.0.0", port))
            except OSError:
                return True
        return False

    def find_free_port(self, start: int = 5005, end: int = 6000) -> int:
        """Find a free port not used by agents_db and not in use on the system."""
        used = {agent.port for agent in self.agents_db if agent.port}
        for p in range(start, end):
            if p in used:
                continue
            if not self._is_port_in_use(p):
                return p
        # fallback: just return next sequential port
        p = start
        while p in used:
            p += 1
        return p

    def get_agent(self, agent_id: int) -> Optional[Agent]:
        for agent in self.agents_db:
            if agent.id == agent_id:
                return agent
        return None

    def get_all_agents(self) -> List[Agent]:
        return self.agents_db

    def train_agent(self, agent_id: int) -> bool:
        agent = self.get_agent(agent_id)
        if agent:
            agent.status = AgentStatus.READY
            agent.requires_training = False
            agent.updated_at = datetime.now().isoformat()
            return self.save_state()
        return False

    def delete_agent(self, agent_id: int) -> bool:
        agent = self.get_agent(agent_id)
        if not agent:
            return False

        self.agents_db = [a for a in self.agents_db if a.id != agent_id]
        return self.save_state()


agent_service = AgentService()