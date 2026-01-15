from fastapi import APIRouter, HTTPException
from typing import List
from backend.nlu_models import Intent, IntentExample
from backend.nlu_service import NLUService
from backend.services.agent_service import agent_service

router = APIRouter(prefix="/api/agents/{agent_id}/intents", tags=["Intents"])
nlu_service = NLUService()

@router.get("/", response_model=List[Intent])
async def get_agent_intents(agent_id: int):
    """Получение всех интентов агента"""
    agent = agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    if not agent.nlu_data_path:
        return []  # Возвращаем пустой список если нет пути к NLU данным
    
    try:
        nlu_data = nlu_service.load_nlu_data(agent.nlu_data_path)
        return nlu_data.intents
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading intents: {str(e)}")

@router.post("/", response_model=Intent)
async def create_intent(agent_id: int, intent: Intent):
    """Создание нового интента"""
    agent = agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    if not agent.nlu_data_path:
        raise HTTPException(status_code=400, detail="Agent doesn't have NLU data path configured")
    
    try:
        # Загружаем текущие данные
        nlu_data = nlu_service.load_nlu_data(agent.nlu_data_path)
        
        # Проверяем уникальность имени
        if any(i.name == intent.name for i in nlu_data.intents):
            raise HTTPException(status_code=400, detail=f"Intent with name '{intent.name}' already exists")
        
        # Добавляем новый интент
        nlu_data.intents.append(intent)
        
        # Сохраняем изменения
        success = nlu_service.save_nlu_data(agent.nlu_data_path, nlu_data)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save NLU data")
        
        # Помечаем агента как требующего обучения
        agent.requires_training = True
        agent_service.save_state()
        
        return intent
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating intent: {str(e)}")

@router.put("/{intent_name}", response_model=Intent)
async def update_intent(agent_id: int, intent_name: str, intent: Intent):
    """Обновление интента"""
    agent = agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    if not agent.nlu_data_path:
        raise HTTPException(status_code=400, detail="Agent doesn't have NLU data path configured")
    
    try:
        # Загружаем текущие данные
        nlu_data = nlu_service.load_nlu_data(agent.nlu_data_path)
        
        # Находим и обновляем интент
        intent_found = False
        for i, existing_intent in enumerate(nlu_data.intents):
            if existing_intent.name == intent_name:
                nlu_data.intents[i] = intent
                intent_found = True
                break
        
        if not intent_found:
            raise HTTPException(status_code=404, detail=f"Intent '{intent_name}' not found")
        
        # Сохраняем изменения
        success = nlu_service.save_nlu_data(agent.nlu_data_path, nlu_data)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save NLU data")
        
        # Помечаем агента как требующего обучения
        agent.requires_training = True
        agent_service.save_state()
        
        return intent
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating intent: {str(e)}")

@router.delete("/{intent_name}")
async def delete_intent(agent_id: int, intent_name: str):
    """Удаление интента"""
    agent = agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    if not agent.nlu_data_path:
        raise HTTPException(status_code=400, detail="Agent doesn't have NLU data path configured")
    
    try:
        # Загружаем текущие данные
        nlu_data = nlu_service.load_nlu_data(agent.nlu_data_path)
        
        # Находим и удаляем интент
        intent_found = False
        for i, existing_intent in enumerate(nlu_data.intents):
            if existing_intent.name == intent_name:
                nlu_data.intents.pop(i)
                intent_found = True
                break
        
        if not intent_found:
            raise HTTPException(status_code=404, detail=f"Intent '{intent_name}' not found")
        
        # Сохраняем изменения
        success = nlu_service.save_nlu_data(agent.nlu_data_path, nlu_data)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save NLU data")
        
        # Помечаем агента как требующего обучения
        agent.requires_training = True
        agent_service.save_state()
        
        return {"message": f"Intent '{intent_name}' deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting intent: {str(e)}")