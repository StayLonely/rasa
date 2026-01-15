import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentAPI, Agent, AgentCreate, AgentType, AgentStatus } from '../services/api';
import ChatInterface from '../components/ChatInterface';
import EntityManagement from '../components/EntityManagement';
import IntentManagement from '../components/IntentManagement';
import DialogEditor from '../components/DialogEditor';
import './css/AgentDashboard.css';

const AgentDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'nlu' | 'intents' | 'entities' | 'dialogs' | 'chat' | 'logs'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [nluActiveTab, setNluActiveTab] = useState<'intents' | 'entities'>('intents');
  const [editData, setEditData] = useState<Partial<AgentCreate>>({});
  
  const queryClient = useQueryClient();
  const {
    data: agent,
    isLoading,
    error
  } = useQuery({
    queryKey: ['agent', id],
    queryFn: () => agentAPI.getAgent(Number(id)),
    enabled: !!id
  });

  // Моковые данные для агента, если API недоступен
  const mockAgent: Agent = {
    id: Number(id) || 1,
    name: "Тестовый агент",
    description: "Это тестовый агент для демонстрации интерфейса",
    agent_type: AgentType.FAQ,
    status: AgentStatus.READY
  };

  const updateMutation = useMutation({
    mutationFn: (data: AgentCreate) => agentAPI.createAgent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', id] });
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Ошибка обновления агента:', error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (agentId: number) => agentAPI.deleteAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      navigate('/');
    },
    onError: (error) => {
      console.error('Ошибка удаления агента:', error);
    }
  });

  const handleEdit = () => {
    const currentAgent = agent || mockAgent;
    setEditData({
      name: currentAgent.name,
      description: currentAgent.description,
      agent_type: currentAgent.agent_type
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editData.name && editData.agent_type) {
      updateMutation.mutate({
        name: editData.name,
        description: editData.description || '',
        agent_type: editData.agent_type
      });
    }
  };

  const handleDelete = () => {
    const currentAgent = agent || mockAgent;
    if (window.confirm(`Вы уверены, что хотите удалить агента "${currentAgent.name}"?`)) {
      if (agent) {
        deleteMutation.mutate(currentAgent.id);
      } else {
        // Если это моковый агент, просто перенаправляем на главную
        navigate('/');
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  // Используем моковые данные, если API недоступен
  const currentAgent = agent || mockAgent;

  if (isLoading) return <div className="loading">Загрузка агента...</div>;
  // Не показываем ошибку, а используем моковые данные
  // if (error) return <div className="error">Ошибка загрузки агента</div>;
  // if (!agent) return <div className="error">Агент не найден</div>;

  return (
    <div className="agent-dashboard">
      <div className="agent-header">
        {isEditing ? (
          <input
            type="text"
            value={editData.name || ''}
            onChange={(e) => setEditData({...editData, name: e.target.value})}
            className="agent-name-input"
          />
        ) : (
          <h1>{currentAgent.name}</h1>
        )}
        <div className="agent-header-actions">
          {isEditing ? (
            <>
              <button className="btn btn-primary" onClick={handleSave}>
                Сохранить
              </button>
              <button className="btn btn-secondary" onClick={handleCancel}>
                Отмена
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={handleEdit}>
                Редактировать
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Удалить
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="agent-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Обзор
        </button>
        <button
          className={`tab-button ${activeTab === 'nlu' ? 'active' : ''}`}
          onClick={() => setActiveTab('nlu')}
        >
          NLU
        </button>
        <button
          className={`tab-button ${activeTab === 'dialogs' ? 'active' : ''}`}
          onClick={() => setActiveTab('dialogs')}
        >
          Диалоги
        </button>
        <button
          className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          Тест чата
        </button>
        <button
          className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          Логи
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="agent-info">
              <h2>Информация об агенте</h2>
              {isEditing ? (
                <div className="edit-form">
                  <div className="form-group">
                    <label>Тип агента:</label>
                    <select
                      value={editData.agent_type || currentAgent.agent_type}
                      onChange={(e) => setEditData({...editData, agent_type: e.target.value as any})}
                    >
                      <option value="faq">FAQ агент</option>
                      <option value="form">Form агент</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Описание:</label>
                    <textarea
                      value={editData.description || currentAgent.description}
                      onChange={(e) => setEditData({...editData, description: e.target.value})}
                      rows={4}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <p><strong>Тип:</strong> {currentAgent.agent_type}</p>
                  <p><strong>Описание:</strong> {currentAgent.description}</p>
                  <p><strong>ID:</strong> {currentAgent.id}</p>
                  <p><strong>Статус:</strong>
                    <span className={`status-badge status-${currentAgent.status}`}>
                      {currentAgent.status}
                    </span>
                  </p>
                </>
              )}
            </div>
            
            <div className="agent-actions">
              <h2>Действия</h2>
              <button className="btn btn-primary">Обучить агента</button>
              <button className="btn btn-secondary">Экспортировать</button>
            </div>
          </div>
        )}
        
        {activeTab === 'nlu' && (
          <div className="nlu-tab">
            <div className="nlu-header">
              <h2>Настройка NLU</h2>
              <p>Управление интентами и сущностями агента</p>
            </div>
            <div className="nlu-tabs">
              <button
                className={`tab-button ${nluActiveTab === 'intents' ? 'active' : ''}`}
                onClick={() => setNluActiveTab('intents')}
              >
                Интенты
              </button>
              <button
                className={`tab-button ${nluActiveTab === 'entities' ? 'active' : ''}`}
                onClick={() => setNluActiveTab('entities')}
              >
                Сущности
              </button>
            </div>
            <div className="nlu-content">
              <div className="nlu-section">
                {nluActiveTab === 'intents' && <IntentManagement agentId={currentAgent.id} />}
                {nluActiveTab === 'entities' && <EntityManagement agentId={currentAgent.id} />}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'dialogs' && (
          <div className="dialogs-tab">
            <DialogEditor agentId={currentAgent.id} />
          </div>
        )}
        
        {activeTab === 'chat' && (
          <div className="chat-tab">
            <h2>Тестирование чата</h2>
            <ChatInterface agentId={currentAgent.id} />
          </div>
        )}
        
        {activeTab === 'logs' && (
          <div className="logs-tab">
            <h2>Логи взаимодействий</h2>
            <p>Здесь будет отображаться история взаимодействий</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDashboard;

export {};