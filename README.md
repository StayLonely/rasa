# Lab backend — quick run

Кратко: Docker (рекомендую).

1) Быстрый запуск (Docker Compose)

```bash
# собрать и запустить backend + mock-agent
docker compose up --build -d

# проверить API
curl http://localhost:8000/api/agents

# отправить сообщение агенту 1
curl -s -X POST http://localhost:8000/api/agents/1/message \
  -H "Content-Type: application/json" \
  -d '{"message":"привет","sender":"user"}'

# открыть Swagger UI
open http://localhost:8000/docs
```

2) Где смотреть запросы / логи
- Swagger/OpenAPI UI: `/docs` (например http://localhost:8000/docs) — интерфейс для вызова всех эндпоинтов.
- Сохранённые диалоги: [dialogs_state.json](dialogs_state.json) или через API: `GET /api/agents/{id}/logs`.

3) Про тестовых агентов и управление ими
- В репозитории уже есть 3 тестовых агента (см. `agents_state.json`). Они отображаются при старте бэкенда.
- `docker compose up` не создаёт новые записи агентов автоматически — он запускает контейнеры, указанные в `docker-compose.yml`.
- Фронтенд может управлять агентами через API:
  - Остановка процесса агента: `POST /api/agents/{id}/stop` (реализовано — пробует найти процесс по порту и завершить его).
  - Запуска/старта процесса агента через API в проекте нет (стартить агент обычно надо средствами контейнеров/сервисов). Рекомендации:
    - В Docker: `docker compose up -d mock-agent-1` или `docker compose start mock-agent-1`.
    - В продакшн: запуск/рестарт через orchestrator (Kubernetes, systemd, Docker API).

4) Полезные curl-примеры

```bash
# список агентов
curl http://localhost:8000/api/agents

# включить/выключить - выключение через API
curl -X POST http://localhost:8000/api/agents/1/stop

# получить логи агента
curl http://localhost:8000/api/agents/1/logs

