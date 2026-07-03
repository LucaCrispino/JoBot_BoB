"""
JoBot — Servizio di gestione della sessione conversazionale (in-memory).

Per il prototipo MVP, lo stato della conversazione viene mantenuto in-memory
in un dizionario globale, indicizzato per session_id.

TODO (Milestone 1): sostituire lo store in-memory con Redis per la persistenza
delle sessioni tra riavvii del server e per supportare deploy multi-istanza.
La struttura SessioneConversazionale è già progettata per essere serializzabile
in JSON, quindi la migrazione sarà semplice.
"""

from dataclasses import dataclass, field
from typing import Dict, List

from models.schemas import StatoConversazione


@dataclass
class SessioneConversazionale:
    """Stato interno di una sessione conversazionale.

    Contiene il profilo utente in costruzione, lo stato corrente
    e la cronologia dei turni della conversazione.

    Attributes:
        stato: Stato corrente della macchina conversazionale.
        nome: Nome o alias dell'utente.
        zona: Zona geografica dell'utente.
        competenze: Lista di competenze dichiarate.
        esperienza: Esperienza lavorativa in testo libero.
        preferenze: Preferenze lavorative.
        fase_raccolta: Indice della fase corrente di raccolta profilo (0–4).
        turni: Numero di turni della conversazione.
    """

    stato: StatoConversazione = StatoConversazione.RACCOLTA_PROFILO
    nome: str = ""
    zona: str = ""
    competenze: List[str] = field(default_factory=list)
    esperienza: str = ""
    preferenze: List[str] = field(default_factory=list)
    fase_raccolta: int = 0  # 0=nome, 1=zona, 2=competenze, 3=esperienza, 4=preferenze
    turni: int = 0


# Dizionario in-memory: session_id → SessioneConversazionale
# TODO (Milestone 1): sostituire con Redis AsyncClient
_sessioni: Dict[str, SessioneConversazionale] = {}


def ottieni_sessione(session_id: str) -> SessioneConversazionale:
    """Recupera la sessione esistente o ne crea una nuova.

    Args:
        session_id: Identificatore opaco della sessione.

    Returns:
        SessioneConversazionale: La sessione corrente o una nuova se non esiste.
    """
    if session_id not in _sessioni:
        _sessioni[session_id] = SessioneConversazionale()
    return _sessioni[session_id]


def salva_sessione(session_id: str, sessione: SessioneConversazionale) -> None:
    """Persiste la sessione aggiornata nello store.

    Args:
        session_id: Identificatore opaco della sessione.
        sessione: Sessione aggiornata da salvare.
    """
    _sessioni[session_id] = sessione
