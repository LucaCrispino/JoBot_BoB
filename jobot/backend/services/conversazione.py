"""
JoBot — Macchina a Stati Conversazionale.

Gestisce la logica della conversazione tra JoBot e l'utente.
La macchina avanza attraverso quattro stati:

    1. profile_collection → raccoglie nome, zona, competenze, esperienza, preferenze
    2. skills_summary     → mostra la sintesi del profilo raccolto
    3. job_search         → cerca offerte pertinenti e le mostra
    4. support_referral   → orienta verso supporto umano/psicologico se rilevato disagio

Il flusso principale è lineare (1→2→3), ma lo stato support_referral può
essere attivato in qualsiasi momento se vengono rilevati segnali di disagio.
"""

from typing import List, Tuple

from models.schemas import (
    InfoErrore,
    InfoSupporto,
    OffertaLavoro,
    ProfiloUtente,
    RispostaChat,
    StatoConversazione,
    TipoSupporto,
)
from services.rilevamento_disagio import (
    RisultatoRilevamento,
    analizza_messaggio,
    genera_messaggio_supporto,
)
from services.ricerca_lavoro import cerca_offerte
from services.sessione import SessioneConversazionale, ottieni_sessione, salva_sessione


# ============================================================
# Domande per la raccolta del profilo
# ============================================================

_DOMANDE_PROFILO = [
    "Come posso chiamarti? Anche un soprannome va benissimo 😊",
    "In quale zona di Napoli o dintorni ti trovi? (Es. Napoli centro, Pozzuoli, Caserta...)",
    "Quali sono le tue competenze o le cose che sai fare meglio? "
    "Puoi scrivere anche solo parole come 'cuoco', 'guida muletto', 'assistenza anziani'...",
    "Hai già lavorato in passato? Se sì, in cosa? Anche brevemente va bene.",
    "Hai preferenze su come vorresti lavorare? "
    "Per esempio: solo di mattina, vicino casa, part-time, full-time...",
]

_ETICHETTE_FASI = ["nome", "zona", "competenze", "esperienza", "preferenze"]


# ============================================================
# Costruttore risposta helper
# ============================================================


def _costruisci_profilo(sessione: SessioneConversazionale) -> ProfiloUtente:
    """Costruisce il modello ProfiloUtente dalla sessione corrente.

    Args:
        sessione: Sessione conversazionale con i dati raccolti.

    Returns:
        ProfiloUtente: Il profilo nel formato CONTRACT.md.
    """
    return ProfiloUtente(
        name=sessione.nome,
        location=sessione.zona,
        skills=sessione.competenze,
        experience=sessione.esperienza,
        preferences=sessione.preferenze,
    )


# ============================================================
# Gestori dei singoli stati
# ============================================================


def _gestisci_raccolta_profilo(
    messaggio: str,
    sessione: SessioneConversazionale,
) -> Tuple[str, SessioneConversazionale]:
    """Raccoglie progressivamente i campi del profilo utente.

    Args:
        messaggio: Il testo inviato dall'utente.
        sessione: La sessione corrente.

    Returns:
        Tuple[str, SessioneConversazionale]:
            - Il testo della risposta di JoBot.
            - La sessione aggiornata.
    """
    fase = sessione.fase_raccolta

    # Salva la risposta nella fase corretta
    if fase == 0:
        sessione.nome = messaggio.strip()
    elif fase == 1:
        sessione.zona = messaggio.strip()
    elif fase == 2:
        # Divide le competenze per virgola o punto e virgola
        sessione.competenze = [
            c.strip() for c in messaggio.replace(";", ",").split(",") if c.strip()
        ]
    elif fase == 3:
        sessione.esperienza = messaggio.strip()
    elif fase == 4:
        sessione.preferenze = [
            p.strip() for p in messaggio.replace(";", ",").split(",") if p.strip()
        ]

    sessione.fase_raccolta += 1

    # Controlla se la raccolta è completa
    if sessione.fase_raccolta >= len(_DOMANDE_PROFILO):
        # Transizione allo stato successivo
        sessione.stato = StatoConversazione.SINTESI_COMPETENZE
        nome_display = sessione.nome or "caro utente"
        risposta = (
            f"Perfetto, {nome_display}! Ho capito bene quello che mi hai raccontato. "
            "Lascia che ti mostri un riepilogo di quello che so di te, "
            "così possiamo cercare insieme le offerte più adatte."
        )
    else:
        # Prossima domanda
        risposta = _DOMANDE_PROFILO[sessione.fase_raccolta]

        # Personalizza un po' se abbiamo già il nome
        if sessione.nome and sessione.fase_raccolta == 1:
            risposta = f"Piacere di conoscerti, {sessione.nome}! " + risposta

    return risposta, sessione


def _gestisci_sintesi_competenze(
    sessione: SessioneConversazionale,
) -> Tuple[str, SessioneConversazionale]:
    """Genera la sintesi del profilo e invita alla ricerca.

    Args:
        sessione: La sessione corrente con il profilo completo.

    Returns:
        Tuple[str, SessioneConversazionale]:
            - Il testo del messaggio di sintesi.
            - La sessione con stato aggiornato a job_search.
    """
    nome = sessione.nome or "caro utente"
    competenze_str = (
        ", ".join(sessione.competenze) if sessione.competenze else "non specificate"
    )
    zona = sessione.zona or "Napoli"
    esperienza = sessione.esperienza or "non specificata"

    risposta = (
        f"Ecco quello che so di te, {nome}:\n\n"
        f"📍 Zona: {zona}\n"
        f"🔧 Competenze: {competenze_str}\n"
        f"💼 Esperienza: {esperienza}\n"
    )

    if sessione.preferenze:
        risposta += f"⭐ Preferenze: {', '.join(sessione.preferenze)}\n"

    risposta += (
        "\nOra cerco le offerte di lavoro più adatte a te nella tua zona. "
        "Dimmi pure se vuoi cercare per una competenza specifica, "
        "o scrivi 'cerca lavoro' per iniziare!"
    )

    sessione.stato = StatoConversazione.RICERCA_LAVORO
    return risposta, sessione


async def _gestisci_ricerca_lavoro(
    messaggio: str,
    sessione: SessioneConversazionale,
) -> Tuple[str, List[OffertaLavoro], SessioneConversazionale]:
    """Esegue la ricerca offerte e restituisce i risultati.

    Args:
        messaggio: Il testo dell'utente (può contenere keywords specifiche).
        sessione: La sessione corrente.

    Returns:
        Tuple[str, List[OffertaLavoro], SessioneConversazionale]:
            - Il testo del messaggio di JoBot.
            - Lista delle offerte trovate.
            - La sessione aggiornata.
    """
    # Costruisce le keywords: usa il messaggio + le competenze del profilo
    keywords_messaggio = messaggio.lower()
    keywords_profilo = " ".join(sessione.competenze) if sessione.competenze else ""

    # Se il messaggio sembra una richiesta generica, usa il profilo
    termini_generici = {"cerca lavoro", "trova lavoro", "cerca offerte", "mostra offerte", "sì", "si", "ok", "vai"}
    if any(t in keywords_messaggio for t in termini_generici) or len(messaggio.strip()) < 10:
        keywords = keywords_profilo or "lavoro napoli"
    else:
        keywords = keywords_messaggio

    zona = sessione.zona or "Napoli"
    offerte = await cerca_offerte(keywords=keywords, location=zona)

    if offerte:
        nome = sessione.nome or "caro utente"
        risposta = (
            f"Ho trovato {len(offerte)} offerta{'e' if len(offerte) > 1 else ''} "
            f"che potrebbe{'ro' if len(offerte) > 1 else ''} fare al caso tuo, {nome}! "
            "Dai un'occhiata qui sotto e dimmi se vuoi cercare qualcos'altro."
        )
    else:
        risposta = (
            "Non ho trovato offerte specifiche per le tue ricerche al momento. "
            "Prova a dirmi un'altra competenza o un altro tipo di lavoro "
            "e vedrò cosa riesco a trovare per te!"
        )

    return risposta, offerte, sessione


# ============================================================
# Gestore principale della conversazione
# ============================================================


async def elabora_messaggio(
    messaggio: str,
    session_id: str,
) -> RispostaChat:
    """Entry point principale: elabora un messaggio e restituisce la risposta.

    Questa funzione:
    1. Recupera la sessione dal store.
    2. Controlla se ci sono segnali di disagio (ha priorità sullo stato corrente).
    3. Delega allo stato corrente della macchina.
    4. Salva la sessione aggiornata.
    5. Restituisce la risposta nel formato CONTRACT.md.

    Args:
        messaggio: Il testo dell'utente.
        session_id: Identificatore della sessione.

    Returns:
        RispostaChat: La risposta completa nel formato CONTRACT.md.
    """
    sessione = ottieni_sessione(session_id)
    sessione.turni += 1

    offerte: List[OffertaLavoro] = []
    info_supporto = InfoSupporto()

    # --- Rilevamento disagio (ha la precedenza su qualsiasi stato) ---
    rilevamento: RisultatoRilevamento = analizza_messaggio(messaggio)

    if rilevamento.rilevato:
        # Orienta verso il supporto senza cambiare lo stato permanentemente
        # (l'utente potrà continuare a cercare lavoro dopo)
        messaggio_supporto = genera_messaggio_supporto(rilevamento.tipo)
        nome = sessione.nome or "caro utente"

        if rilevamento.intensita >= 2:
            testo_risposta = (
                f"Capisco che le cose possano sembrare molto pesanti in questo momento, {nome}. "
                "Sono qui con te. "
                "Vuoi che cerchiamo insieme un posto dove parlare con qualcuno di fiducia?"
            )
        else:
            testo_risposta = (
                f"Sento che stai attraversando un momento non facile, {nome}. "
                "È normale sentirsi così a volte. "
                "Sono qui per aiutarti, e ci sono anche persone in carne e ossa che possono farlo."
            )

        info_supporto = InfoSupporto(
            suggested=True,
            message=messaggio_supporto,
            type=rilevamento.tipo,
        )

        # Trasizione allo stato di supporto solo se è la prima volta
        if sessione.stato != StatoConversazione.SUPPORTO:
            sessione.stato = StatoConversazione.SUPPORTO

        salva_sessione(session_id, sessione)

        return RispostaChat(
            message=testo_risposta,
            state=StatoConversazione.SUPPORTO,
            profile=_costruisci_profilo(sessione),
            jobs=[],
            support=info_supporto,
            error=InfoErrore(),
        )

    # --- Macchina a stati normale ---

    if sessione.stato == StatoConversazione.RACCOLTA_PROFILO:
        testo_risposta, sessione = _gestisci_raccolta_profilo(messaggio, sessione)

        # Se dopo la raccolta siamo passati a skills_summary, processa subito
        if sessione.stato == StatoConversazione.SINTESI_COMPETENZE:
            # Mostra prima la sintesi, poi al prossimo turno parte la ricerca
            testo_risposta, sessione = _gestisci_sintesi_competenze(sessione)

    elif sessione.stato == StatoConversazione.SINTESI_COMPETENZE:
        # Questo stato dura solo un turno; passiamo subito alla ricerca
        testo_risposta, offerte, sessione = await _gestisci_ricerca_lavoro(messaggio, sessione)

    elif sessione.stato == StatoConversazione.RICERCA_LAVORO:
        testo_risposta, offerte, sessione = await _gestisci_ricerca_lavoro(messaggio, sessione)

    elif sessione.stato == StatoConversazione.SUPPORTO:
        # Dopo il messaggio di supporto, l'utente può riprendere la conversazione
        # Torniamo allo stato di ricerca se il profilo è già completo, altrimenti riprendiamo la raccolta
        if sessione.nome and sessione.zona:
            sessione.stato = StatoConversazione.RICERCA_LAVORO
            testo_risposta, offerte, sessione = await _gestisci_ricerca_lavoro(messaggio, sessione)
        else:
            sessione.stato = StatoConversazione.RACCOLTA_PROFILO
            testo_risposta = (
                "Quando ti senti pronto, sono qui per aiutarti. "
                "Possiamo ricominciare dalla tua ricerca di lavoro. " +
                _DOMANDE_PROFILO[sessione.fase_raccolta]
            )
    else:
        # Stato sconosciuto — non dovrebbe mai accadere
        testo_risposta = "Sono qui! Come posso aiutarti oggi?"

    salva_sessione(session_id, sessione)

    return RispostaChat(
        message=testo_risposta,
        state=sessione.stato,
        profile=_costruisci_profilo(sessione),
        jobs=offerte,
        support=info_supporto,
        error=InfoErrore(),
    )


async def avvia_conversazione(session_id: str) -> RispostaChat:
    """Genera il messaggio di benvenuto per una nuova sessione.

    Chiamato quando il frontend avvia una nuova chat senza inviare
    un messaggio utente (es. apertura dell'app).

    Args:
        session_id: Identificatore della nuova sessione.

    Returns:
        RispostaChat: Il messaggio di benvenuto nel formato CONTRACT.md.
    """
    # Crea una sessione nuova
    sessione = ottieni_sessione(session_id)
    salva_sessione(session_id, sessione)

    messaggio_benvenuto = (
        "Ciao! 👋 Sono JoBot, il tuo assistente per trovare lavoro nell'area di Napoli.\n\n"
        "Sono qui per aiutarti passo dopo passo, senza fretta. "
        "Possiamo parlare in modo semplice, non ci sono risposte giuste o sbagliate.\n\n"
        + _DOMANDE_PROFILO[0]
    )

    return RispostaChat(
        message=messaggio_benvenuto,
        state=StatoConversazione.RACCOLTA_PROFILO,
        profile=_costruisci_profilo(sessione),
        jobs=[],
        support=InfoSupporto(),
        error=InfoErrore(),
    )
