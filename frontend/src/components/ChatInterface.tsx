import React, { useState, useRef, useEffect } from 'react';
import { MessageResponse, agentAPI } from '../services/api';
import './css/ChatInterface.css';

/**
 * Интерфейс чата для общения с агентом
 * Отображает историю сообщений, позволяет отправлять новые сообщения
 * и показывает диагностическую информацию об обработке сообщений
 */
interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

interface DiagnosticData {
  intent?: string;
  confidence?: number;
  entities?: Array<{ entity: string; value: string; confidence: number }>;
  trace?: string[];
}

const ChatInterface: React.FC<{ agentId: number }> = ({ agentId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Прокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    // Добавляем сообщение пользователя
    const userMessage: ChatMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setDiagnosticData(null);

    try {
      // Отправляем сообщение через реальное API
      const response = await agentAPI.sendMessage(agentId, {
        message: inputText,
        sender: 'user'
      });

      // Добавляем ответ агента
      const agentMessage: ChatMessage = {
        id: Date.now() + 1,
        text: response.response.join('\n'),
        sender: 'agent',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, agentMessage]);
      
      // Устанавливаем реальные диагностические данные
      if (response.trace_metadata) {
        setDiagnosticData({
          intent: response.trace_metadata.intent?.name,
          confidence: response.trace_metadata.intent?.confidence,
          entities: response.trace_metadata.entities.map(entity => ({
            entity: entity.entity,
            value: entity.value,
            confidence: entity.confidence || 0
          }))
        });
      }
      
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      
      // Добавляем сообщение об ошибке
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        text: 'Ошибка при отправке сообщения. Пожалуйста, попробуйте еще раз.',
        sender: 'agent',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-main">
        {/* Кнопки управления */}
        <div className="action-buttons">
          <button className="btn btn-primary">Добавить агента</button>
          <button className="btn btn-secondary">Добавить сущность</button>
        </div>
        
        {/* Таблица сохраненных сущностей */}
        <div className="entities-table-container">
          <h3>Сохраненные сущности</h3>
          <div className="entities-info">
            <p>Сущности загружаются из конфигурации агента автоматически.</p>
            <p>Используйте NLU-редактор для управления сущностями.</p>
          </div>
        </div>
        
        <hr className="divider" />
        
        {/* Диагностика */}
        <div className="diagnostic-section">
          <h3>Диагностика</h3>
          {diagnosticData ? (
            <div className="diagnostic-content">
              {/* Интент и уверенность */}
              <div className="diagnostic-item">
                <div className="intent-confidence">
                  <span className="intent-label">Интент:</span>
                  <span className="intent-value">{diagnosticData.intent}</span>
                  <span className="confidence-label">Уверенность:</span>
                  <span className="confidence-value">{(diagnosticData.confidence || 0).toFixed(2)}</span>
                </div>
              </div>
              
              {/* Найденные сущности */}
              {diagnosticData.entities && diagnosticData.entities.length > 0 && (
                <div className="diagnostic-item">
                  <h4>Найденные сущности</h4>
                  <table className="entities-table">
                    <thead>
                      <tr>
                        <th>Сущность</th>
                        <th>Значение</th>
                        <th>Уверенность</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diagnosticData.entities.map((entity, index) => (
                        <tr key={index}>
                          <td>{entity.entity}</td>
                          <td>{entity.value}</td>
                          <td>{entity.confidence.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Трассировка */}
              {diagnosticData.trace && diagnosticData.trace.length > 0 && (
                <div className="diagnostic-item">
                  <h4>Трассировка</h4>
                  <ul className="trace-list">
                    {diagnosticData.trace.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="diagnostic-empty">
              Отправьте сообщение для получения диагностики
            </div>
          )}
        </div>
      </div>
      
      {/* Чат */}
      <div className="chat-container">
        <div className="chat-messages">
          {messages.map(message => (
            <div
              key={message.id}
              className={`message ${message.sender}`}
            >
              <div className="message-content">
                {message.text}
              </div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message agent">
              <div className="message-content typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="chat-input-container">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Начните чат..."
            disabled={isLoading}
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="send-button"
          >
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;