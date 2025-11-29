from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from enum import Enum


class AgentType(str, Enum):
    FAQ = "faq"
    FORM = "form"


class AgentStatus(str, Enum):
    CREATED = "created"
    TRAINING = "training"
    READY = "ready"
    ERROR = "error"


class AgentBase(BaseModel):
    name: str
    description: str
    agent_type: AgentType


class AgentCreate(AgentBase):
    pass


class Agent(AgentBase):
    id: int
    status: AgentStatus = AgentStatus.CREATED
    config_path: Optional[str] = None
    domain_path: Optional[str] = None
    model_path: Optional[str] = None

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
    intent: Optional[str] = None
    entities: Optional[List[Dict]] = None