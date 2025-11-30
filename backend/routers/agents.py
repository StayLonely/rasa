from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List
import time

from backend.models import Agent, AgentCreate, TrainingRequest, MessageRequest, MessageResponse, TraceMetadata, \
    IntentInfo, EntityInfo, DialogLogCreate
from backend.services.agent_service import agent_service
from backend.rasa_integration import rasa_integration
from backend.dialog_logger import dialog_logger

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.post("/", response_model=Agent)
async def create_agent(agent: AgentCreate):
    return agent_service.create_agent(agent)


@router.get("/", response_model=List[Agent])
async def list_agents():
    return agent_service.get_all_agents()


@router.get("/{agent_id}", response_model=Agent)
async def get_agent(agent_id: int):
    agent = agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.post("/{agent_id}/train")
async def train_agent(agent_id: int, background_tasks: BackgroundTasks):
    agent = agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    background_tasks.add_task(agent_service.train_agent, agent_id)
    return {"message": f"Training started for agent {agent.name}"}


@router.post("/{agent_id}/message", response_model=MessageResponse)
async def send_message(agent_id: int, message: MessageRequest):
    """Отправка сообщения агенту"""
    start_time = time.time()

    agent = agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Проверяем доступность агента
    if not rasa_integration.check_agent_health(agent.port):
        raise HTTPException(
            status_code=503,
            detail=f"Agent {agent.name} is not running on port {agent.port}. Please start the Rasa server."
        )

    try:
        # Отправляем сообщение Rasa агенту
        result = await rasa_integration.send_message(agent.port, message.message, message.sender)
        processing_time_ms = (time.time() - start_time) * 1000

        if result["success"]:
            # Формируем метаданные трассировки
            trace_metadata = None
            if result.get("metadata"):
                metadata = result["metadata"]

                # Создаем информацию об интенте
                intent_info = None
                if metadata.get("intent") and metadata["intent"].get("name"):
                    intent_info = IntentInfo(
                        name=metadata["intent"]["name"],
                        confidence=metadata["intent"].get("confidence", 0.0)
                    )

                # Создаем информацию о сущностях
                entities_info = []
                for entity in metadata.get("entities", []):
                    entities_info.append(EntityInfo(
                        entity=entity.get("entity", ""),
                        value=entity.get("value", ""),
                        confidence=entity.get("confidence"),
                        start=entity.get("start"),
                        end=entity.get("end")
                    ))

                trace_metadata = TraceMetadata(
                    intent=intent_info,
                    entities=entities_info,
                    timestamp=metadata.get("timestamp", ""),
                    confidence=metadata.get("confidence"),
                    text=metadata.get("text", "")
                )

            # Логируем диалог
            log_data = DialogLogCreate(
                agent_id=agent_id,
                sender=message.sender,
                user_message=message.message,
                bot_response=result["responses"],
                intent=trace_metadata.intent.name if trace_metadata and trace_metadata.intent else None,
                intent_confidence=trace_metadata.intent.confidence if trace_metadata and trace_metadata.intent else None,
                entities=[entity.dict() for entity in trace_metadata.entities] if trace_metadata else [],
                processing_time_ms=processing_time_ms
            )
            await dialog_logger.log_dialog(log_data)

            return MessageResponse(
                response=result["responses"],
                agent_id=agent_id,
                trace_metadata=trace_metadata,
                success=True
            )
        else:
            # Логируем ошибку
            log_data = DialogLogCreate(
                agent_id=agent_id,
                sender=message.sender,
                user_message=message.message,
                bot_response=[f"Error: {result['error']}"],
                processing_time_ms=processing_time_ms
            )
            await dialog_logger.log_dialog(log_data)

            return MessageResponse(
                response=[f"Error communicating with agent: {result['error']}"],
                agent_id=agent_id,
                success=False,
                error=result["error"]
            )

    except Exception as e:
        processing_time_ms = (time.time() - start_time) * 1000

        # Логируем исключение
        log_data = DialogLogCreate(
            agent_id=agent_id,
            sender=message.sender,
            user_message=message.message,
            bot_response=[f"Unexpected error: {str(e)}"],
            processing_time_ms=processing_time_ms
        )
        await dialog_logger.log_dialog(log_data)

        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.delete("/{agent_id}")
async def delete_agent(agent_id: int):
    if not agent_service.delete_agent(agent_id):
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"message": f"Agent {agent_id} deleted"}