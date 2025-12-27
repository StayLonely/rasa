import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { agentAPI, Agent } from '../services/api';
import CreateAgentForm from '../components/CreateAgentForm';
import CreateEntityFormSimple from '../components/CreateEntityFormSimple';

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
  
  // Состояние для управления отображением форм
  const [showCreateAgentForm, setShowCreateAgentForm] = useState(false);
  const [showCreateEntityForm, setShowCreateEntityForm] = useState(false);
  
  // Список сообщений в чате
  const [messages, setMessages] = useState([
    { id: 1, text: 'Привет! Я ваш чат-бот. Как я могу вам помочь?', sender: 'bot' },
    { id: 2, text: 'Здравствуйте! Я хотел бы узнать больше о ваших услугах.', sender: 'user' }
  ]);
  
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

  /**
   * Отправка сообщения в чат
   * Добавляет сообщение пользователя в список и симулирует ответ бота
   */
  const handleSendMessage = () => {
    // Проверяем, что сообщение не пустое
    if (inputValue.trim() === '') return;
    
    // Создаем новое сообщение от пользователя
    const newMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user' as 'user' | 'bot'
    };
    
    // Добавляем сообщение в список
    setMessages([...messages, newMessage]);
    
    // Очищаем поле ввода
    setInputValue('');
    
    // Симуляция ответа бота с задержкой
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: 'Это пример ответа бота. В реальной системе здесь будет ответ от AI агента.',
        sender: 'bot' as 'user' | 'bot'
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
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
  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
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
            <CreateEntityFormSimple />
          </div>
        </div>
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
                  <button
                    className="btn btn-secondary"
                    onClick={() => setSelectedAgent(null)}
                  >
                    Назад к списку
                  </button>
                </div>
                
                <div className="panel-section">
                  <h3>Интенты</h3>
                  <div className="intent-list">
                    <div className="intent-item">
                      <span>Приветствие</span>
                      <span className="intent-count">3 примера</span>
                    </div>
                    <div className="intent-item">
                      <span>Прощание</span>
                      <span className="intent-count">2 примера</span>
                    </div>
                  </div>
                </div>
                
                <div className="panel-section">
                  <h3>Сущности</h3>
                  <div className="entity-list">
                    <div className="entity-item">
                      <span>Имя пользователя</span>
                    </div>
                    <div className="entity-item">
                      <span>Номер телефона</span>
                    </div>
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