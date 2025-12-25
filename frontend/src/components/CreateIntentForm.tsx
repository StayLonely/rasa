import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IntentCreate, agentAPI } from '../services/api';
import './css/CreateIntentForm.css';

interface CreateIntentFormProps {
  agentId: number;
  onBack: () => void;
}

const CreateIntentForm: React.FC<CreateIntentFormProps> = ({ agentId, onBack }) => {
  const queryClient = useQueryClient();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [examples, setExamples] = useState<string[]>(['']);
  
  const mutation = useMutation({
    mutationFn: (intentData: IntentCreate) => agentAPI.createIntent(agentId, intentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intents', agentId] });
      // Очистка формы
      setName('');
      setDescription('');
      setExamples(['']);
    },
    onError: (error: any) => {
      console.error('Ошибка создания интента:', error);
      // Проверка на уникальность имени интента
      if (error.response?.status === 400) {
        alert('Интент с таким именем уже существует. Пожалуйста, выберите другое имя.');
      } else {
        alert('Ошибка при создании интента. Пожалуйста, попробуйте еще раз.');
      }
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    if (!name.trim()) {
      alert('Пожалуйста, введите название интента');
      return;
    }
    
    const filteredExamples = examples.filter(ex => ex.trim() !== '');
    if (filteredExamples.length < 3) {
      alert('Пожалуйста, добавьте минимум 3 примера фраз');
      return;
    }
    
    // Создание объекта интента
    const intentData: IntentCreate = {
      name: name.trim(),
      description: description.trim(),
      examples: filteredExamples
    };
    
    mutation.mutate(intentData);
  };
  
  const addExample = () => {
    setExamples([...examples, '']);
  };
  
  const removeExample = (index: number) => {
    if (examples.length > 1) {
      const newExamples = [...examples];
      newExamples.splice(index, 1);
      setExamples(newExamples);
    }
  };
  
  const updateExample = (index: number, value: string) => {
    const newExamples = [...examples];
    newExamples[index] = value;
    setExamples(newExamples);
  };
  
  return (
    <div className="create-intent-form">
      <div className="form-header">
        <h2>Создать новый интент</h2>
        <button
          className="btn btn-secondary"
          onClick={onBack}
        >
          Назад
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="intent-form">
        <div className="form-group">
          <label htmlFor="intent-name">Название интента *</label>
          <input
            id="intent-name"
            type="text"
            placeholder="Например: приветствие, заказ, вопрос"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={mutation.isPending}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="intent-description">Описание</label>
          <textarea
            id="intent-description"
            placeholder="Опишите назначение интента..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            disabled={mutation.isPending}
          />
        </div>
        
        <div className="form-group">
          <label>Примеры фраз *</label>
          <div className="examples-input">
            {examples.map((example, index) => (
              <div key={index} className="example-input-group">
                <input
                  type="text"
                  value={example}
                  onChange={(e) => updateExample(index, e.target.value)}
                  placeholder={`Пример фразы ${index + 1}`}
                  disabled={mutation.isPending}
                />
                {examples.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-danger btn-small"
                    onClick={() => removeExample(index)}
                    disabled={mutation.isPending}
                  >
                    -
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={addExample}
              disabled={mutation.isPending}
            >
              + Добавить пример
            </button>
            {examples.filter(ex => ex.trim() !== '').length < 3 && (
              <div className="validation-message">
                Необходимо добавить минимум {3 - examples.filter(ex => ex.trim() !== '').length} примера
              </div>
            )}
          </div>
        </div>
        
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Создание...' : 'Создать интент'}
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
            Ошибка при создании интента. Убедитесь, что бэкенд запущен.
          </div>
        )}
        
        {mutation.isSuccess && (
          <div className="success-message">
            Интент успешно создан!
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateIntentForm;