import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export enum AgentType {
  FAQ = "faq",
  FORM = "form"
}

export enum AgentStatus {
  CREATED = "created",
  TRAINING = "training", 
  READY = "ready",
  ERROR = "error"
}

export interface Agent {
  id: number;
  name: string;
  description: string;
  agent_type: AgentType;
  status: AgentStatus;
  config_path?: string;
  domain_path?: string;
  model_path?: string;
}

export interface AgentCreate {
  name: string;
  description: string;
  agent_type: AgentType;
  example_phrases?: string[];
}

export interface MessageRequest {
  message: string;
  sender?: string;
}

export interface MessageResponse {
  response: string[];
  agent_id: number;
  intent?: string;
  entities?: Array<{ entity: string; value: string; confidence: number }>;
}

// Интерфейсы для сущностей
export interface Entity {
  id: number;
  name: string;
  type: string;
  description?: string;
  regex_pattern?: string;
  lookup_values?: string[];
}

export interface EntityCreate {
  name: string;
  type: string;
  description?: string;
  regex_pattern?: string;
  lookup_values?: string[];
}

// Интерфейсы для интентов
export interface Intent {
  id: number;
  name: string;
  description?: string;
  examples: string[];
}

export interface IntentCreate {
  name: string;
  description?: string;
  examples: string[];
}

// Интерфейсы для диалогов
export interface DialogNode {
  id: string;
  type: 'intent' | 'action' | 'response' | 'condition' | 'redirect';
  content: string;
  position: { x: number; y: number };
  targetAgentId?: number; // Для узлов перенаправления
}

export interface DialogConnection {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface DialogStory {
  id: number;
  agentId: number;
  name: string;
  nodes: DialogNode[];
  connections: DialogConnection[];
}

// Временные моковые данные
let mockAgents: Agent[] = [
  {
    id: 1,
    name: "FAQ помощник",
    description: "Отвечает на частые вопросы о доставке",
    agent_type: AgentType.FAQ,
    status: AgentStatus.READY,
    config_path: "/configs/faq",
    domain_path: "/domains/faq",
    model_path: "/models/faq"
  },
  {
    id: 2,
    name: "Форма записи",
    description: "Собирает данные для записи на услуги",
    agent_type: AgentType.FORM,
    status: AgentStatus.TRAINING,
    config_path: "/configs/form",
    domain_path: "/domains/form",
    model_path: "/models/form"
  }
];


// Функции для работы с API
export const agentAPI = {
  getAgents: (): Promise<Agent[]> => {
    return api.get<Agent[]>('/agents').then(res => res.data);
  },
  
  getAgent: (id: number): Promise<Agent> => {
    return api.get<Agent>(`/agents/${id}`).then(res => res.data);
  },
  
  createAgent: (agentData: AgentCreate): Promise<Agent> => {
    return api.post<Agent>('/agents', agentData).then(res => res.data);
  },
  
  deleteAgent: (id: number): Promise<void> => {
    return api.delete(`/agents/${id}`).then(() => {});
  },
  
  trainAgent: (id: number): Promise<void> => {
    return api.post(`/agents/${id}/train`).then(() => {});
  },
  
  sendMessage: (id: number, message: MessageRequest): Promise<MessageResponse> => {
    return api.post<MessageResponse>(`/agents/${id}/message`, message).then(res => res.data);
  },
  
  // Функции для работы с сущностями
  getEntities: (agentId: number): Promise<Entity[]> => {
    return api.get<Entity[]>(`/agents/${agentId}/entities`).then(res => res.data);
  },
  
  createEntity: (agentId: number, entityData: EntityCreate): Promise<Entity> => {
    return api.post<Entity>(`/agents/${agentId}/entities`, entityData).then(res => res.data);
  },
  
  updateEntity: (agentId: number, entityId: number, entityData: EntityCreate): Promise<Entity> => {
    return api.put<Entity>(`/agents/${agentId}/entities/${entityId}`, entityData).then(res => res.data);
  },
  
  deleteEntity: (agentId: number, entityId: number): Promise<void> => {
    return api.delete(`/agents/${agentId}/entities/${entityId}`).then(() => {});
  },
  
  // Функции для работы с интентами
  getIntents: (agentId: number): Promise<Intent[]> => {
    return api.get<Intent[]>(`/agents/${agentId}/intents`).then(res => res.data);
  },
  
  createIntent: (agentId: number, intentData: IntentCreate): Promise<Intent> => {
    return api.post<Intent>(`/agents/${agentId}/intents`, intentData).then(res => res.data);
  },
  
  updateIntent: (agentId: number, intentId: number, intentData: IntentCreate): Promise<Intent> => {
    return api.put<Intent>(`/agents/${agentId}/intents/${intentId}`, intentData).then(res => res.data);
  },
  
  deleteIntent: (agentId: number, intentId: number): Promise<void> => {
    return api.delete(`/agents/${agentId}/intents/${intentId}`).then(() => {});
  },
};

// Функции для работы с диалогами
export const dialogAPI = {
  // Получение всех историй для агента
  getStories: (agentId: number): Promise<DialogStory[]> => {
    // Пока используем моковые данные
    return Promise.resolve([
      {
        id: 1,
        agentId: agentId,
        name: "Основной сценарий",
        nodes: [
          {
            id: "start",
            type: "intent",
            content: "Приветствие",
            position: { x: 100, y: 100 }
          },
          {
            id: "redirect-1",
            type: "redirect",
            content: "Перенаправление в поддержку",
            position: { x: 300, y: 200 },
            targetAgentId: 2
          }
        ],
        connections: [
          {
            id: "conn-1",
            sourceId: "start",
            targetId: "redirect-1"
          }
        ]
      }
    ]);
  },

  // Сохранение истории
  saveStory: (agentId: number, story: DialogStory): Promise<DialogStory> => {
    // Пока просто возвращаем переданный объект
    return Promise.resolve(story);
  },

  // Получение всех агентов для перенаправления
  getAvailableAgents: (): Promise<Agent[]> => {
    return api.get<Agent[]>('/agents').then(res => res.data);
  }
};

// Функция для проверки состояния API
export const healthCheck = (): Promise<{ status: string }> =>
  api.get('/health').then(res => res.data);
