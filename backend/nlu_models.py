from pydantic import BaseModel, Field, validator
from typing import List, Optional
import re


class EntityExample(BaseModel):
    value: str
    entity: str
    start: int
    end: int


class IntentExample(BaseModel):
    text: str
    entities: List[EntityExample] = []


class Intent(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, pattern=r'^[a-zA-Z_][a-zA-Z0-9_]*$')
    examples: List[IntentExample] = Field(..., min_items=2)

    @validator('name')
    def validate_name(cls, v):
        if not v.replace('_', '').isalnum():
            raise ValueError('Intent name must contain only letters, numbers and underscores')
        return v

    @validator('examples')
    def validate_examples(cls, v):
        if len(v) < 2:
            raise ValueError('Intent must have at least 2 examples')
        return v


class Entity(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, pattern=r'^[a-zA-Z_][a-zA-Z0-9_]*$')
    examples: List[str] = Field(..., min_items=1)

    @validator('name')
    def validate_name(cls, v):
        if not v.replace('_', '').isalnum():
            raise ValueError('Entity name must contain only letters, numbers and underscores')
        return v


class NLUData(BaseModel):
    intents: List[Intent] = []
    entities: List[Entity] = []

    @validator('intents')
    def validate_unique_intents(cls, v):
        names = [intent.name for intent in v]
        if len(names) != len(set(names)):
            raise ValueError('Intent names must be unique')
        return v

    @validator('entities')
    def validate_unique_entities(cls, v):
        names = [entity.name for entity in v]
        if len(names) != len(set(names)):
            raise ValueError('Entity names must be unique')
        return v


class NLUUpdateRequest(BaseModel):
    nlu_data: NLUData