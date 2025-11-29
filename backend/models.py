from enum import Enum
from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class AgentType(str, Enum):
    FAQ = "faq"
    FORM = "form"


class AgentStatus(str, Enum):
    CREATED = "created"
    TRAINING = "training"
    READY = "ready"
    ERROR = "error"
    REQUIRES_TRAINING = "requires_training"  # 👈 ДОБАВЛЯЕМ НОВЫЙ СТАТУС


class AgentBase(BaseModel):
    name: str
    description: str
    agent_type: AgentType


class AgentCreate(AgentBase):
    pass


class Agent(AgentBase):
    id: int
    status: AgentStatus = AgentStatus.CREATED
    port: int
    config_path: Optional[str] = None
    domain_path: Optional[str] = None
    nlu_data_path: Optional[str] = None
    stories_path: Optional[str] = None
    model_path: Optional[str] = None
    requires_training: bool = False  # 👈 ДОБАВЛЯЕМ ФЛАГ

    class Config:
        from_attributes = True


class TrainingRequest(BaseModel):
    agent_id: int


class MessageRequest(BaseModel):
    message: str
    sender: str = "user"


class MessageResponse(BaseModel):
    response: List[str]
    agent_id: int