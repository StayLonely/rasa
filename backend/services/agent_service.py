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
        agent_id = self.agent_id_counter
        self.agent_id_counter += 1

        agent_port = 5004 + agent_id
        template_agent = "faq_agent" if agent_data.agent_type == AgentType.FAQ else "form_agent"
        new_agent_folder = f"{agent_data.name.lower()}_{agent_id}"
        new_agent_path = os.path.join(self.base_agents_path, new_agent_folder)

        try:
            template_path = os.path.join(self.base_agents_path, template_agent)
            if os.path.exists(template_path):
                shutil.copytree(template_path, new_agent_path)

            agent = Agent(
                id=agent_id,
                name=agent_data.name,
                description=agent_data.description,
                agent_type=agent_data.agent_type,
                port=agent_port,
                config_path=os.path.join(new_agent_path, "config.yml"),
                domain_path=os.path.join(new_agent_path, "domain.yml"),
                nlu_data_path=os.path.join(new_agent_path, "data/nlu.yml"),
                stories_path=os.path.join(new_agent_path, "data/stories.yml"),
                model_path=os.path.join(new_agent_path, "models"),
                created_at=datetime.now().isoformat(),
                updated_at=datetime.now().isoformat(),
                status=AgentStatus.READY
            )

            self.agents_db.append(agent)
            return agent

        except Exception as e:
            print(f"Error creating agent: {e}")
            agent = Agent(
                id=agent_id,
                name=agent_data.name,
                description=agent_data.description,
                agent_type=agent_data.agent_type,
                port=agent_port,
                status=AgentStatus.ERROR,
                created_at=datetime.now().isoformat(),
                updated_at=datetime.now().isoformat()
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
        # Упрощенная версия - всегда возвращает True для демо
        agent = self.get_agent(agent_id)
        if agent:
            agent.status = AgentStatus.READY
            return True
        return False

    def delete_agent(self, agent_id: int) -> bool:
        agent = self.get_agent(agent_id)
        if not agent:
            return False

        self.agents_db = [a for a in self.agents_db if a.id != agent_id]
        return True


agent_service = AgentService()