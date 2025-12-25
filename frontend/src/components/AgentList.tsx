import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { agentAPI } from '../services/api';
import './css/AgentList.css';

/**
 * Компонент для отображения списка агентов
 * Позволяет пользователю просматривать, фильтровать, сортировать и управлять агентами
 * Поддерживает функции создания, редактирования и удаления агентов
 */
const AgentList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const queryClient = useQueryClient();
  const {
    data: agents,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['agents'],
    queryFn: agentAPI.getAgents,
  });

  const deleteMutation = useMutation({
    mutationFn: agentAPI.deleteAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
    onError: (error) => {
      console.error('Ошибка удаления агента:', error);
    }
  });

  // Фильтрация и сортировка агентов
  const filteredAndSortedAgents = useMemo(() => {
    if (!agents) return [];
    
    // Фильтрация
    let filtered = agents.filter(agent =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Сортировка
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'type':
          comparison = a.agent_type.localeCompare(b.agent_type);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [agents, searchTerm, sortBy, sortOrder]);

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить агента "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/agent/${id}`);
  };

  if (isLoading) return <div className="loading">Загрузка агентов...</div>;
  if (error) {
    console.error('Ошибка загрузки агентов:', error);
    return (
      <div className="error">
        Не удалось загрузить агентов. Убедитесь, что бэкенд запущен на порту 8000
      </div>
    );
  }

  return (
    <div className="agent-list">
      <div className="agent-list-header">
        <h2>Мои агенты</h2>
        <button onClick={() => refetch()} className="refresh-btn">
          Обновить
        </button>
      </div>
      
      {/* Панель фильтров и сортировки */}
      <div className="filters-panel">
        <div className="search-box">
          <input
            type="text"
            placeholder="Поиск по названию или описанию..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="sort-controls">
          <label htmlFor="sort-by">Сортировать по:</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="sort-select"
          >
            <option value="name">Названию</option>
            <option value="status">Статусу</option>
            <option value="type">Типу</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="sort-order-btn"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>
      
      <div className="agents-grid">
        {filteredAndSortedAgents.map(agent => (
          <div key={agent.id} className="agent-card">
            <div className="agent-card-header">
              <h3>{agent.name}</h3>
              <span className={`status-badge status-${agent.status}`}>
                {agent.status}
              </span>
            </div>
            <p className="agent-description">{agent.description}</p>
            <div className="agent-card-footer">
              <span className="agent-type">{agent.agent_type}</span>
              <div className="agent-actions">
                <button className="btn btn-primary">Тестировать</button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleEdit(agent.id)}
                >
                  Редактировать
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(agent.id, agent.name)}
                  disabled={deleteMutation.isPending}
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredAndSortedAgents.length === 0 && searchTerm && (
        <div className="empty-state">
          <p>Агенты не найдены по вашему запросу.</p>
        </div>
      )}
      
      {agents?.length === 0 && !searchTerm && (
        <div className="empty-state">
          <p>Агентов пока нет. Создайте первого агента!</p>
        </div>
      )}
    </div>
  );
};

export default AgentList;