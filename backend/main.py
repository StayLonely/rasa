from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .routers import agents

app = FastAPI(
    title="Lab Complex API",
    description="API для управления Rasa агентами",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS настройки
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(agents.router)

@app.get("/")
async def root():
    return {
        "message": "Lab Complex API запущен!",
        "endpoints": {
            "docs": "/api/docs",
            "agents": "/api/agents"
        }
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "lab-complex-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)