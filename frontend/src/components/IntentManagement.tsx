import React, { useState, useEffect } from 'react';
import { Intent, IntentCreate } from '../services/api';
import CreateExampleForm from './CreateExampleForm';
import './css/IntentManagement.css';

/**
 * Управление интентами агента
 * Позволяет создавать, редактировать и удалять интенты агента
 * Интенты представляют собой категории намерений пользователей
 * Каждый интент должен содержать минимум 3 примера фраз
 */
interface IntentManagementProps {
  agentId: number;
}

const IntentManagement: React.FC<IntentManagementProps> = ({ agentId }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIntent, setEditingIntent] = useState<Intent | null>(null);
  const [formData, setFormData] = useState<Partial<IntentCreate>>({
    name: '',
    description: '',
    examples: []
  });
  const [newExample, setNewExample] = useState('');
  const [intents, setIntents] = useState<Intent[]>([
    {
      id: 1,
      name: "greet",
      description: "Приветствие пользователя",
      examples: [
        "Привет",
        "Здравствуйте",
        "Добрый день"
      ]
    },
    {
      id: 2,
      name: "goodbye",
      description: "Прощание с пользователем",
      examples: [
        "Пока",
        "До свидания",
        "Увидимся"
      ]
    }
  ]);
  
  const [showExampleForm, setShowExampleForm] = useState(false);
  const [selectedIntentId, setSelectedIntentId] = useState<number | null>(null);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      examples: []
    });
    setNewExample('');
  };

  useEffect(() => {
    if (editingIntent) {
      setFormData({
        name: editingIntent.name,
        description: editingIntent.description || '',
        examples: [...editingIntent.examples]
      });
    } else if (!isAdding) {
      resetForm();
    }
  }, [editingIntent, isAdding]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.examples || formData.examples.length < 3) return;
    
    const intentData: IntentCreate = {
      name: formData.name,
      description: formData.description,
      examples: formData.examples
    };
    
    if (editingIntent) {
      // Update existing intent
      setIntents(intents.map(intent =>
        intent.id === editingIntent.id
          ? { ...intent, ...intentData }
          : intent
      ));
      setEditingIntent(null);
    } else {
      // Add new intent
      const newIntent: Intent = {
        id: Date.now(),
        ...intentData
      };
      setIntents([...intents, newIntent]);
    }
    
    setIsAdding(false);
    resetForm();
  };

  const handleEdit = (intent: Intent) => {
    setEditingIntent(intent);
    setIsAdding(true);
  };

  const handleDelete = (intentId: number, intentName: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить интент "${intentName}"?`)) {
      setIntents(intents.filter(intent => intent.id !== intentId));
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingIntent(null);
    resetForm();
  };

  const addExample = () => {
    if (newExample.trim()) {
      setFormData({
        ...formData,
        examples: [...(formData.examples || []), newExample.trim()]
      });
      setNewExample('');
    }
  };

  const removeExample = (index: number) => {
    const newExamples = [...(formData.examples || [])];
    newExamples.splice(index, 1);
    setFormData({...formData, examples: newExamples});
  };

  const handleAddExample = (intentId: number) => {
    setSelectedIntentId(intentId);
    setShowExampleForm(true);
  };

  const handleBackFromExampleForm = () => {
    setShowExampleForm(false);
    setSelectedIntentId(null);
  };

  // Показываем форму добавления примеров, если showExampleForm равно true
  if (showExampleForm && selectedIntentId) {
    return (
      <CreateExampleForm 
        agentId={agentId}
        intentId={selectedIntentId}
        onBack={handleBackFromExampleForm}
      />
    );
  }

  return (
    <div className="intent-management">
      <div className="intent-header">
        <h2>Управление интентами</h2>
        {!isAdding && (
          <button 
            className="btn btn-primary"
            onClick={() => setIsAdding(true)}
          >
            Добавить интент
          </button>
        )}
      </div>

      {(isAdding || editingIntent) && (
        <div className="intent-form">
          <h3>{editingIntent ? 'Редактировать интент' : 'Добавить новый интент'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Название интента *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Описание</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label>Примеры фраз *</label>
              <div className="examples-input">
                <div className="example-input-group">
                  <input
                    type="text"
                    value={newExample}
                    onChange={(e) => setNewExample(e.target.value)}
                    placeholder="Введите пример фразы"
                  />
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={addExample}
                  >
                    Добавить
                  </button>
                </div>
                
                {formData.examples && formData.examples.length > 0 && (
                  <div className="examples-list">
                    {formData.examples.map((example, index) => (
                      <div key={index} className="example-item">
                        <input
                          type="text"
                          value={example}
                          onChange={(e) => {
                            const newExamples = [...formData.examples!];
                            newExamples[index] = e.target.value;
                            setFormData({...formData, examples: newExamples});
                          }}
                          className="example-input"
                        />
                        <button
                          type="button"
                          className="btn btn-danger btn-small"
                          onClick={() => removeExample(index)}
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {formData.examples && formData.examples.length < 3 && (
                  <div className="validation-message">
                    Необходимо добавить минимум {3 - formData.examples.length} пример(а) фраз
                  </div>
                )}
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!formData.name || !formData.examples || formData.examples.length < 3}
              >
                {editingIntent ? 'Сохранить' : 'Создать'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="intents-list">
        {intents && intents.length > 0 ? (
          <div className="intents-grid">
            {intents.map(intent => (
              <div key={intent.id} className="intent-card">
                <div className="intent-card-header">
                  <h4>{intent.name}</h4>
                </div>
                {intent.description && (
                  <p className="intent-description">{intent.description}</p>
                )}
                <div className="intent-examples">
                  <h5>Примеры:</h5>
                  <ul>
                    {intent.examples.slice(0, 3).map((example, index) => (
                      <li key={index}>{example}</li>
                    ))}
                    {intent.examples.length > 3 && (
                      <li>... и еще {intent.examples.length - 3}</li>
                    )}
                  </ul>
                </div>
                <div className="intent-actions">
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => handleEdit(intent)}
                  >
                    Редактировать
                  </button>
                  <button
                    className="btn btn-primary btn-small"
                    onClick={() => handleAddExample(intent.id)}
                  >
                    Добавить пример
                  </button>
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => handleDelete(intent.id, intent.name)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Интентов пока нет. {isAdding ? '' : 'Добавьте первый интент!'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntentManagement;