from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers.agents import router as agents_router
from backend.routers.nlu import router as nlu_router  # 👈 ДОБАВЛЯЕМ ИМПОРТ

app = FastAPI(
    title="Lab Complex API",
    description="API для управления Rasa агентами и NLU редактором",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents_router)
app.include_router(nlu_router)  # 👈 ПОДКЛЮЧАЕМ NLU РОУТЕР

@app.get("/")
async def root():
    return {
        "message": "Lab Complex API запущен!",
        "endpoints": {
            "docs": "/api/docs",
            "agents": "/api/agents",
            "nlu": "/api/agents/{id}/nlu"
        }
    }