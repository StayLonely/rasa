from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional

from backend.models import DialogLog
from backend.dialog_logger import dialog_logger
from backend.services.agent_service import agent_service

router = APIRouter(prefix="/api/agents/{agent_id}/logs", tags=["Logs"])


@router.get("/", response_model=List[DialogLog])
async def get_agent_logs(agent_id: int, limit: Optional[int] = None, intent: Optional[str] = None):
    """Получение логов диалогов для агента"""
    agent = agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    logs = dialog_logger.get_logs_by_agent(agent_id)

    # Фильтрация по интенту если указана
    if intent:
        logs = [log for log in logs if log.intent == intent]

    # Ограничение количества если указано
    if limit:
        logs = logs[:limit]

    return logs


@router.get("/statistics")
async def get_agent_statistics(agent_id: int):
    """Получение статистики по диалогам агента"""
    agent = agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    statistics = dialog_logger.get_agent_statistics(agent_id)

    return {
        "agent_id": agent_id,
        "agent_name": agent.name,
        "statistics": statistics
    }


@router.get("/intents")
async def get_agent_intents(agent_id: int):
    """Получение списка всех интентов, встречающихся в логах агента"""
    agent = agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    logs = dialog_logger.get_logs_by_agent(agent_id)
    intents = set(log.intent for log in logs if log.intent)

    return {
        "agent_id": agent_id,
        "intents": list(intents),
        "total_unique_intents": len(intents)
    }


@router.get("/{log_id}")
async def get_single_log(agent_id: int, log_id: int):
    """Получение конкретного лога по ID"""
    agent = agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    logs = dialog_logger.get_logs_by_agent(agent_id)
    log = next((log for log in logs if log.id == log_id), None)

    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    return log


@router.delete("/")
async def clear_agent_logs(agent_id: int):
    """Очистка всех логов агента (для тестирования)"""
    agent = agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    dialog_logger.clear_logs(agent_id)

    return {"message": f"All logs for agent {agent_id} cleared"}