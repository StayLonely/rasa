import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { agentAPI, lifecycleAPI, Agent, Intent, Entity } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';
import CreateAgentForm from '../components/CreateAgentForm';
import CreateEntityFormSimple from '../components/CreateEntityFormSimple';
import NLUEditor from '../components/NLUEditor';
import DialogLogsViewer from '../components/DialogLogsViewer';

import './css/MainChatInterface.css';

/**
 * Главный интерфейс чата с агентами
 * Отображает список агентов, позволяет создавать новых агентов,
 * вести диалог с выбранным агентом и показывает диагностическую информацию
 *
 * Состоит из трех основных панелей:
 * 1. Левая панель управления - для создания и выбора агентов, управления интентами и сущностями
 * 2. Центральная область чата - для общения с выбранным агентом
 * 3. Правая панель диагностики - для отображения интентов, сущностей и трассировки
 */
const MainChatInterface: React.FC = () => {
  const navigate = useNavigate();
  
  // Состояние для управления видимостью левой панели
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  
  // Выбранный агент для общения
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const queryClient = useQueryClient();
  
  // Состояние для управления отображением форм
  const [showCreateAgentForm, setShowCreateAgentForm] = useState(false);
  const [showCreateEntityForm, setShowCreateEntityForm] = useState(false);
  
  // Список сообщений в чате
  const [messages, setMessages] = useState<Array<{id: number, text: string, sender: 'user' | 'bot'}>>([]);
  
  // Текст в поле ввода сообщения
  const [inputValue, setInputValue] = useState('');
  
  // Диагностические данные для отображения
  const [diagnosticData, setDiagnosticData] = useState({
    intent: 'greeting',
    confidence: 0.95,
    entities: [
      { name: 'name', value: 'Иван', confidence: 0.87 }
    ]
  });

  // Получение списка агентов с помощью React Query
  const { data: agents, isLoading, error } = useQuery({
    queryKey: ['agents'],
    queryFn: agentAPI.getAgents,
  });
  
  // Получение интентов выбранного агента
  const { data: intents = [] } = useQuery({
    queryKey: ['intents', selectedAgent?.id],
    queryFn: () => selectedAgent ? agentAPI.getIntents(selectedAgent.id) : Promise.resolve([]),
    enabled: !!selectedAgent,
  });
  
  // Получение сущностей выбранного агента
  const { data: entities = [] } = useQuery({
    queryKey: ['entities', selectedAgent?.id],
    queryFn: () => selectedAgent ? agentAPI.getEntities(selectedAgent.id) : Promise.resolve([]),
    enabled: !!selectedAgent,
  });

  /**
   * Отправка сообщения в чат
   * Добавляет сообщение пользователя в список и симулирует ответ бота
   */
  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user' as 'user' | 'bot'
    };

    // Добавляем сообщение пользователя сразу в UI
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Если агент не выбран — оставляем локальную симуляцию
    if (!selectedAgent) {
      setTimeout(() => {
        const botResponse = {
          id: Date.now() + 1,
          text: 'Это пример ответа бота. В реальной системе здесь будет ответ от AI агента.',
          sender: 'bot' as 'user' | 'bot'
        };
        setMessages(prev => [...prev, botResponse]);
      }, 800);
      return;
    }

    try {
      const resp = await agentAPI.sendMessage(selectedAgent.id, { message: inputValue, sender: 'user' });

      // resp.response обычно массив строк — приводим к массиву и отображаем
      const responses: string[] = Array.isArray(resp?.response) ? resp.response : (resp?.response ? [String(resp.response)] : []);
      if (responses.length > 0) {
        const botMsgs = responses.map((text, idx) => ({
          id: Date.now() + idx + 2,
          text,
          sender: 'bot' as 'user' | 'bot'
        }));
        setMessages(prev => [...prev, ...botMsgs]);
      }

      // Обновляем диагностические данные из trace_metadata если есть
      try {
        console.debug('sendMessage resp', resp);
        const trace = (resp as any).trace_metadata || (resp as any).trace || null;
        if (trace) {
          const intent = trace.intent && trace.intent.name ? trace.intent.name : diagnosticData.intent;
          const confidence = trace.intent && trace.intent.confidence ? trace.intent.confidence : (trace.confidence || diagnosticData.confidence);
          const entities = (trace.entities || []).map((e: any) => ({ name: e.entity || e.name || 'unknown', value: e.value || '', confidence: e.confidence || 0 }));
          setDiagnosticData({ intent, confidence, entities });
        }
      } catch (e) {
        console.warn('Failed to parse trace metadata', e);
      }
    } catch (err) {
      // Пытаемся показать детальную ошибку сервера
      let detailMsg = 'Ошибка при отправке сообщения на сервер.';
      try {
        const anyErr = err as any;
        detailMsg = anyErr?.detail || anyErr?.message || (typeof anyErr === 'string' ? anyErr : JSON.stringify(anyErr));
      } catch (e) {
        // noop
      }
      setMessages(prev => [...prev, { id: Date.now() + 2, text: detailMsg, sender: 'bot' as 'user' | 'bot' }]);
      console.error('sendMessage error', err);
    }
  };

  /**
   * Обработчик нажатия клавиш в поле ввода
   * Отправляет сообщение при нажатии Enter (без Shift)
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Выбор агента для общения
   * @param agent - выбранный агент
   */
  const handleSelectAgent = async (agent: Agent) => {
    try {
      const fresh = await agentAPI.getAgent(agent.id);
      setSelectedAgent(fresh);
    } catch (e) {
      console.error('getAgent error', e);
      setSelectedAgent(agent);
    }
  };

  const handleDeleteAgent = async (agentId: number) => {
    if (!window.confirm('Удалить агента? Это действие нельзя отменить.')) return;
    try {
      await agentAPI.deleteAgent(agentId);
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      if (selectedAgent && selectedAgent.id === agentId) setSelectedAgent(null);
    } catch (e) {
      console.error('deleteAgent error', e);
      alert('Ошибка удаления агента');
    }
  };

  const handleStopAgent = async (agentId: number) => {
    try {
      await lifecycleAPI.stopAgent(agentId);
      // refresh agents
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      if (selectedAgent && selectedAgent.id === agentId) {
        const fresh = await agentAPI.getAgent(agentId);
        setSelectedAgent(fresh);
      }
    } catch (e) {
      console.error('stopAgent error', e);
      alert('Ошибка остановки агента');
    }
  };

  // Состояние для отображения процесса тренировки
  const [isTraining, setIsTraining] = useState(false);
  const [showNLUEditor, setShowNLUEditor] = useState(false);
  const [showLogsViewer, setShowLogsViewer] = useState(false);

  // Запустить тренировку агента и опрашивать статус
  const handleTrainAgent = async () => {
    if (!selectedAgent) return;
    try {
      setIsTraining(true);
      await agentAPI.trainAgent(selectedAgent.id);

      // Пытаемся опрашивать статус агента до 20 раз (макс ~20s)
      for (let i = 0; i < 20; i++) {
        const fresh = await agentAPI.getAgent(selectedAgent.id);
        // обновляем локально выбранного агента
        setSelectedAgent(fresh);
        if (fresh.status !== 'training') {
          break;
        }
        await new Promise(res => setTimeout(res, 1000));
      }
    } catch (e) {
      console.error('train error', e);
    } finally {
      setIsTraining(false);
    }
  };

  /**
   * Обработчик успешного создания агента
   * Список агентов обновится автоматически благодаря React Query
   */
  const handleCreateAgentSuccess = () => {
    // Обновление списка агентов произойдет автоматически благодаря useQuery
  };

  return (
    <div className="main-chat-interface">
      {/* Модальное окно для формы создания агента */}
      {showCreateAgentForm && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateAgentForm(false);
            }
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h2>Создать нового агента</h2>
              <button
                className="close-button"
                onClick={() => setShowCreateAgentForm(false)}
              >
                ×
              </button>
            </div>
            <CreateAgentForm />
          </div>
        </div>
      )}
      
      {/* Модальное окно для формы создания сущности */}
      {showCreateEntityForm && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateEntityForm(false);
            }
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h2>Создать новую сущность</h2>
              <button
                className="close-button"
                onClick={() => setShowCreateEntityForm(false)}
              >
                ×
              </button>
            </div>
            <CreateEntityFormSimple agentId={selectedAgent ? selectedAgent.id : null} />
          </div>
        </div>
      )}

      {/** NLU editor modal **/}
      {selectedAgent && (
        <>
          {/** show button in left panel (already added) - modal here **/}
        </>
      )}
      
      {/* Левая панель управления */}
      <div className={`left-panel ${isLeftPanelOpen ? 'open' : 'collapsed'}`}>
        <div className="panel-header">
          <h2>Управление</h2>
          <button
            className="toggle-panel-btn"
            onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          >
            {isLeftPanelOpen ? '◀' : '▶'}
          </button>
        </div>
        
        {isLeftPanelOpen && (
          <div className="panel-content">
            {!selectedAgent ? (
              <>
                <div className="panel-section">
                  <h3>Действия</h3>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateAgentForm(true)}
                  >
                    Создать агента
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowCreateEntityForm(true)}
                  >
                    Создать сущность
                  </button>
                </div>
                
                <div className="panel-section">
                  <h3>Список агентов</h3>
                  {isLoading ? (
                    <div className="loading">Загрузка агентов...</div>
                  ) : error ? (
                    <div className="error">Ошибка загрузки агентов</div>
                  ) : agents && agents.length > 0 ? (
                    <div className="agent-list">
                      {agents.map(agent => (
                        <div key={agent.id} className="agent-item">
                          <span>{agent.name}</span>
                          <div className="agent-actions">
                            <button
                              className="btn btn-primary btn-small"
                              onClick={() => handleSelectAgent(agent)}
                            >
                              Выбрать
                            </button>
                            <button
                              className="btn btn-secondary btn-small"
                              onClick={() => handleStopAgent(agent.id)}
                            >
                              Stop
                            </button>
                            <button
                              className="btn btn-danger btn-small"
                              onClick={() => handleDeleteAgent(agent.id)}
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>Агентов пока нет. Создайте первого агента!</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="panel-section">
                  <h3>Выбранный агент: {selectedAgent.name}</h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setSelectedAgent(null)}
                    >
                      Назад к списку
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleTrainAgent}
                      disabled={isTraining}
                    >
                      {isTraining ? 'Тренировка...' : 'Train'}
                    </button>
                    <span style={{ marginLeft: 8 }}>
                      Статус: {selectedAgent.status}
                    </span>
                    <button className="btn btn-secondary" onClick={() => setShowNLUEditor(true)}>NLU</button>
                    <button className="btn btn-secondary" onClick={() => setShowLogsViewer(true)}>Логи</button>
                  </div>
                </div>
                
                <div className="panel-section">
                  <h3>Интенты</h3>
                  <div className="intent-list">
                    {intents.length > 0 ? (
                      intents.map(intent => (
                        <div key={intent.id} className="intent-item">
                          <span>{intent.name}</span>
                          <span className="intent-count">{intent.examples.length} примера</span>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">Интентов пока нет</div>
                    )}
                  </div>
                </div>
                
                <div className="panel-section">
                  <h3>Сущности</h3>
                  <div className="entity-list">
                    {entities.length > 0 ? (
                      entities.map(entity => (
                        <div key={entity.id} className="entity-item">
                          <span>{entity.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">Сущностей пока нет</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Основная область чата */}
      <div className="chat-area">
        <div className="chat-header">
          <h2>{selectedAgent ? `Чат с ${selectedAgent.name}` : 'Выберите агента для начала общения'}</h2>
        </div>
        
        {selectedAgent ? (
          <>
            <div className="chat-messages">
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.sender}`}>
                  <div className="message-content">
                    {message.text}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="chat-input-area">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Введите сообщение..."
                rows={3}
              />
              <button
                className="send-button"
                onClick={handleSendMessage}
                disabled={inputValue.trim() === ''}
              >
                Отправить
              </button>
            </div>
          </>
        ) : (
          <div className="chat-placeholder">
            <p>Выберите и/или создайте агента для начала общения</p>
          </div>
        )}
      </div>

      {showNLUEditor && selectedAgent && (
        <NLUEditor agentId={selectedAgent.id} onClose={() => setShowNLUEditor(false)} />
      )}
      
      {showLogsViewer && selectedAgent && (
        <DialogLogsViewer agent={selectedAgent} onClose={() => setShowLogsViewer(false)} />
      )}
      
      {/* Панель диагностики */}
      <div className="diagnostic-panel">
        <div className="panel-header">
          <h2>Диагностика</h2>
        </div>
        
        <div className="diagnostic-content">
          <div className="diagnostic-section">
            <h3>Определенный интент</h3>
            <div className="intent-info">
              <span className="intent-name">{diagnosticData.intent}</span>
              <span className="confidence">({(diagnosticData.confidence * 100).toFixed(0)}%)</span>
            </div>
          </div>
          
          <div className="diagnostic-section">
            <h3>Найденные сущности</h3>
            <div className="entities-list">
              {diagnosticData.entities.map((entity, index) => (
                <div key={index} className="entity-info">
                  <span className="entity-name">{entity.name}:</span>
                  <span className="entity-value">{entity.value}</span>
                  <span className="confidence">({(entity.confidence * 100).toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="diagnostic-section">
            <h3>Трассировка</h3>
            <div className="trace-info">
              <div className="trace-item">
                <span className="trace-label">Шаг 1:</span>
                <span className="trace-value">Определение интента</span>
              </div>
              <div className="trace-item">
                <span className="trace-label">Шаг 2:</span>
                <span className="trace-value">Извлечение сущностей</span>
              </div>
              <div className="trace-item">
                <span className="trace-label">Шаг 3:</span>
                <span className="trace-value">Формирование ответа</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainChatInterface;