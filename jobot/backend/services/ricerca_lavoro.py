"""
JoBot — Servizio di ricerca offerte di lavoro.

Per il prototipo MVP, la ricerca viene eseguita sui dati mock locali
(data/offerte_mock.json). La struttura è predisposta per l'integrazione
futura con le API di InfoJobs, Adzuna e CareerJet tramite la classe
astratta BaseJobAggregator.
"""

import json
import os
from abc import ABC, abstractmethod
from typing import List

import httpx

from models.schemas import FonteOfferta, OffertaLavoro


# ============================================================
# Interfaccia astratta per i futuri aggregatori
# ============================================================


class BaseJobAggregator(ABC):
    """Interfaccia comune per tutti gli aggregatori di offerte di lavoro.

    Ogni aggregatore esterno (InfoJobs, Adzuna, CareerJet) deve implementare
    questa classe astratta. Questo garantisce che il servizio di ricerca possa
    chiamare qualsiasi aggregatore in modo intercambiabile.

    TODO (Milestone 2): implementare le classi concrete per:
        - AdzunaAggregator: https://developer.adzuna.com/
        - InfoJobsAggregator: https://developer.infojobs.net/
        - CareerJetAggregator: https://www.careerjet.it/partners/

    Esempio di implementazione futura:
        class AdzunaAggregator(BaseJobAggregator):
            async def cerca(self, keywords: str, location: str) -> List[OffertaLavoro]:
                async with httpx.AsyncClient(timeout=5) as client:
                    risposta = await client.get(
                        "https://api.adzuna.com/v1/api/jobs/it/search/1",
                        params={"what": keywords, "where": location, ...}
                    )
                    return [normalizza_adzuna(offerta) for offerta in risposta.json()["results"]]
    """

    @abstractmethod
    async def cerca(self, keywords: str, location: str) -> List[OffertaLavoro]:
        """Cerca offerte di lavoro per parole chiave e zona.

        Args:
            keywords: Parole chiave per la ricerca (es. 'magazziniere').
            location: Zona geografica (es. 'Napoli').

        Returns:
            List[OffertaLavoro]: Lista di offerte normalizzate.

        Raises:
            httpx.TimeoutException: Se la richiesta supera il timeout.
            httpx.HTTPError: Se la risposta è un errore HTTP.
        """
        ...


# ============================================================
# Aggregatore mock (dati locali — per il prototipo MVP)
# ============================================================


class MockAggregator(BaseJobAggregator):
    """Aggregatore che restituisce dati mock locali dal file JSON.

    Usato per il prototipo: non richiede API key né connessione internet.
    La ricerca è semplice: filtra le offerte che contengono le parole
    chiave nei keywords dell'offerta o nel titolo/descrizione.
    """

    def __init__(self) -> None:
        """Carica le offerte mock dal file JSON all'inizializzazione."""
        percorso = os.path.join(os.path.dirname(__file__), "..", "data", "offerte_mock.json")
        with open(percorso, encoding="utf-8") as f:
            self._offerte_raw = json.load(f)

    async def cerca(self, keywords: str, location: str) -> List[OffertaLavoro]:
        """Cerca nelle offerte mock in base a parole chiave e zona.

        La ricerca è case-insensitive e cerca sia nei keywords dell'offerta
        che nel titolo e nella descrizione.

        Args:
            keywords: Parole chiave per la ricerca.
            location: Zona geografica (attualmente non filtrata nei mock).

        Returns:
            List[OffertaLavoro]: Lista di offerte corrispondenti (max 5).
        """
        keywords_lower = keywords.lower()
        parole = [p.strip() for p in keywords_lower.split() if len(p.strip()) > 2]

        risultati: List[OffertaLavoro] = []

        for offerta_raw in self._offerte_raw:
            testo_offerta = " ".join([
                offerta_raw.get("title", ""),
                offerta_raw.get("description", ""),
                " ".join(offerta_raw.get("keywords", [])),
            ]).lower()

            # Controlla se almeno una parola chiave corrisponde
            if any(parola in testo_offerta for parola in parole):
                risultati.append(
                    OffertaLavoro(
                        title=offerta_raw["title"],
                        company=offerta_raw["company"],
                        location=offerta_raw["location"],
                        description=offerta_raw["description"],
                        source=FonteOfferta.MOCK,
                        url=offerta_raw["url"],
                        published_at=offerta_raw.get("published_at", ""),
                    )
                )

        # Restituisce le prime 5 offerte corrispondenti
        return risultati[:5]


# ============================================================
# Aggregatori stub per futura integrazione
# ============================================================


class AdzunaAggregator(BaseJobAggregator):
    """Aggregatore Adzuna — stub predisposto per l'integrazione futura.

    TODO (Milestone 2): implementare la logica di chiamata all'API Adzuna.
    Endpoint: https://api.adzuna.com/v1/api/jobs/it/search/1
    Documentazione: https://developer.adzuna.com/
    Credenziali richieste: ADZUNA_APP_ID, ADZUNA_APP_KEY
    """

    def __init__(self, app_id: str, app_key: str, country: str = "it") -> None:
        """Inizializza il client Adzuna.

        Args:
            app_id: ID applicazione Adzuna.
            app_key: Chiave API Adzuna.
            country: Codice paese (default: 'it' per Italia).
        """
        self._app_id = app_id
        self._app_key = app_key
        self._country = country
        # TODO (Milestone 2): inizializzare httpx.AsyncClient con timeout configurabile

    async def cerca(self, keywords: str, location: str) -> List[OffertaLavoro]:
        """TODO (Milestone 2): implementare la chiamata all'API Adzuna.

        Questo stub restituisce una lista vuota per non bloccare il prototipo.
        Quando le credenziali non sono configurate, il sistema ricade sui mock.

        Args:
            keywords: Parole chiave per la ricerca.
            location: Zona geografica.

        Returns:
            List[OffertaLavoro]: Lista vuota (stub).
        """
        # TODO (Milestone 2): implementare con:
        # async with httpx.AsyncClient(timeout=5.0) as client:
        #     params = {
        #         "app_id": self._app_id,
        #         "app_key": self._app_key,
        #         "what": keywords,
        #         "where": location,
        #         "results_per_page": 10,
        #         "content-type": "application/json",
        #     }
        #     resp = await client.get(
        #         f"https://api.adzuna.com/v1/api/jobs/{self._country}/search/1",
        #         params=params,
        #     )
        #     resp.raise_for_status()
        #     return [_normalizza_adzuna(r) for r in resp.json().get("results", [])]
        return []


class InfoJobsAggregator(BaseJobAggregator):
    """Aggregatore InfoJobs — stub predisposto per l'integrazione futura.

    TODO (Milestone 2): implementare la logica di chiamata all'API InfoJobs.
    Endpoint: https://api.infojobs.net/api/7/offer
    Documentazione: https://developer.infojobs.net/
    Credenziali richieste: INFOJOBS_CLIENT_ID, INFOJOBS_CLIENT_SECRET
    """

    def __init__(self, client_id: str, client_secret: str) -> None:
        """Inizializza il client InfoJobs.

        Args:
            client_id: Client ID OAuth InfoJobs.
            client_secret: Client Secret OAuth InfoJobs.
        """
        self._client_id = client_id
        self._client_secret = client_secret

    async def cerca(self, keywords: str, location: str) -> List[OffertaLavoro]:
        """TODO (Milestone 2): implementare la chiamata all'API InfoJobs.

        Args:
            keywords: Parole chiave per la ricerca.
            location: Zona geografica.

        Returns:
            List[OffertaLavoro]: Lista vuota (stub).
        """
        # TODO (Milestone 2): implementare autenticazione OAuth e chiamata API
        return []


class CareerJetAggregator(BaseJobAggregator):
    """Aggregatore CareerJet — stub predisposto per l'integrazione futura.

    TODO (Milestone 2): implementare la logica di chiamata all'API CareerJet.
    Endpoint: https://www.careerjet.it/jobs/api
    Documentazione: https://www.careerjet.it/partners/
    Credenziali richieste: CAREERJET_AFFID, CAREERJET_LOCALE
    """

    def __init__(self, affid: str, locale: str = "it_IT") -> None:
        """Inizializza il client CareerJet.

        Args:
            affid: ID affiliazione CareerJet.
            locale: Locale della ricerca (default: 'it_IT').
        """
        self._affid = affid
        self._locale = locale

    async def cerca(self, keywords: str, location: str) -> List[OffertaLavoro]:
        """TODO (Milestone 2): implementare la chiamata all'API CareerJet.

        Args:
            keywords: Parole chiave per la ricerca.
            location: Zona geografica.

        Returns:
            List[OffertaLavoro]: Lista vuota (stub).
        """
        # TODO (Milestone 2): implementare con httpx.AsyncClient
        return []


# ============================================================
# Funzione principale di ricerca (entry point del servizio)
# ============================================================


async def cerca_offerte(keywords: str, location: str = "Napoli") -> List[OffertaLavoro]:
    """Cerca offerte di lavoro tramite tutti gli aggregatori disponibili.

    Per il prototipo MVP usa solo i dati mock. In futuro, questa funzione
    chiamerà gli aggregatori reali in parallelo tramite asyncio.gather()
    e de-duplicherà i risultati per URL.

    Args:
        keywords: Parole chiave per la ricerca (es. 'magazziniere').
        location: Zona geografica (default: 'Napoli').

    Returns:
        List[OffertaLavoro]: Lista combinata e de-duplicata di offerte.
    """
    aggregatore = MockAggregator()
    risultati = await aggregatore.cerca(keywords, location)

    # TODO (Milestone 2): sostituire con chiamata parallela a tutti gli aggregatori:
    # import asyncio
    # aggregatori = [MockAggregator(), AdzunaAggregator(...), InfoJobsAggregator(...), CareerJetAggregator(...)]
    # tutti_risultati = await asyncio.gather(*[a.cerca(keywords, location) for a in aggregatori], return_exceptions=True)
    # # Filtra gli errori, de-duplica per URL, ordina per data
    # risultati = deduplica_per_url(filtra_validi(tutti_risultati))

    return risultati
