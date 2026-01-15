from fastapi import APIRouter, HTTPException
from typing import List
from backend.nlu_models import Entity
from backend.nlu_service import NLUService
from backend.services.agent_service import agent_service

router = APIRouter(prefix="/api/agents/{agent_id}/entities", tags=["Entities"])
nlu_service = NLUService()

@router.get("/", response_model=List[Entity])
async def get_agent_entities(agent_id: int):
    """Получение всех сущностей агента"""
    agent = agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    if not agent.nlu_data_path:
        return []  # Возвращаем пустой список если нет пути к NLU данным
    
    try:
        nlu_data = nlu_service.load_nlu_data(agent.nlu_data_path)
        return nlu_data.entities
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading entities: {str(e)}")

@router.post("/", response_model=Entity)
async def create_entity(agent_id: int, entity: Entity):
    """Создание новой сущности"""
    agent = agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    if not agent.nlu_data_path:
        raise HTTPException(status_code=400, detail="Agent doesn't have NLU data path configured")
    
    try:
        # Загружаем текущие данные
        nlu_data = nlu_service.load_nlu_data(agent.nlu_data_path)
        
        # Проверяем уникальность имени
        if any(e.name == entity.name for e in nlu_data.entities):
            raise HTTPException(status_code=400, detail=f"Entity with name '{entity.name}' already exists")
        
        # Добавляем новую сущность
        nlu_data.entities.append(entity)
        
        # Сохраняем изменения
        success = nlu_service.save_nlu_data(agent.nlu_data_path, nlu_data)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save NLU data")
        
        # Помечаем агента как требующего обучения
        agent.requires_training = True
        agent_service.save_state()
        
        return entity
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating entity: {str(e)}")

@router.put("/{entity_name}", response_model=Entity)
async def update_entity(agent_id: int, entity_name: str, entity: Entity):
    """Обновление сущности"""
    agent = agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    if not agent.nlu_data_path:
        raise HTTPException(status_code=400, detail="Agent doesn't have NLU data path configured")
    
    try:
        # Загружаем текущие данные
        nlu_data = nlu_service.load_nlu_data(agent.nlu_data_path)
        
        # Находим и обновляем сущность
        entity_found = False
        for i, existing_entity in enumerate(nlu_data.entities):
            if existing_entity.name == entity_name:
                nlu_data.entities[i] = entity
                entity_found = True
                break
        
        if not entity_found:
            raise HTTPException(status_code=404, detail=f"Entity '{entity_name}' not found")
        
        # Сохраняем изменения
        success = nlu_service.save_nlu_data(agent.nlu_data_path, nlu_data)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save NLU data")
        
        # Помечаем агента как требующего обучения
        agent.requires_training = True
        agent_service.save_state()
        
        return entity
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating entity: {str(e)}")

@router.delete("/{entity_name}")
async def delete_entity(agent_id: int, entity_name: str):
    """Удаление сущности"""
    agent = agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    if not agent.nlu_data_path:
        raise HTTPException(status_code=400, detail="Agent doesn't have NLU data path configured")
    
    try:
        # Загружаем текущие данные
        nlu_data = nlu_service.load_nlu_data(agent.nlu_data_path)
        
        # Находим и удаляем сущность
        entity_found = False
        for i, existing_entity in enumerate(nlu_data.entities):
            if existing_entity.name == entity_name:
                nlu_data.entities.pop(i)
                entity_found = True
                break
        
        if not entity_found:
            raise HTTPException(status_code=404, detail=f"Entity '{entity_name}' not found")
        
        # Сохраняем изменения
        success = nlu_service.save_nlu_data(agent.nlu_data_path, nlu_data)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save NLU data")
        
        # Помечаем агента как требующего обучения
        agent.requires_training = True
        agent_service.save_state()
        
        return {"message": f"Entity '{entity_name}' deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting entity: {str(e)}")