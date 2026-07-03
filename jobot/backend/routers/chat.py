"""
JoBot — Router per gli endpoint della chat conversazionale.

Espone:
    POST /v1/chat         — Invia un messaggio e ottieni la risposta di JoBot
    POST /v1/chat/start   — Avvia una nuova conversazione (messaggio di benvenuto)
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from models.schemas import RichiestaChat, RispostaChat
from services.conversazione import avvia_conversazione, elabora_messaggio

router = APIRouter()


class RichiestaAvvio(BaseModel):
    """Payload per avviare una nuova conversazione.

    Attributes:
        session_id: Identificatore opaco della sessione.
    """

    session_id: str


@router.post(
    "/chat/start",
    response_model=RispostaChat,
    status_code=status.HTTP_200_OK,
    summary="Avvia una nuova conversazione",
    description=(
        "Crea una nuova sessione e restituisce il messaggio di benvenuto di JoBot. "
        "Chiamare questo endpoint quando l'utente apre l'app per la prima volta "
        "o vuole ricominciare da capo."
    ),
)
async def avvia_chat(richiesta: RichiestaAvvio) -> RispostaChat:
    """Avvia una nuova sessione e restituisce il benvenuto di JoBot.

    Args:
        richiesta: Payload con il session_id da inizializzare.

    Returns:
        RispostaChat: Messaggio di benvenuto nel formato CONTRACT.md.
    """
    try:
        risposta = await avvia_conversazione(session_id=richiesta.session_id)
        return risposta
    except Exception as e:
        # Non esponiamo dettagli tecnici all'utente
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Si è verificato un errore interno. Riprova tra qualche momento.",
        ) from e


@router.post(
    "/chat",
    response_model=RispostaChat,
    status_code=status.HTTP_200_OK,
    summary="Invia un messaggio alla chat",
    description=(
        "Endpoint principale della conversazione. "
        "Riceve il messaggio dell'utente, lo elabora tramite la macchina a stati "
        "conversazionale e restituisce la risposta di JoBot nel formato CONTRACT.md."
    ),
)
async def invia_messaggio(richiesta: RichiestaChat) -> RispostaChat:
    """Elabora un messaggio dell'utente e restituisce la risposta di JoBot.

    La risposta rispetta esattamente il formato definito in CONTRACT.md.
    In caso di errore interno, il campo `error` della risposta viene popolato
    invece di restituire un codice HTTP di errore, per non interrompere la UX.

    Args:
        richiesta: Payload con il messaggio dell'utente e il session_id.

    Returns:
        RispostaChat: Risposta completa nel formato CONTRACT.md.
    """
    try:
        risposta = await elabora_messaggio(
            messaggio=richiesta.messaggio,
            session_id=richiesta.session_id,
        )
        return risposta
    except Exception as e:
        # Restituisce un errore nel formato CONTRACT.md invece di HTTP 500
        # Questo garantisce che il frontend riceva sempre un JSON valido
        from models.schemas import InfoErrore, InfoSupporto, ProfiloUtente, StatoConversazione

        return RispostaChat(
            message="Mi dispiace, ho avuto un piccolo problema tecnico. Puoi riprovare tra qualche secondo?",
            state=StatoConversazione.RACCOLTA_PROFILO,
            profile=ProfiloUtente(),
            jobs=[],
            support=InfoSupporto(),
            error=InfoErrore(
                has_error=True,
                message="Errore interno del server. Riprova tra qualche momento.",
            ),
        )
