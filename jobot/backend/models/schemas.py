"""
JoBot — Modelli Pydantic per la validazione di richieste e risposte.

Tutti i modelli rispettano esattamente il contratto dati definito in CONTRACT.md.
"""

from enum import Enum
from typing import List

from pydantic import BaseModel, Field


# ============================================================
# Enum — Valori ammessi
# ============================================================


class StatoConversazione(str, Enum):
    """Stati possibili della macchina conversazionale di JoBot."""

    RACCOLTA_PROFILO = "profile_collection"
    SINTESI_COMPETENZE = "skills_summary"
    RICERCA_LAVORO = "job_search"
    SUPPORTO = "support_referral"


class FonteOfferta(str, Enum):
    """Fonte dell'offerta di lavoro."""

    MOCK = "mock"
    ADZUNA = "adzuna"
    INFOJOBS = "infojobs"
    CAREERJET = "careerjet"


class TipoSupporto(str, Enum):
    """Tipo di supporto psicologico/umano suggerito."""

    NESSUNO = "none"
    SUPPORTO_UMANO = "human_support"
    ORIENTAMENTO_PSICOLOGICO = "psychological_orientation"


# ============================================================
# Modelli di Input
# ============================================================


class RichiestaChat(BaseModel):
    """Payload della richiesta POST /v1/chat.

    Attributes:
        messaggio: Il testo inviato dall'utente.
        session_id: Identificatore opaco della sessione corrente.
            Generato dal frontend al primo avvio e mantenuto per tutta
            la conversazione. Permette al backend di recuperare lo stato
            senza un database (per il prototipo: lo stato è in-memory).
    """

    messaggio: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Il testo inviato dall'utente.",
        examples=["Ciao, mi chiamo Mario e cerco lavoro a Napoli"],
    )
    session_id: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="Identificatore opaco della sessione corrente.",
        examples=["sessione-abc-123"],
    )


# ============================================================
# Modelli di Output — sub-modelli
# ============================================================


class ProfiloUtente(BaseModel):
    """Profilo utente raccolto progressivamente durante la conversazione.

    Attributes:
        name: Nome o alias dell'utente (mai il cognome per la privacy).
        location: Zona geografica dell'utente (es. 'Napoli centro', 'Pozzuoli').
        skills: Lista di competenze dichiarate dall'utente.
        experience: Esperienza lavorativa in forma testuale libera.
        preferences: Preferenze lavorative (es. settore, orario, tipo contratto).
    """

    name: str = Field(default="", description="Nome o alias dell'utente.")
    location: str = Field(default="", description="Zona geografica.")
    skills: List[str] = Field(default_factory=list, description="Competenze dichiarate.")
    experience: str = Field(default="", description="Esperienza lavorativa.")
    preferences: List[str] = Field(default_factory=list, description="Preferenze lavorative.")


class OffertaLavoro(BaseModel):
    """Singola offerta di lavoro nel formato normalizzato CONTRACT.md.

    Attributes:
        title: Titolo della posizione lavorativa.
        company: Nome dell'azienda.
        location: Luogo di lavoro.
        description: Breve descrizione dell'offerta.
        source: Fonte dell'offerta (mock, adzuna, infojobs, careerjet).
        url: URL dell'offerta originale.
        published_at: Data di pubblicazione (ISO 8601) o stringa vuota.
    """

    title: str = Field(..., description="Titolo della posizione.")
    company: str = Field(..., description="Nome dell'azienda.")
    location: str = Field(..., description="Luogo di lavoro.")
    description: str = Field(..., description="Breve descrizione.")
    source: FonteOfferta = Field(..., description="Fonte dell'offerta.")
    url: str = Field(..., description="URL dell'offerta.")
    published_at: str = Field(default="", description="Data di pubblicazione (ISO 8601).")


class InfoSupporto(BaseModel):
    """Informazioni sul supporto umano/psicologico suggerito.

    Attributes:
        suggested: True se JoBot suggerisce supporto umano o psicologico.
        message: Messaggio empatico di orientamento (vuoto se non suggerito).
        type: Tipo di supporto suggerito.
    """

    suggested: bool = Field(default=False, description="True se il supporto è suggerito.")
    message: str = Field(default="", description="Messaggio empatico di orientamento.")
    type: TipoSupporto = Field(default=TipoSupporto.NESSUNO, description="Tipo di supporto.")


class InfoErrore(BaseModel):
    """Informazioni su eventuali errori nella risposta.

    Attributes:
        has_error: True se si è verificato un errore.
        message: Descrizione dell'errore in italiano (vuota se nessun errore).
    """

    has_error: bool = Field(default=False, description="True se c'è un errore.")
    message: str = Field(default="", description="Descrizione dell'errore.")


# ============================================================
# Modello principale di Output
# ============================================================


class RispostaChat(BaseModel):
    """Risposta dell'endpoint POST /v1/chat — conforme al CONTRACT.md.

    Questo è il contratto dati ufficiale tra backend e frontend.
    Ogni campo deve essere sempre presente nella risposta, anche se vuoto.

    Attributes:
        message: Testo da mostrare nella chat come messaggio di JoBot.
        state: Stato corrente della macchina conversazionale.
        profile: Profilo utente raccolto fino a quel momento.
        jobs: Lista di offerte di lavoro (vuota se non in fase job_search).
        support: Informazioni sul supporto psicologico/umano.
        error: Informazioni su eventuali errori.
    """

    message: str = Field(..., description="Testo del messaggio di JoBot.")
    state: StatoConversazione = Field(..., description="Stato conversazionale corrente.")
    profile: ProfiloUtente = Field(
        default_factory=ProfiloUtente,
        description="Profilo utente aggiornato.",
    )
    jobs: List[OffertaLavoro] = Field(
        default_factory=list,
        description="Offerte di lavoro trovate.",
    )
    support: InfoSupporto = Field(
        default_factory=InfoSupporto,
        description="Informazioni sul supporto suggerito.",
    )
    error: InfoErrore = Field(
        default_factory=InfoErrore,
        description="Informazioni su eventuali errori.",
    )
