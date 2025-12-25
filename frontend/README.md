# Chatbot Agent Management System - Frontend

## Описание проекта

Фронтенд часть системы управления чат-бот агентами, построенная на React с использованием TypeScript. Система предоставляет веб-интерфейс для создания, настройки и тестирования чат-бот агентов.

## Структура проекта

```
frontend/
├── public/                 # Статические файлы
├── src/
│   ├── components/        # Переиспользуемые компоненты
│   ├── pages/             # Страницы приложения
│   ├── services/          # API сервисы для взаимодействия с бекендом
│   ├── types/             # TypeScript типы
│   ├── App.css           # Основные стили приложения
│   ├── App.tsx           # Корневой компонент приложения
│   └── index.tsx         # Точка входа в приложение
├── package.json          # Зависимости и скрипты проекта
└── README.md             # Документация
```

### Основные компоненты

1. **MainChatInterface.tsx** - Главный интерфейс чата с агентами, включает:
   - Панель управления агентами (создание, выбор)
   - Область чата для общения с выбранным агентом
   - Панель диагностики (интенты, сущности, трассировка)

2. **CreateAgentForm.tsx** - Форма для создания новых агентов

3. **AgentList.tsx** - Компонент для отображения списка агентов

4. **ChatInterface.tsx** - Компонент интерфейса чата

5. **DialogEditor.tsx** - Редактор диалоговых сценариев

6. **NLUEditor.tsx** - Редактор NLU (Natural Language Understanding) моделей

7. **IntentManagement.tsx** - Управление интентами агента

8. **EntityManagement.tsx** - Управление сущностями агента

### Сервисы

- **api.ts** - Сервис для взаимодействия с бекендом через REST API

### Типы

- **agent.ts** - Определения типов для агентов и связанных сущностей

## Интеграция с бекендом

### API Endpoints

Бекенд предоставляет REST API по адресу `http://localhost:8000/api` со следующими основными endpoints:

- `GET /api/agents` - Получение списка агентов
- `POST /api/agents` - Создание нового агента
- `GET /api/agents/{id}` - Получение информации об агенте
- `DELETE /api/agents/{id}` - Удаление агента
- `POST /api/agents/{id}/train` - Запуск обучения агента
- `POST /api/agents/{id}/message` - Отправка сообщения агенту

- `GET /api/agents/{id}/entities` - Получение сущностей агента
- `POST /api/agents/{id}/entities` - Создание сущности
- `PUT /api/agents/{id}/entities/{entityId}` - Обновление сущности
- `DELETE /api/agents/{id}/entities/{entityId}` - Удаление сущности

- `GET /api/agents/{id}/intents` - Получение интентов агента
- `POST /api/agents/{id}/intents` - Создание интента
- `PUT /api/agents/{id}/intents/{intentId}` - Обновление интента
- `DELETE /api/agents/{id}/intents/{intentId}` - Удаление интента

### Интеграция в систему

1. Убедитесь, что бекенд запущен на `http://localhost:8000`
2. Фронтенд автоматически подключится к бекенду через сервис `api.ts`
3. Все данные передаются в формате JSON
4. Для локальной разработки используется прокси в `package.json` для обхода CORS

### Запуск приложения

1. Установите зависимости:
   ```bash
   npm install
   ```

2. Запустите приложение в режиме разработки:
   ```bash
   npm start
   ```

3. Приложение будет доступно по адресу `http://localhost:3000`

### Сборка для продакшена

```bash
npm run build
```

Собранные файлы будут находиться в директории `build/`.

## Дополнительная информация

Этот проект был создан с помощью [Create React App](https://github.com/facebook/create-react-app).

Для получения дополнительной информации о работе с Create React App, посетите [документацию](https://facebook.github.io/create-react-app/docs/getting-started).

Для изучения React, посетите [документацию React](https://reactjs.org/).
