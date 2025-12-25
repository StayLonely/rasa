import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { agentAPI, AgentType } from '../services/api';
import './css/CreateAgentForm.css';

/**
 * Форма для создания новых агентов
 * Позволяет пользователю создать нового агента с указанием названия, описания и типа
 * Использует React Query для управления состоянием загрузки и ошибок при создании агента
 */
const CreateAgentForm: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [agentType, setAgentType] = useState<AgentType>(AgentType.FAQ);
  
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: agentAPI.createAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setName('');
      setDescription('');
    },
    onError: (error) => {
      console.error('Ошибка создания агента:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    mutation.mutate({ 
      name: name.trim(), 
      description: description.trim(), 
      agent_type: agentType 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="create-agent-form">
      <h2>Создать нового агента</h2>
      
      <div className="form-group">
        <label htmlFor="agent-name">Название агента *</label>
        <input
          id="agent-name"
          type="text"
          placeholder="Например: FAQ помощник по доставке"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={mutation.isPending}
        />
      </div>

      <div className="form-group">
        <label htmlFor="agent-description">Описание</label>
        <textarea
          id="agent-description"
          placeholder="Опишите назначение агента..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={mutation.isPending}
          rows={3}
        />
      </div>

      <div className="form-group">
        <label htmlFor="agent-type">Тип агента</label>
        <select 
          id="agent-type"
          value={agentType} 
          onChange={(e) => setAgentType(e.target.value as AgentType)}
          disabled={mutation.isPending}
        >
          <option value={AgentType.FAQ}>FAQ агент (вопрос-ответ)</option>
          <option value={AgentType.FORM}>Form агент (сбор данных)</option>
        </select>
      </div>

      <button 
        type="submit" 
        disabled={mutation.isPending || !name.trim()}
        className="submit-btn"
      >
        {mutation.isPending ? 'Создание...' : 'Создать агента'}
      </button>

      {mutation.isError && (
        <div className="error-message">
          Ошибка при создании агента. Убедитесь, что бэкенд запущен.
        </div>
      )}

      {mutation.isSuccess && (
        <div className="success-message">
          Агент успешно создан!
        </div>
      )}
    </form>
  );
};

export default CreateAgentForm;