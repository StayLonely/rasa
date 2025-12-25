from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class AgentType(str, Enum):
    FAQ = "faq"
    FORM = "form"


class AgentStatus(str, Enum):
    CREATED = "created"
    TRAINING = "training"
    READY = "ready"
    ERROR = "error"
    REQUIRES_TRAINING = "requires_training"
    STOPPED = "stopped"


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
    created_at: str  # 👈 ДОБАВЛЯЕМ ОБЯЗАТЕЛЬНОЕ ПОЛЕ
    updated_at: str  # 👈 ДОБАВЛЯЕМ ОБЯЗАТЕЛЬНОЕ ПОЛЕ
    requires_training: bool = False

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


class TrainingRequest(BaseModel):
    agent_id: int


class MessageRequest(BaseModel):
    message: str
    sender: str = "user"


class IntentInfo(BaseModel):
    name: str
    confidence: float


class EntityInfo(BaseModel):
    entity: str
    value: str
    confidence: Optional[float] = None
    start: Optional[int] = None
    end: Optional[int] = None


class TraceMetadata(BaseModel):
    intent: Optional[IntentInfo] = None
    entities: List[EntityInfo] = []
    timestamp: str
    confidence: Optional[float] = None
    text: str


class MessageResponse(BaseModel):
    response: List[str]
    agent_id: int
    trace_metadata: Optional[TraceMetadata] = None  # 👈 ДОБАВЛЯЕМ МЕТАДАННЫЕ ТРАССИРОВКИ
    success: bool = True
    error: Optional[str] = None


# Модель для логов диалогов
class DialogLog(BaseModel):
    id: Optional[int] = None
    agent_id: int
    sender: str
    user_message: str
    bot_response: List[str]
    intent: Optional[str] = None
    intent_confidence: Optional[float] = None
    entities: List[Dict[str, Any]] = []
    timestamp: str
    processing_time_ms: Optional[float] = None

    class Config:
        from_attributes = True


class DialogLogCreate(BaseModel):
    agent_id: int
    sender: str
    user_message: str
    bot_response: List[str]
    intent: Optional[str] = None
    intent_confidence: Optional[float] = None
    entities: List[Dict[str, Any]] = []
    processing_time_ms: Optional[float] = None