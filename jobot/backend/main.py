"""
JoBot Backend — Entry point FastAPI.

Avvia il server con:
    uvicorn main:app --reload --port 8000

Documentazione interattiva disponibile su:
    http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import get_settings
from routers import health, chat

# Carica la configurazione dall'ambiente
settings = get_settings()


def crea_app() -> FastAPI:
    """Crea e configura l'istanza FastAPI (app factory pattern).

    Returns:
        FastAPI: L'istanza configurata dell'applicazione.
    """
    app = FastAPI(
        title="JoBot API",
        description=(
            "Piattaforma ibrida psicologico-AI per il reinserimento lavorativo "
            "nell'area metropolitana di Napoli."
        ),
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # --- Middleware CORS ---
    # Permette al frontend React Native/Expo di comunicare con il backend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- Router ---
    app.include_router(health.router, tags=["Sistema"])
    app.include_router(chat.router, prefix="/v1", tags=["Chat"])

    return app


# Istanza globale dell'app (usata da uvicorn)
app = crea_app()
