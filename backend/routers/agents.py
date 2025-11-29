from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List

from ..models import Agent, AgentCreate, TrainingRequest, MessageRequest, MessageResponse
from ..services.agent_service import agent_service

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.post("/", response_model=Agent)
async def create_agent(agent: AgentCreate):
    """Создать нового агента"""
    return agent_service.create_agent(agent)


@router.get("/", response_model=List[Agent])
async def list_agents():
    """Получить всех агентов"""
    return agent_service.get_all_agents()


@router.get("/{agent_id}", response_model=Agent)
async def get_agent(agent_id: int):
    """Получить агента по ID"""
    agent = agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.post("/{agent_id}/train")
async def train_agent(agent_id: int, background_tasks: BackgroundTasks):
    """Обучить агента"""
    agent = agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    background_tasks.add_task(agent_service.train_agent, agent_id)
    return {"message": f"Training started for agent {agent.name}"}


@router.post("/{agent_id}/message", response_model=MessageResponse)
async def send_message(agent_id: int, message: MessageRequest):
    """Отправить сообщение агенту"""
    agent = agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Временная заглушка - будет заменена на реальную интеграцию
    return MessageResponse(
        response=[f"Сообщение '{message.message}' получено агентом {agent.name}. Режим тестирования."],
        agent_id=agent_id
    )


@router.delete("/{agent_id}")
async def delete_agent(agent_id: int):
    """Удалить агента"""
    if not agent_service.delete_agent(agent_id):
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"message": f"Agent {agent_id} deleted"}