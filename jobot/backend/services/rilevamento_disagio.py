"""
JoBot — Rilevamento non diagnostico di segnali di disagio.

Questo modulo analizza i messaggi dell'utente alla ricerca di parole
chiave associate a stati di disagio emotivo, isolamento o difficoltà.

IMPORTANTE — Nota etica:
    Questo sistema NON formula diagnosi psicologiche di alcun tipo.
    Identifica unicamente parole chiave che possono suggerire un momento
    di difficoltà, con l'unico scopo di orientare l'utente verso risorse
    di supporto umano. La presenza di queste parole non implica alcuna
    condizione clinica. Il sistema non è un sostituto di una valutazione
    professionale.
"""

from dataclasses import dataclass
from typing import List

from models.schemas import TipoSupporto


# ============================================================
# Dizionari di parole chiave — aggiornare con attenzione
# ============================================================

# Parole associate a sentimenti di scoraggiamento o difficoltà generale
_PAROLE_SCONFORTO: List[str] = [
    "scoraggiato", "scoraggiata", "scoraggiamento",
    "disperato", "disperata", "disperazione",
    "stanco", "stanca", "stanchezza",
    "non ce la faccio", "non riesco",
    "ho perso la speranza", "senza speranza",
    "inutile", "non vale la pena",
    "demotivato", "demotivata",
    "rinunciare", "mollare tutto",
    "non ho voglia",
    "fallito", "fallita",
    "niente funziona",
]

# Parole associate a sentimenti di isolamento e solitudine
_PAROLE_ISOLAMENTO: List[str] = [
    "solo", "sola", "solitudine",
    "isolato", "isolata", "isolamento",
    "nessuno mi capisce", "nessuno mi aiuta",
    "abbandonato", "abbandonata",
    "escluso", "esclusa",
    "non ho nessuno",
    "incompreso", "incompresa",
]

# Parole associate a difficoltà emotive più marcate
# ATTENZIONE: queste parole attivano un orientamento più diretto verso supporto psicologico
_PAROLE_DIFFICOLTA_EMOTIVA: List[str] = [
    "piangere", "piango", "ho pianto",
    "non dormo", "insonnia",
    "ansia", "ansioso", "ansiosa",
    "paura di tutto",
    "non riesco a respirare",
    "mi sento male dentro",
    "sto male",
    "soffro",
    "triste", "tristezza",
    "depresso", "depressa",  # NON è una diagnosi: è usato come aggettivo comune
    "voglio sparire",
    "non voglio più",
]


@dataclass
class RisultatoRilevamento:
    """Risultato dell'analisi del messaggio per segnali di disagio.

    Attributes:
        rilevato: True se sono stati trovati segnali di disagio.
        tipo: Tipo di supporto da suggerire.
        intensita: Livello di intensità del segnale (0=nessuno, 1=lieve, 2=moderato).
    """

    rilevato: bool = False
    tipo: TipoSupporto = TipoSupporto.NESSUNO
    intensita: int = 0


def analizza_messaggio(testo: str) -> RisultatoRilevamento:
    """Analizza il testo dell'utente alla ricerca di segnali di disagio.

    L'analisi è esclusivamente keyword-based e non costituisce diagnosi.
    Il risultato viene usato per decidere se orientare l'utente verso
    risorse di supporto umano o psicologico.

    Args:
        testo: Il testo del messaggio dell'utente (in italiano).

    Returns:
        RisultatoRilevamento: Il risultato dell'analisi con tipo e intensità.
    """
    testo_lower = testo.lower()

    # Controlla prima le parole di difficoltà emotiva (priorità più alta)
    for parola in _PAROLE_DIFFICOLTA_EMOTIVA:
        if parola in testo_lower:
            return RisultatoRilevamento(
                rilevato=True,
                tipo=TipoSupporto.ORIENTAMENTO_PSICOLOGICO,
                intensita=2,
            )

    # Poi le parole di isolamento
    for parola in _PAROLE_ISOLAMENTO:
        if parola in testo_lower:
            return RisultatoRilevamento(
                rilevato=True,
                tipo=TipoSupporto.SUPPORTO_UMANO,
                intensita=1,
            )

    # Infine le parole di sconforto (priorità più bassa)
    for parola in _PAROLE_SCONFORTO:
        if parola in testo_lower:
            return RisultatoRilevamento(
                rilevato=True,
                tipo=TipoSupporto.SUPPORTO_UMANO,
                intensita=1,
            )

    return RisultatoRilevamento(rilevato=False)


def genera_messaggio_supporto(tipo: TipoSupporto) -> str:
    """Genera un messaggio empatico di orientamento verso il supporto.

    Il messaggio è calibrato sul tipo di segnale rilevato.
    Non usa mai un linguaggio clinico o diagnostico.

    Args:
        tipo: Il tipo di supporto da suggerire.

    Returns:
        str: Il messaggio di orientamento in italiano, tono empatico.
    """
    if tipo == TipoSupporto.ORIENTAMENTO_PSICOLOGICO:
        return (
            "A Napoli esistono centri di ascolto e orientamento psicologico gratuiti "
            "dove persone qualificate possono affiancarti in questo momento. "
            "Parlare con qualcuno di fiducia può fare davvero la differenza. "
            "Vuoi che ti dica dove puoi rivolgerti?"
        )
    elif tipo == TipoSupporto.SUPPORTO_UMANO:
        return (
            "Ci sono persone che possono aiutarti concretamente: "
            "i centri per l'impiego di Napoli offrono anche supporto personale, "
            "non solo ricerca di lavoro. Non devi affrontare tutto da solo."
        )
    return ""
