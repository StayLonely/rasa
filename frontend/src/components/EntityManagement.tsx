import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Entity, EntityCreate, agentAPI } from '../services/api';
import './css/EntityManagement.css';

/**
 * Управление сущностями агента
 * Позволяет создавать, редактировать и удалять сущности агента
 * Сущности представляют собой важные данные, извлекаемые из сообщений пользователей
 * Поддерживаются два типа сущностей: lookup (список значений) и regex (регулярное выражение)
 */
interface EntityManagementProps {
  agentId: number;
}

const EntityManagement: React.FC<EntityManagementProps> = ({ agentId }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [formData, setFormData] = useState<Partial<EntityCreate>>({
    name: '',
    type: 'lookup',
    description: '',
    regex_pattern: '',
    lookup_values: []
  });
  const [newLookupValue, setNewLookupValue] = useState('');
  
  const queryClient = useQueryClient();
  
  const { data: entities, isLoading, error, refetch } = useQuery({
    queryKey: ['entities', agentId],
    queryFn: () => agentAPI.getEntities(agentId),
  });
  
  const createMutation = useMutation({
    mutationFn: (entityData: EntityCreate) => agentAPI.createEntity(agentId, entityData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', agentId] });
      resetForm();
      setIsAdding(false);
    },
    onError: (error) => {
      console.error('Ошибка создания сущности:', error);
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: (params: { entityId: number, entityData: EntityCreate }) => 
      agentAPI.updateEntity(agentId, params.entityId, params.entityData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', agentId] });
      setEditingEntity(null);
      resetForm();
      setIsAdding(false);
    },
    onError: (error) => {
      console.error('Ошибка обновления сущности:', error);
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: (entityId: number) => agentAPI.deleteEntity(agentId, entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', agentId] });
    },
    onError: (error) => {
      console.error('Ошибка удаления сущности:', error);
    }
  });

  useEffect(() => {
    if (editingEntity) {
      setFormData({
        name: editingEntity.name,
        type: editingEntity.type,
        description: editingEntity.description || '',
        regex_pattern: editingEntity.regex_pattern || '',
        lookup_values: editingEntity.lookup_values || []
      });
    } else if (!isAdding) {
      resetForm();
    }
  }, [editingEntity, isAdding]);

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'lookup',
      description: '',
      regex_pattern: '',
      lookup_values: []
    });
    setNewLookupValue('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type) return;
    
    const entityData: EntityCreate = {
      name: formData.name,
      type: formData.type,
      description: formData.description,
      regex_pattern: formData.regex_pattern,
      lookup_values: formData.lookup_values
    };
    
    if (editingEntity) {
      updateMutation.mutate({ entityId: editingEntity.id, entityData });
    } else {
      createMutation.mutate(entityData);
    }
  };

  const handleEdit = (entity: Entity) => {
    setEditingEntity(entity);
    setIsAdding(true);
  };

  const handleDelete = (entityId: number, entityName: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить сущность "${entityName}"?`)) {
      deleteMutation.mutate(entityId);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingEntity(null);
    resetForm();
  };
  
  const addLookupValue = () => {
    if (newLookupValue.trim()) {
      setFormData({
        ...formData,
        lookup_values: [...(formData.lookup_values || []), newLookupValue.trim()]
      });
      setNewLookupValue('');
    }
  };
  
  const removeLookupValue = (index: number) => {
    const newValues = [...(formData.lookup_values || [])];
    newValues.splice(index, 1);
    setFormData({...formData, lookup_values: newValues});
  };

  if (isLoading) return <div className="loading">Загрузка сущностей...</div>;
  if (error) {
    console.error('Ошибка загрузки сущностей:', error);
    return (
      <div className="error">
        Не удалось загрузить сущности. Убедитесь, что бэкенд запущен на порту 8000
      </div>
    );
  }

  return (
    <div className="entity-management">
      <div className="entity-header">
        <h2>Управление сущностями</h2>
        <button onClick={() => refetch()} className="refresh-btn">
          Обновить
        </button>
        {!isAdding && (
          <button 
            className="btn btn-primary"
            onClick={() => setIsAdding(true)}
          >
            Добавить сущность
          </button>
        )}
      </div>

      {(isAdding || editingEntity) && (
        <div className="entity-form">
          <h3>{editingEntity ? 'Редактировать сущность' : 'Добавить новую сущность'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Название *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                disabled={createMutation.isPending || updateMutation.isPending}
              />
            </div>
            
            <div className="form-group">
              <label>Тип *</label>
              <select
                value={formData.type || 'lookup'}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                required
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <option value="lookup">Lookup (список значений)</option>
                <option value="regex">Regex (регулярное выражение)</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Описание</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                disabled={createMutation.isPending || updateMutation.isPending}
              />
            </div>
            
            {formData.type === 'regex' && (
              <div className="form-group">
                <label>Паттерн регулярного выражения *</label>
                <input
                  type="text"
                  value={formData.regex_pattern || ''}
                  onChange={(e) => setFormData({...formData, regex_pattern: e.target.value})}
                  placeholder="Например: \d{4}-\d{4}-\d{4}-\d{4}"
                  disabled={createMutation.isPending || updateMutation.isPending}
                />
              </div>
            )}
            
            {formData.type === 'lookup' && (
              <div className="form-group">
                <label>Список возможных значений *</label>
                <div className="lookup-values-input">
                  <div className="lookup-input-group">
                    <input
                      type="text"
                      value={newLookupValue}
                      onChange={(e) => setNewLookupValue(e.target.value)}
                      placeholder="Введите значение"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={addLookupValue}
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      Добавить
                    </button>
                  </div>
                  
                  {formData.lookup_values && formData.lookup_values.length > 0 && (
                    <div className="lookup-values-list">
                      {formData.lookup_values.map((value: string, index: number) => (
                        <div key={index} className="lookup-value-item">
                          <span>{value}</span>
                          <button
                            type="button"
                            className="btn btn-danger btn-small"
                            onClick={() => removeLookupValue(index)}
                            disabled={createMutation.isPending || updateMutation.isPending}
                          >
                            Удалить
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Сохранение...' : 
                 editingEntity ? 'Сохранить' : 'Создать'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleCancel}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Отмена
              </button>
            </div>
          </form>
          
          {(createMutation.isError || updateMutation.isError) && (
            <div className="error-message">
              Ошибка при {editingEntity ? 'обновлении' : 'создании'} сущности. 
              Убедитесь, что бэкенд запущен.
            </div>
          )}
        </div>
      )}

      <div className="entities-list">
        {entities && entities.length > 0 ? (
          <div className="entities-grid">
            {entities.map(entity => (
              <div key={entity.id} className="entity-card">
                <div className="entity-card-header">
                  <h4>{entity.name}</h4>
                  <span className="entity-type">{entity.type}</span>
                </div>
                {entity.description && (
                  <p className="entity-description">{entity.description}</p>
                )}
                {entity.regex_pattern && (
                  <p className="entity-regex">Паттерн: {entity.regex_pattern}</p>
                )}
                {entity.lookup_values && entity.lookup_values.length > 0 && (
                  <div className="entity-lookup-values">
                    <h5>Возможные значения:</h5>
                    <ul>
                      {entity.lookup_values.slice(0, 5).map((value, index) => (
                        <li key={index}>{value}</li>
                      ))}
                      {entity.lookup_values.length > 5 && (
                        <li>... и еще {entity.lookup_values.length - 5}</li>
                      )}
                    </ul>
                  </div>
                )}
                <div className="entity-actions">
                  <button 
                    className="btn btn-secondary btn-small"
                    onClick={() => handleEdit(entity)}
                  >
                    Редактировать
                  </button>
                  <button 
                    className="btn btn-danger btn-small"
                    onClick={() => handleDelete(entity.id, entity.name)}
                    disabled={deleteMutation.isPending}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Сущностей пока нет. {isAdding ? '' : 'Добавьте первую сущность!'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityManagement;