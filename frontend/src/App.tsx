import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AgentList from './components/AgentList';
import CreateAgentForm from './components/CreateAgentForm';
import AgentDashboard from './pages/AgentDashboard';
import MainChatInterface from './pages/MainChatInterface';
import CreateEntityForm from './components/CreateEntityForm';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <header className="app-header">
            <h1>Лабораторный комплекс чат-ботов</h1>
            <p>Создание и тестирование AI агентов</p>
          </header>
          <main className="app-main">
            <Routes>
              <Route path="/" element={
                <div className="full-width-container">
                  <MainChatInterface />
                </div>
              } />
              <Route path="/agents" element={
                <div className="container">
                  <>
                    <CreateAgentForm />
                    <AgentList />
                  </>
                </div>
              } />
              <Route path="/agent/:id" element={
                <div className="container">
                  <AgentDashboard />
                </div>
              } />
              <Route path="/create-entity" element={
                <div className="container">
                  <CreateEntityForm agentId={1} onBack={() => window.history.back()} />
                </div>
              } />
            </Routes>
          </main>
        </div>
        <ReactQueryDevtools initialIsOpen={false} />
      </Router>
    </QueryClientProvider>
  );
}

export default App;