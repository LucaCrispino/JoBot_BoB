"""
JoBot — Router per l'endpoint di health check.
"""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class RispostaHealth(BaseModel):
    """Risposta dell'endpoint /health.

    Attributes:
        stato: Stato del servizio ('ok' se operativo).
        versione: Versione corrente dell'API.
        servizio: Nome del servizio.
    """

    stato: str
    versione: str
    servizio: str


@router.get("/health", response_model=RispostaHealth, summary="Verifica stato del servizio")
async def health_check() -> RispostaHealth:
    """Verifica che il backend sia operativo.

    Utilizzato da load balancer, monitoraggi e dal frontend per
    verificare la connettività prima di avviare la chat.

    Returns:
        RispostaHealth: Stato corrente del servizio.
    """
    return RispostaHealth(
        stato="ok",
        versione="0.1.0",
        servizio="jobot-backend",
    )
