import React, { useState, useRef, useEffect } from 'react';
import { MessageResponse } from '../services/api';
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
}

const ChatInterface: React.FC<{ agentId: number }> = ({ agentId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: "Здравствуйте! Я ваш виртуальный помощник. Чем могу помочь?",
      sender: 'agent',
      timestamp: new Date()
    }
  ]);
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

    // Имитация задержки для ответа агента
    setTimeout(() => {
      // Моковые диагностические данные
      const mockDiagnosticData: DiagnosticData = {
        intent: inputText.toLowerCase().includes('привет') ? 'greeting' :
               inputText.toLowerCase().includes('пока') ? 'goodbye' : 'info_request',
        confidence: 0.85 + Math.random() * 0.15,
        entities: inputText.includes('@') ? [
          { entity: 'email', value: 'test@example.com', confidence: 0.92 }
        ] : inputText.match(/\d+/) ? [
          { entity: 'number', value: inputText.match(/\d+/)![0], confidence: 0.88 }
        ] : undefined
      };

      // Моковый ответ агента
      const mockResponse: MessageResponse = {
        response: [
          inputText.toLowerCase().includes('привет') ? "Здравствуйте! Рад вас видеть!" :
          inputText.toLowerCase().includes('пока') ? "До свидания! Всего хорошего!" :
          "Спасибо за ваше сообщение. Я постараюсь помочь вам с этим вопросом."
        ],
        agent_id: agentId,
        intent: mockDiagnosticData.intent,
        entities: mockDiagnosticData.entities
      };

      // Добавляем ответ агента
      const agentMessage: ChatMessage = {
        id: Date.now() + 1,
        text: mockResponse.response.join('\n'),
        sender: 'agent',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, agentMessage]);
      
      // Устанавливаем диагностические данные
      setDiagnosticData({
        intent: mockResponse.intent,
        confidence: mockDiagnosticData.confidence,
        entities: mockResponse.entities
      });
      
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-interface">
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
            placeholder="Введите сообщение..."
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
      
      <div className="diagnostic-panel">
        <h3>Диагностика</h3>
        {diagnosticData ? (
          <div className="diagnostic-content">
            <div className="diagnostic-item">
              <strong>Интент:</strong> {diagnosticData.intent}
            </div>
            <div className="diagnostic-item">
              <strong>Уверенность:</strong> {(diagnosticData.confidence || 0).toFixed(2)}
            </div>
            {diagnosticData.entities && diagnosticData.entities.length > 0 && (
              <div className="diagnostic-item">
                <strong>Сущности:</strong>
                <ul>
                  {diagnosticData.entities.map((entity, index) => (
                    <li key={index}>
                      {entity.entity}: {entity.value} ({entity.confidence.toFixed(2)})
                    </li>
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
  );
};

export default ChatInterface;

export {};