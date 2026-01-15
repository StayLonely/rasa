import React, { useState, useEffect } from 'react';
import { nluAPI, Intent, Entity } from '../services/api';
import './css/NLUEditorImproved.css';

interface Props {
  agentId: number;
  onClose: () => void;
}

const NLUEditorImproved: React.FC<Props> = ({ agentId, onClose }) => {
  const [activeTab, setActiveTab] = useState<'intents' | 'entities'>('intents');
  const [intents, setIntents] = useState<Intent[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка данных
  useEffect(() => {
    loadNLUData();
  }, [agentId]);

  const loadNLUData = async () => {
    try {
      setLoading(true);
      const data = await nluAPI.getNLU(agentId);
      
      // Преобразуем формат данных для удобства работы
      const loadedIntents: Intent[] = data.intents.map((intent: any, index: number) => ({
        id: index + 1,
        name: intent.name,
        description: '',
        examples: intent.examples.map((ex: any) => ex.text)
      }));
      
      const loadedEntities: Entity[] = data.entities.map((entity: any, index: number) => ({
        id: index + 1,
        name: entity.name,
        type: 'lookup', // или другой тип по умолчанию
        description: entity.description || '',
        lookup_values: entity.examples || []
      }));
      
      setIntents(loadedIntents);
      setEntities(loadedEntities);
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  // Сохранение данных
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Преобразуем данные обратно в формат API
      const nluData = {
        intents: intents.map(intent => ({
          name: intent.name,
          examples: intent.examples.filter(ex => ex.trim()).map(text => ({ 
            text, 
            entities: []  // Пустой массив объектов EntityExample
          }))
        })),
        entities: entities.map(entity => ({
          name: entity.name,
          examples: entity.type === 'lookup' 
            ? (entity.lookup_values || []).filter(val => val.trim()) 
            : [],
          ...(entity.type === 'regex' ? { regex_pattern: entity.regex_pattern } : {})
        }))
      };
      
      await nluAPI.updateNLU(agentId, nluData);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  // Работа с интентами
  const addIntent = () => {
    const newIntent: Intent = {
      id: Date.now(),
      name: `new_intent_${intents.length + 1}`,
      description: '',
      examples: ['']
    };
    setIntents([...intents, newIntent]);
  };

  const updateIntent = (id: number, field: keyof Intent, value: any) => {
    setIntents(intents.map(intent => 
      intent.id === id ? { ...intent, [field]: value } : intent
    ));
  };

  const removeIntent = (id: number) => {
    setIntents(intents.filter(intent => intent.id !== id));
  };

  const addExample = (intentId: number) => {
    setIntents(intents.map(intent => {
      if (intent.id === intentId) {
        return {
          ...intent,
          examples: [...intent.examples, '']
        };
      }
      return intent;
    }));
  };

  const updateExample = (intentId: number, exampleIndex: number, value: string) => {
    setIntents(intents.map(intent => {
      if (intent.id === intentId) {
        const newExamples = [...intent.examples];
        newExamples[exampleIndex] = value;
        return { ...intent, examples: newExamples };
      }
      return intent;
    }));
  };

  const removeExample = (intentId: number, exampleIndex: number) => {
    setIntents(intents.map(intent => {
      if (intent.id === intentId) {
        const newExamples = [...intent.examples];
        newExamples.splice(exampleIndex, 1);
        return { ...intent, examples: newExamples };
      }
      return intent;
    }));
  };

  // Работа с сущностями
  const addEntity = () => {
    const newEntity: Entity = {
      id: Date.now(),
      name: `new_entity_${entities.length + 1}`,
      type: 'lookup',
      description: '',
      lookup_values: ['']
    };
    setEntities([...entities, newEntity]);
  };

  const updateEntity = (id: number, field: keyof Entity, value: any) => {
    setEntities(entities.map(entity => 
      entity.id === id ? { ...entity, [field]: value } : entity
    ));
  };

  const removeEntity = (id: number) => {
    setEntities(entities.filter(entity => entity.id !== id));
  };

  const addLookupValue = (entityId: number) => {
    setEntities(entities.map(entity => {
      if (entity.id === entityId) {
        return {
          ...entity,
          lookup_values: [...(entity.lookup_values || []), '']
        };
      }
      return entity;
    }));
  };

  const updateLookupValue = (entityId: number, valueIndex: number, value: string) => {
    setEntities(entities.map(entity => {
      if (entity.id === entityId) {
        const newValues = [...(entity.lookup_values || [])];
        newValues[valueIndex] = value;
        return { ...entity, lookup_values: newValues };
      }
      return entity;
    }));
  };

  const removeLookupValue = (entityId: number, valueIndex: number) => {
    setEntities(entities.map(entity => {
      if (entity.id === entityId) {
        const newValues = [...(entity.lookup_values || [])];
        newValues.splice(valueIndex, 1);
        return { ...entity, lookup_values: newValues };
      }
      return entity;
    }));
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal-content large">
          <div className="modal-header">
            <h2>NLU Editor — агент #{agentId}</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <div className="loading">Загрузка данных...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content large">
        <div className="modal-header">
          <h2>NLU Editor — агент #{agentId}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-tabs">
          <button 
            className={`tab-btn ${activeTab === 'intents' ? 'active' : ''}`}
            onClick={() => setActiveTab('intents')}
          >
            Интенты ({intents.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'entities' ? 'active' : ''}`}
            onClick={() => setActiveTab('entities')}
          >
            Сущности ({entities.length})
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          
          {activeTab === 'intents' && (
            <div className="intents-section">
              <div className="section-header">
                <h3>Интенты</h3>
                <button className="btn btn-primary btn-small" onClick={addIntent}>
                  + Добавить интент
                </button>
              </div>
              
              <div className="intents-list">
                {intents.map(intent => (
                  <div key={intent.id} className="intent-card">
                    <div className="intent-header">
                      <input
                        type="text"
                        className="intent-name"
                        value={intent.name}
                        onChange={(e) => updateIntent(intent.id, 'name', e.target.value)}
                        placeholder="Название интента"
                      />
                      <button 
                        className="btn btn-danger btn-small"
                        onClick={() => removeIntent(intent.id)}
                      >
                        Удалить
                      </button>
                    </div>
                    
                    <div className="examples-section">
                      <h4>Примеры фраз:</h4>
                      <div className="examples-list">
                        {intent.examples.map((example, index) => (
                          <div key={index} className="example-row">
                            <input
                              type="text"
                              value={example}
                              onChange={(e) => updateExample(intent.id, index, e.target.value)}
                              placeholder="Введите пример фразы"
                            />
                            <button
                              className="btn btn-danger btn-tiny"
                              onClick={() => removeExample(intent.id, index)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button 
                          className="btn btn-secondary btn-small"
                          onClick={() => addExample(intent.id)}
                        >
                          + Добавить пример
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {intents.length === 0 && (
                  <div className="empty-state">
                    Нет интентов. Добавьте первый!
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'entities' && (
            <div className="entities-section">
              <div className="section-header">
                <h3>Сущности</h3>
                <button className="btn btn-primary btn-small" onClick={addEntity}>
                  + Добавить сущность
                </button>
              </div>
              
              <div className="entities-list">
                {entities.map(entity => (
                  <div key={entity.id} className="entity-card">
                    <div className="entity-header">
                      <input
                        type="text"
                        className="entity-name"
                        value={entity.name}
                        onChange={(e) => updateEntity(entity.id, 'name', e.target.value)}
                        placeholder="Название сущности"
                      />
                      <select
                        value={entity.type}
                        onChange={(e) => updateEntity(entity.id, 'type', e.target.value)}
                      >
                        <option value="lookup">Lookup</option>
                        <option value="regex">Regex</option>
                      </select>
                      <button 
                        className="btn btn-danger btn-small"
                        onClick={() => removeEntity(entity.id)}
                      >
                        Удалить
                      </button>
                    </div>
                    
                    {entity.type === 'lookup' && (
                      <div className="lookup-values-section">
                        <h4>Значения:</h4>
                        <div className="values-list">
                          {(entity.lookup_values || []).map((value, index) => (
                            <div key={index} className="value-row">
                              <input
                                type="text"
                                value={value}
                                onChange={(e) => updateLookupValue(entity.id, index, e.target.value)}
                                placeholder="Введите значение"
                              />
                              <button
                                className="btn btn-danger btn-tiny"
                                onClick={() => removeLookupValue(entity.id, index)}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button 
                            className="btn btn-secondary btn-small"
                            onClick={() => addLookupValue(entity.id)}
                          >
                            + Добавить значение
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {entity.type === 'regex' && (
                      <div className="regex-section">
                        <h4>Регулярное выражение:</h4>
                        <input
                          type="text"
                          value={entity.regex_pattern || ''}
                          onChange={(e) => updateEntity(entity.id, 'regex_pattern', e.target.value)}
                          placeholder="Введите регулярное выражение"
                        />
                      </div>
                    )}
                  </div>
                ))}
                
                {entities.length === 0 && (
                  <div className="empty-state">
                    Нет сущностей. Добавьте первую!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Отмена
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NLUEditorImproved;