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