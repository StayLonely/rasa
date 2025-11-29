from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List

from backend.nlu_models import NLUData, NLUUpdateRequest
from backend.models import AgentStatus
from backend.services.agent_service import agent_service
from backend.nlu_service import NLUService

router = APIRouter(prefix="/api/agents/{agent_id}/nlu", tags=["NLU"])
nlu_service = NLUService()


@router.get("/", response_model=NLUData)
async def get_nlu_data(agent_id: int):
    """Получение NLU данных агента"""
    agent = agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if not agent.nlu_data_path:
        raise HTTPException(status_code=400, detail="Agent doesn't have NLU data path configured")

    try:
        nlu_data = nlu_service.load_nlu_data(agent.nlu_data_path)
        return nlu_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading NLU data: {str(e)}")


@router.put("/")
async def update_nlu_data(
        agent_id: int,
        nlu_request: NLUUpdateRequest,
        background_tasks: BackgroundTasks
):
    """Обновление NLU данных агента"""
    agent = agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if not agent.nlu_data_path or not agent.domain_path:
        raise HTTPException(status_code=400, detail="Agent doesn't have required paths configured")

    try:
        # Сохраняем NLU данные
        success = nlu_service.save_nlu_data(agent.nlu_data_path, nlu_request.nlu_data)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save NLU data")

        # Обновляем domain.yml
        success = nlu_service.update_domain_intents(agent.domain_path, nlu_request.nlu_data.intents)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update domain data")

        # Помечаем агента как требующего обучения
        agent.requires_training = True
        agent.status = AgentStatus.REQUIRES_TRAINING

        return {
            "message": "NLU data updated successfully",
            "requires_training": True,
            "intents_count": len(nlu_request.nlu_data.intents),
            "entities_count": len(nlu_request.nlu_data.entities)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating NLU data: {str(e)}")