import React, { useState } from 'react';
import IntentManagement from './IntentManagement';
import EntityManagement from './EntityManagement';
import { Agent } from '../services/api';
import './css/NLUEditor.css';

/**
 * Редактор NLU (Natural Language Understanding) моделей
 * Позволяет управлять интентами и сущностями агента
 * Содержит две вкладки: управление интентами и управление сущностями
 */
interface NLUEditorProps {
  agent: Agent;
  onSave: () => void;
}

const NLUEditor: React.FC<NLUEditorProps> = ({ agent, onSave }) => {
  const [activeTab, setActiveTab] = useState<'intents' | 'entities'>('intents');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleSave = () => {
    // Здесь будет логика сохранения
    onSave();
    setHasUnsavedChanges(false);
  };

  return (
    <div className="nlu-editor">
      <div className="nlu-header">
        <h2>Редактор NLU</h2>
        <div className="nlu-actions">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
          >
            Сохранить изменения
          </button>
        </div>
      </div>
      
      <div className="nlu-tabs">
        <button
          className={`tab-button ${activeTab === 'intents' ? 'active' : ''}`}
          onClick={() => setActiveTab('intents')}
        >
          Интенты
        </button>
        <button
          className={`tab-button ${activeTab === 'entities' ? 'active' : ''}`}
          onClick={() => setActiveTab('entities')}
        >
          Сущности
        </button>
      </div>
      
      <div className="nlu-content">
        {activeTab === 'intents' && (
          <IntentManagement agentId={agent.id} />
        )}
        {activeTab === 'entities' && (
          <EntityManagement agentId={agent.id} />
        )}
      </div>
      
      {hasUnsavedChanges && (
        <div className="unsaved-changes-notification">
          У вас есть несохраненные изменения
        </div>
      )}
    </div>
  );
};

export default NLUEditor;

export {};