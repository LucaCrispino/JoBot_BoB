"""
JoBot — Configurazione centralizzata dell'applicazione.

Legge le variabili d'ambiente dal file .env tramite Pydantic Settings.
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Impostazioni(BaseSettings):
    """Impostazioni dell'applicazione caricate dall'ambiente.

    Ogni attributo corrisponde a una variabile d'ambiente.
    I valori di default permettono l'avvio senza file .env (modalità demo).
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- App ---
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_debug: bool = True
    cors_origins: str = "http://localhost:8081,http://localhost:19006,exp://localhost:8081"

    # --- LLM ---
    # TODO (Milestone 2): usato quando si integra il provider LLM
    llm_provider: str = "openai"
    llm_model: str = "gpt-4o"
    openai_api_key: str = ""

    # --- API Aggregatori Lavoro ---
    # TODO (Milestone 2): usato quando si integrano le API di lavoro esterne
    adzuna_app_id: str = ""
    adzuna_app_key: str = ""
    adzuna_country: str = "it"
    infojobs_client_id: str = ""
    infojobs_client_secret: str = ""
    careerjet_locale: str = "it_IT"
    careerjet_affid: str = ""

    # --- Database ---
    # TODO (Milestone 1): configurare PostgreSQL
    database_url: str = ""

    # --- Redis ---
    # TODO (Milestone 1): configurare Redis
    redis_url: str = ""

    # --- Sicurezza ---
    # TODO (Milestone 1): configurare JWT
    jwt_secret_key: str = "jobot-demo-secret-non-usare-in-produzione"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    # --- GDPR ---
    audit_log_enabled: bool = True
    pseudonymize_prompts: bool = True

    # --- Timeout ---
    http_timeout: int = 5

    @property
    def cors_origins_list(self) -> List[str]:
        """Converte la stringa CORS_ORIGINS in lista.

        Returns:
            List[str]: Lista degli URL di origine consentiti.
        """
        return [origin.strip() for origin in self.cors_origins.split(",")]


@lru_cache(maxsize=1)
def get_settings() -> Impostazioni:
    """Restituisce l'istanza singleton delle impostazioni.

    Utilizza lru_cache per caricare le impostazioni una sola volta
    durante il ciclo di vita dell'applicazione.

    Returns:
        Impostazioni: L'istanza delle impostazioni dell'applicazione.
    """
    return Impostazioni()
