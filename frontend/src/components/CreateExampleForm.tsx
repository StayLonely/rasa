import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IntentCreate, agentAPI } from '../services/api';
import './css/CreateExampleForm.css';

interface CreateExampleFormProps {
  agentId: number;
  intentId: number;
  onBack: () => void;
}

const CreateExampleForm: React.FC<CreateExampleFormProps> = ({ agentId, intentId, onBack }) => {
  const queryClient = useQueryClient();
  
  const [exampleText, setExampleText] = useState('');
  
  const mutation = useMutation({
    mutationFn: (exampleData: { example: string }) => {
      // В реальной реализации здесь будет вызов API для добавления примера к интенту
      // Пока используем заглушку
      return Promise.resolve({ id: Date.now(), text: exampleData.example });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intents', agentId] });
      // Очистка формы
      setExampleText('');
    },
    onError: (error) => {
      console.error('Ошибка добавления примера:', error);
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    if (!exampleText.trim()) {
      alert('Пожалуйста, введите текст примера');
      return;
    }
    
    mutation.mutate({ example: exampleText.trim() });
  };
  
  return (
    <div className="create-example-form">
      <div className="form-header">
        <h2>Добавить пример фразы</h2>
        <button 
          className="btn btn-secondary"
          onClick={onBack}
        >
          Назад
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="example-form">
        <div className="form-group">
          <label htmlFor="example-text">Текст примера *</label>
          <textarea
            id="example-text"
            placeholder="Введите пример фразы пользователя..."
            value={exampleText}
            onChange={(e) => setExampleText(e.target.value)}
            rows={3}
            required
            disabled={mutation.isPending}
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Добавление...' : 'Добавить пример'}
          </button>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onBack}
            disabled={mutation.isPending}
          >
            Отмена
          </button>
        </div>
        
        {mutation.isError && (
          <div className="error-message">
            Ошибка при добавлении примера. Убедитесь, что бэкенд запущен.
          </div>
        )}
        
        {mutation.isSuccess && (
          <div className="success-message">
            Пример успешно добавлен!
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateExampleForm;