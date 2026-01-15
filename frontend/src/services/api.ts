import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Утилита для унифицированной обработки ответов и ошибок
const handle = async <T>(p: Promise<any>): Promise<T> => {
  try {
    const res = await p;
    return res.data as T;
  } catch (err: any) {
    // Логирование для отладки
    if (err?.response) {
      console.error('API error', err.response.status, err.response.data);
      // пробрасываем тело ошибки если есть
      throw err.response.data || { status: err.response.status, message: err.message };
    }
    console.error('API network error', err);
    throw err;
  }
};

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

export interface TraceMetadata {
  intent?: {
    name: string;
    confidence: number;
  };
  entities: Array<{
    entity: string;
    value: string;
    confidence?: number;
    start?: number;
    end?: number;
  }>;
  timestamp: string;
  confidence?: number;
  text: string;
}

export interface MessageResponse {
  response: string[];
  agent_id: number;
  trace_metadata?: TraceMetadata;
  intent?: string;
  entities?: Array<{ entity: string; value: string; confidence: number }>;
  success?: boolean;
  error?: string;
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
    return handle<MessageResponse>(api.post(`/agents/${id}/message`, message));
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
    return handle<Intent[]>(api.get(`/agents/${agentId}/intents`));
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

// Методы для работы с NLU (GET/PUT)
export const nluAPI = {
  getNLU: (agentId: number): Promise<any> => {
    return handle<any>(api.get(`/agents/${agentId}/nlu`));
  },
  updateNLU: (agentId: number, nluData: any): Promise<any> => {
    return handle<any>(api.put(`/agents/${agentId}/nlu`, { nlu_data: nluData }));
  }
};

// Методы для логов и трассировки
export const logsAPI = {
  getLogs: (agentId: number, params?: Record<string, any>): Promise<any[]> => {
    return handle<any[]>(api.get(`/agents/${agentId}/logs`, { params }));
  },
  getStatistics: (agentId: number): Promise<any> => {
    return handle<any>(api.get(`/agents/${agentId}/logs/statistics`));
  },
  getIntents: (agentId: number): Promise<any> => {
    return handle<any>(api.get(`/agents/${agentId}/logs/intents`));
  },
  getLogById: (agentId: number, logId: number): Promise<any> => {
    return handle<any>(api.get(`/agents/${agentId}/logs/${logId}`));
  },
  clearLogs: (agentId: number): Promise<void> => {
    return handle<void>(api.delete(`/agents/${agentId}/logs/`));
  }
};

// Agent lifecycle
export const lifecycleAPI = {
  stopAgent: (agentId: number): Promise<any> => handle<any>(api.post(`/agents/${agentId}/stop`)),
};

// Функции для работы с диалогами
export const dialogAPI = {
  // Получение всех историй для агента
  getStories: (agentId: number): Promise<DialogStory[]> => {
    // Используем логи диалогов в качестве историй (упрощенно)
    return logsAPI.getLogs(agentId).then(logs => {
      // Преобразуем каждый лог в простую историю
      const stories: DialogStory[] = logs.map((log, idx) => ({
        id: idx + 1,
        agentId,
        name: `Log ${log.id}`,
        nodes: [
          { id: `u-${log.id}`, type: 'intent', content: log.user_message, position: { x: 100, y: 100 } },
          { id: `b-${log.id}`, type: 'response', content: (log.bot_response || []).join('\n'), position: { x: 300, y: 200 } }
        ],
        connections: [ { id: `c-${log.id}`, sourceId: `u-${log.id}`, targetId: `b-${log.id}` } ]
      }));
      return stories;
    });
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
