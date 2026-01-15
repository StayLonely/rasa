import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { logsAPI, Agent } from '../services/api';
import './css/DialogLogsViewer.css';

interface DialogLog {
  id: number;
  agent_id: number;
  user_message: string;
  bot_response: string[];
  intent: string;
  confidence: number;
  entities: Array<{entity: string, value: string, confidence: number}>;
  timestamp: string;
}

interface DialogLogsViewerProps {
  agent: Agent;
  onClose: () => void;
}

const DialogLogsViewer: React.FC<DialogLogsViewerProps> = ({ agent, onClose }) => {
  const [selectedLog, setSelectedLog] = useState<DialogLog | null>(null);
  const [filterIntent, setFilterIntent] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');

  // Загрузка логов
  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ['dialog-logs', agent.id],
    queryFn: () => logsAPI.getLogs(agent.id),
  });

  // Получение уникальных интентов для фильтра
  const uniqueIntents = Array.from(new Set(logs.map((log: any) => log.intent)));

  // Фильтрация логов
  const filteredLogs = logs.filter((log: any) => {
    const matchesIntent = filterIntent === 'all' || log.intent === filterIntent;
    const matchesDate = !filterDate || log.timestamp.startsWith(filterDate);
    return matchesIntent && matchesDate;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const formatConfidence = (confidence: number) => {
    return (confidence * 100).toFixed(1) + '%';
  };

  if (isLoading) {
    return (
      <div className="dialog-logs-viewer">
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Логи диалогов - {agent.name}</h2>
              <button className="close-button" onClick={onClose}>×</button>
            </div>
            <div className="loading">Загрузка логов...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dialog-logs-viewer">
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Логи диалогов - {agent.name}</h2>
              <button className="close-button" onClick={onClose}>×</button>
            </div>
            <div className="error">Ошибка загрузки логов</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dialog-logs-viewer">
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Логи диалогов - {agent.name}</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          
          {/* Фильтры */}
          <div className="filters-section">
            <div className="filter-group">
              <label>Фильтр по интенту:</label>
              <select 
                value={filterIntent} 
                onChange={(e) => setFilterIntent(e.target.value)}
              >
                <option value="all">Все интенты</option>
                {uniqueIntents.map(intent => (
                  <option key={intent} value={intent}>{intent}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Фильтр по дате:</label>
              <input 
                type="date" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setFilterIntent('all');
                setFilterDate('');
              }}
            >
              Сбросить фильтры
            </button>
          </div>
          
          <div className="logs-layout">
            {/* Список логов */}
            <div className="logs-list">
              <h3>Диалоги ({filteredLogs.length})</h3>
              {filteredLogs.length === 0 ? (
                <div className="empty-state">Нет записей диалогов</div>
              ) : (
                <div className="logs-items">
                  {filteredLogs.map((log: any) => (
                    <div 
                      key={log.id}
                      className={`log-item ${selectedLog?.id === log.id ? 'selected' : ''}`}
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className="log-preview">
                        <div className="log-user-message">
                          <strong>User:</strong> {log.user_message.substring(0, 50)}...
                        </div>
                        <div className="log-timestamp">
                          {formatDate(log.timestamp)}
                        </div>
                        <div className="log-intent">
                          <span className="intent-tag">{log.intent}</span>
                          <span className="confidence-tag">{formatConfidence(log.confidence)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Детали выбранного лога */}
            <div className="log-details">
              {selectedLog ? (
                <>
                  <h3>Детали диалога</h3>
                  
                  <div className="detail-section">
                    <h4>Сообщение пользователя</h4>
                    <div className="message-content user-message">
                      {selectedLog.user_message}
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Ответ агента</h4>
                    <div className="message-content bot-response">
                      {Array.isArray(selectedLog.bot_response) 
                        ? selectedLog.bot_response.join('\n')
                        : selectedLog.bot_response}
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Распознанный интент</h4>
                    <div className="intent-info">
                      <span className="intent-name">{selectedLog.intent}</span>
                      <span className="confidence">Уверенность: {formatConfidence(selectedLog.confidence)}</span>
                    </div>
                  </div>
                  
                  {selectedLog.entities && selectedLog.entities.length > 0 && (
                    <div className="detail-section">
                      <h4>Найденные сущности</h4>
                      <div className="entities-list">
                        {selectedLog.entities.map((entity: any, index: number) => (
                          <div key={index} className="entity-item">
                            <span className="entity-name">{entity.entity}:</span>
                            <span className="entity-value">{entity.value}</span>
                            <span className="entity-confidence">{formatConfidence(entity.confidence)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="detail-section">
                    <h4>Временная метка</h4>
                    <div className="timestamp-info">
                      {formatDate(selectedLog.timestamp)}
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-details">
                  Выберите диалог для просмотра деталей
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DialogLogsViewer;