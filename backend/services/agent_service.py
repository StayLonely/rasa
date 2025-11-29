import os
import yaml
import shutil
from datetime import datetime
from typing import List, Optional
from ..models import Agent, AgentCreate, AgentType, AgentStatus


class AgentService:
    def __init__(self):
        self.agents_db = []
        self.agent_id_counter = 1
        self.base_agents_path = "lab_complex/agents"

    def create_agent(self, agent_data: AgentCreate) -> Agent:
        """Создание нового агента на основе шаблонов"""
        agent_id = self.agent_id_counter
        self.agent_id_counter += 1

        # Определяем шаблон в зависимости от типа
        template_agent = "faq_agent" if agent_data.agent_type == AgentType.FAQ else "form_agent"
        new_agent_folder = f"{agent_data.name.lower()}_{agent_id}"
        new_agent_path = os.path.join(self.base_agents_path, new_agent_folder)

        try:
            # Копируем шаблон агента
            template_path = os.path.join(self.base_agents_path, template_agent)
            if os.path.exists(template_path):
                shutil.copytree(template_path, new_agent_path)

                # Обновляем domain.yml с новым именем
                domain_file = os.path.join(new_agent_path, "domain.yml")
                if os.path.exists(domain_file):
                    with open(domain_file, 'r', encoding='utf-8') as f:
                        domain_content = f.read()

                    # Добавляем информацию о агенте в описание
                    updated_domain = domain_content.replace(
                        "version: \"3.1\"",
                        f"version: \"3.1\"\n# Agent: {agent_data.name}\n# Description: {agent_data.description}"
                    )

                    with open(domain_file, 'w', encoding='utf-8') as f:
                        f.write(updated_domain)

            agent = Agent(
                id=agent_id,
                name=agent_data.name,
                description=agent_data.description,
                agent_type=agent_data.agent_type,
                config_path=os.path.join(new_agent_path, "config.yml"),
                domain_path=os.path.join(new_agent_path, "domain.yml"),
                model_path=os.path.join(new_agent_path, "models"),
                status=AgentStatus.READY
            )

            self.agents_db.append(agent)
            return agent

        except Exception as e:
            print(f"Error creating agent: {e}")
            # Создаем агент без файловой структуры
            agent = Agent(
                id=agent_id,
                name=agent_data.name,
                description=agent_data.description,
                agent_type=agent_data.agent_type,
                status=AgentStatus.ERROR
            )
            self.agents_db.append(agent)
            return agent

    def get_agent(self, agent_id: int) -> Optional[Agent]:
        for agent in self.agents_db:
            if agent.id == agent_id:
                return agent
        return None

    def get_all_agents(self) -> List[Agent]:
        return self.agents_db

    def train_agent(self, agent_id: int) -> bool:
        agent = self.get_agent(agent_id)
        if not agent or not agent.config_path:
            return False

        try:
            agent.status = AgentStatus.TRAINING

            import subprocess
            agent_dir = os.path.dirname(agent.config_path)

            result = subprocess.run(
                ["rasa", "train"],
                cwd=agent_dir,
                capture_output=True,
                text=True,
                timeout=120  # 2 минуты таймаут
            )

            if result.returncode == 0:
                agent.status = AgentStatus.READY
                return True
            else:
                agent.status = AgentStatus.ERROR
                print(f"Training failed: {result.stderr}")
                return False

        except Exception as e:
            print(f"Training error: {e}")
            agent.status = AgentStatus.ERROR
            return False

    def delete_agent(self, agent_id: int) -> bool:
        agent = self.get_agent(agent_id)
        if not agent:
            return False

        # Удаляем файлы агента
        if agent.config_path:
            agent_dir = os.path.dirname(agent.config_path)
            if os.path.exists(agent_dir):
                shutil.rmtree(agent_dir)

        self.agents_db = [a for a in self.agents_db if a.id != agent_id]
        return True


# Глобальный экземпляр сервиса
agent_service = AgentService()