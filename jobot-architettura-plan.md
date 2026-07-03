# JoBot — Documento di Design Architetturale (MVP)

> **Versione:** 0.1 — Fase di Pianificazione  
> **Lingua:** Italiano  
> **Ambito:** Piattaforma ibrida psicologico-AI per il reinserimento lavorativo nell'area metropolitana di Napoli

---

## Panoramica Generale

JoBot è una piattaforma ibrida che affianca il supporto psicologico umano a un agente IA conversazionale. L'obiettivo primario è abbattere le barriere tecnologiche per categorie vulnerabili, guidandole nella ricerca attiva di lavoro attraverso un'interfaccia mobile accessibile. Il backend espone servizi REST tramite FastAPI; l'orchestrazione dell'agente avviene con LangChain; il frontend è un'app React Native (Expo). Le offerte di lavoro vengono aggregate da InfoJobs, Adzuna e CareerJet.

Tutti i componenti devono rispettare i vincoli trasversali di:
- **Accessibilità**: WCAG 2.1 AA come riferimento progettuale per il frontend
- **Privacy e sicurezza**: conformità GDPR per dati personali e storico conversazioni
- **Scalabilità orizzontale**: ogni servizio stateless deve poter essere replicato dietro un load balancer
- **Inclusività**: UI/UX pensata per utenti con bassa alfabetizzazione digitale

---

## Sezione 1 — Architettura Logica

### 1.1 Componenti Principali

#### Frontend Mobile (React Native / Expo)
- **Responsabilità**: interfaccia conversazionale utente, raccolta preferenze lavorative, visualizzazione offerte, accessibilità WCAG 2.1 AA
- **Tecnologia**: TypeScript + Expo SDK (target iOS e Android)
- **Protocollo verso il backend**: REST/HTTPS per le chiamate standard; WebSocket (o Server-Sent Events) per lo streaming della risposta dell'agente
- **Note di accessibilità**: componenti con etichette `accessibilityLabel`, contrasto colori ≥ 4.5:1, font scalabile, navigazione con screen reader

#### API Gateway
- **Responsabilità**: punto di ingresso unico, autenticazione JWT, rate limiting, routing verso i microservizi interni, logging centralizzato delle richieste
- **Tecnologia**: Nginx (con modulo Lua o OpenResty) oppure Kong OSS — entrambi deployabili come container Docker
- **Protocollo in entrata**: HTTPS (TLS 1.3)
- **Protocollo in uscita verso il backend**: HTTP interno su rete Docker/Kubernetes

#### Backend FastAPI
- **Responsabilità**: validazione input, gestione sessioni utente, orchestrazione delle chiamate all'agente, persistenza dei dati su database, esposizione degli endpoint REST
- **Tecnologia**: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.x (async), Alembic per le migrazioni
- **Protocollo verso l'agente**: chiamata in-process (libreria LangChain importata direttamente) oppure chiamata HTTP interna se l'agente viene estratto in microservizio separato — per l'MVP si preferisce in-process per semplicità
- **Protocollo verso il DB**: driver asincrono (asyncpg per PostgreSQL)

#### Agente LangChain
- **Responsabilità**: interpretazione dell'intento utente, selezione degli strumenti (tool selection), costruzione del prompt, chiamata all'LLM, parsing della risposta, aggregazione dei risultati dalle API di lavoro
- **Tecnologia**: LangChain (Python), architettura ReAct o OpenAI Function Calling; strumenti (Tools) definiti come classi Python che wrappano le chiamate alle API di terze parti
- **Protocollo verso l'LLM**: HTTPS verso API OpenAI (o provider compatibile, es. Anthropic, Mistral)
- **Protocollo verso le API di lavoro**: HTTP/REST verso InfoJobs, Adzuna, CareerJet

#### Modulo LLM
- **Responsabilità**: inferenza linguistica, generazione del testo conversazionale, comprensione del linguaggio naturale in italiano
- **Tecnologia**: OpenAI GPT-4o (default) con supporto per modelli alternativi tramite interfaccia LangChain `BaseChatModel`; configurazione del modello tramite variabile d'ambiente `LLM_PROVIDER`
- **Protocollo**: HTTPS verso endpoint provider esterno
- **Considerazione GDPR**: nessun dato personale identificativo deve essere incluso nel prompt inviato al provider esterno; pseudonimizzazione obbligatoria

#### Database — Layer di Persistenza (tre strati distinti)

| Tipo | Tecnologia | Ruolo |
|---|---|---|
| **Relazionale** | PostgreSQL 16 | Profilo utente, cronologia sessioni, preferenze lavorative, log di audit per GDPR |
| **Vettoriale** | Pgvector (estensione PostgreSQL) oppure Qdrant | Embedding delle conversazioni per memoria semantica dell'agente a lungo termine |
| **Cache** | Redis 7 | Cache delle risposte delle API di lavoro (TTL breve, es. 15 min), sessioni temporanee, rate-limiting state |

**Motivazione della scelta**: PostgreSQL con pgvector riduce la complessità operativa mantenendo un unico motore per dati relazionali e vettoriali. Qdrant è l'alternativa da valutare se il volume di embedding supera le capacità di pgvector in produzione.

#### Layer di Integrazione API Terze Parti
- **Responsabilità**: chiamate HTTP verso InfoJobs API, Adzuna API, CareerJet XML/REST feed; normalizzazione delle risposte in un formato interno comune (`JobOffer` schema Pydantic); gestione errori, timeout e circuit breaker
- **Tecnologia**: `httpx` (client HTTP asincrono Python), `tenacity` per retry con backoff esponenziale, schema Pydantic per la normalizzazione
- **Pattern**: ogni aggregatore è implementato come classe separata che implementa un'interfaccia comune `BaseJobAggregator`

---

### 1.2 Schema a Blocchi dell'Architettura (ASCII)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          LAYER PRESENTAZIONE                                 │
│                                                                              │
│   ┌───────────────────────────────────────────────────────────────────────┐  │
│   │              App Mobile React Native / Expo (TypeScript)              │  │
│   │   Chat UI · Accessibilità WCAG 2.1 AA · Profilo Utente · Offerte      │  │
│   └────────────────────────────┬──────────────────────────────────────────┘  │
└────────────────────────────────┼─────────────────────────────────────────────┘
                                 │ HTTPS / WebSocket (TLS 1.3)
┌────────────────────────────────▼─────────────────────────────────────────────┐
│                              API GATEWAY                                     │
│            Nginx / Kong — Auth JWT · Rate Limiting · Routing                 │
└────────────────────────────────┬─────────────────────────────────────────────┘
                                 │ HTTP (rete interna)
┌────────────────────────────────▼─────────────────────────────────────────────┐
│                         BACKEND FastAPI (Python)                             │
│   REST Endpoints · Validazione Pydantic · Gestione Sessioni · ORM Async      │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                       AGENTE LangChain                              │    │
│   │  ReAct / Function Calling · Tool Selection · Prompt Construction    │    │
│   │                                                                     │    │
│   │   ┌──────────────┐    ┌───────────────────────────────────────┐    │    │
│   │   │  Modulo LLM  │    │     Tools — API Aggregatori           │    │    │
│   │   │  GPT-4o /    │    │  InfoJobs · Adzuna · CareerJet        │    │    │
│   │   │  API OpenAI  │    │  (BaseJobAggregator + httpx)          │    │    │
│   │   └──────┬───────┘    └──────────────┬────────────────────────┘    │    │
│   └──────────┼───────────────────────────┼─────────────────────────────┘    │
└──────────────┼───────────────────────────┼──────────────────────────────────┘
               │ HTTPS (esterno)           │ HTTPS (esterno)
      ┌────────▼────────┐        ┌─────────▼──────────────────────────┐
      │  Provider LLM   │        │     API Terze Parti (Job Market)    │
      │  OpenAI/Anthropic│       │  InfoJobs · Adzuna · CareerJet      │
      └─────────────────┘        └────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                          LAYER PERSISTENZA                                   │
│                                                                              │
│  ┌─────────────────────┐  ┌───────────────────────┐  ┌──────────────────┐   │
│  │  PostgreSQL 16       │  │  Pgvector / Qdrant    │  │  Redis 7         │   │
│  │  (Dati relazionali) │  │  (Memoria semantica)  │  │  (Cache / Rate)  │   │
│  └─────────────────────┘  └───────────────────────┘  └──────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### 1.3 Rischi Architetturali e Strategie di Mitigazione

| Rischio | Gravità | Strategia di Mitigazione |
|---|---|---|
| Dipendenza da provider LLM esterno (OpenAI) | Alta | Interfaccia `BaseChatModel` di LangChain; configurazione del provider tramite env var; test con modello locale (Ollama) in sviluppo |
| Indisponibilità simultanea delle API di lavoro | Alta | Circuit breaker per aggregatore; fallback a risposta parziale con messaggio esplicito all'utente; cache Redis delle ultime risposte valide |
| Trasmissione di dati personali all'LLM (GDPR) | Alta | Pipeline di pseudonimizzazione prima della costruzione del prompt; audit log su PostgreSQL di ogni chiamata all'LLM |
| Scalabilità del backend sotto carico | Media | FastAPI + Uvicorn/Gunicorn multi-worker; deploy containerizzato con replica orizzontale; sessioni stateless (JWT + Redis) |
| Accessibilità per utenti con bassa alfabetizzazione digitale | Media | Test di usabilità con utenti target; componenti Expo accessibili by default; messaggi di errore semplici e in italiano |
| Sicurezza delle chiavi API terze parti | Media | Secrets gestiti tramite variabili d'ambiente cifrate (es. HashiCorp Vault o segreti Docker/K8s); rotazione periodica |

---

## Sezione 2 — Struttura delle Cartelle (Monorepo)

```
jobot/                                    # Root del monorepo
│
├── .github/                              # CI/CD GitHub Actions
│   └── workflows/
│       ├── backend-ci.yml                # Lint, test, typecheck Python
│       └── mobile-ci.yml                 # Lint, test TypeScript / Expo
│
├── apps/                                 # Applicazioni deployabili
│   ├── backend/                          # Servizio Python FastAPI + Agente LangChain
│   │   ├── src/
│   │   │   ├── api/                      # Router FastAPI (endpoint REST)
│   │   │   │   ├── __init__.py
│   │   │   │   ├── v1/
│   │   │   │   │   ├── chat.py           # Endpoint /v1/chat (streaming e sincrono)
│   │   │   │   │   ├── jobs.py           # Endpoint /v1/jobs (ricerca offerte)
│   │   │   │   │   └── users.py          # Endpoint /v1/users (profilo utente)
│   │   │   ├── agent/                    # Logica agente LangChain
│   │   │   │   ├── __init__.py
│   │   │   │   ├── agent.py              # Definizione agente ReAct / Function Calling
│   │   │   │   ├── prompts.py            # Template di prompt (system, user, few-shot)
│   │   │   │   ├── tools/                # Tools LangChain (wrappano le API di lavoro)
│   │   │   │   │   ├── infojobs_tool.py
│   │   │   │   │   ├── adzuna_tool.py
│   │   │   │   │   └── careerjet_tool.py
│   │   │   │   └── memory.py             # Gestione memoria conversazionale (pgvector)
│   │   │   ├── integrations/             # Client HTTP verso API terze parti
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py               # Interfaccia BaseJobAggregator + schema JobOffer
│   │   │   │   ├── infojobs.py           # Client InfoJobs API
│   │   │   │   ├── adzuna.py             # Client Adzuna API
│   │   │   │   └── careerjet.py          # Client CareerJet API
│   │   │   ├── db/                       # Strato persistenza
│   │   │   │   ├── __init__.py
│   │   │   │   ├── models.py             # Modelli SQLAlchemy (User, Session, Message)
│   │   │   │   ├── session.py            # Factory sessione asincrona asyncpg
│   │   │   │   └── migrations/           # Script Alembic
│   │   │   │       └── versions/
│   │   │   ├── core/                     # Configurazione, sicurezza, utility
│   │   │   │   ├── config.py             # Pydantic Settings (lettura da .env)
│   │   │   │   ├── security.py           # JWT, hashing password, pseudonimizzazione
│   │   │   │   ├── logging.py            # Configurazione logging strutturato (JSON)
│   │   │   │   └── exceptions.py         # Eccezioni custom e handler FastAPI
│   │   │   └── main.py                   # Entry point FastAPI (app factory)
│   │   ├── tests/                        # Test Python (pytest)
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   ├── pyproject.toml                # Dipendenze Python (uv / poetry)
│   │   ├── Dockerfile                    # Immagine Docker backend
│   │   └── .env.example                  # Variabili d'ambiente di esempio
│   │
│   └── mobile/                           # App React Native / Expo (TypeScript)
│       ├── src/
│       │   ├── app/                      # Expo Router — struttura file-based routing
│       │   │   ├── (tabs)/
│       │   │   │   ├── chat.tsx          # Schermata chat principale
│       │   │   │   ├── jobs.tsx          # Lista offerte di lavoro
│       │   │   │   └── profile.tsx       # Profilo utente e preferenze
│       │   │   ├── _layout.tsx           # Layout radice con provider
│       │   │   └── index.tsx             # Schermata di benvenuto / onboarding
│       │   ├── components/               # Componenti UI riutilizzabili
│       │   │   ├── chat/
│       │   │   │   ├── ChatBubble.tsx    # Bolla messaggio (con accessibilityLabel)
│       │   │   │   └── ChatInput.tsx     # Campo di input con accessibilità
│       │   │   ├── jobs/
│       │   │   │   └── JobCard.tsx       # Card offerta di lavoro
│       │   │   └── common/
│       │   │       ├── Button.tsx        # Bottone accessibile (contrast ratio ≥ 4.5:1)
│       │   │       └── LoadingSpinner.tsx
│       │   ├── hooks/                    # Custom React hooks
│       │   │   ├── useChat.ts            # Hook per gestione stato chat + WebSocket
│       │   │   └── useAuth.ts            # Hook per autenticazione JWT
│       │   ├── services/                 # Client API verso il backend
│       │   │   ├── api.ts                # Configurazione axios / fetch base URL
│       │   │   ├── chatService.ts        # Chiamate agli endpoint /v1/chat
│       │   │   └── jobsService.ts        # Chiamate agli endpoint /v1/jobs
│       │   ├── store/                    # Stato globale (Zustand o Redux Toolkit)
│       │   │   ├── authStore.ts
│       │   │   └── chatStore.ts
│       │   ├── theme/                    # Design system — colori, tipografia, spacing
│       │   │   └── index.ts
│       │   └── types/                    # Definizioni TypeScript condivise
│       │       └── index.ts
│       ├── assets/                       # Immagini, icone, font
│       ├── app.json                      # Configurazione Expo
│       ├── package.json                  # Dipendenze Node (workspace)
│       ├── tsconfig.json                 # Configurazione TypeScript
│       └── .env.example
│
├── packages/                             # Librerie condivise (opzionale, per future espansioni)
│   └── shared-types/                     # Tipi TypeScript condivisi tra frontend e altri pkg
│       ├── src/
│       │   └── index.ts
│       └── package.json
│
├── infra/                                # Infrastruttura e deploy
│   ├── docker/
│   │   └── nginx/
│   │       └── nginx.conf                # Configurazione API Gateway Nginx
│   └── k8s/                              # Manifesti Kubernetes (per produzione)
│       ├── backend-deployment.yaml
│       └── redis-deployment.yaml
│
├── docs/                                 # Documentazione tecnica
│   ├── jobot-architettura-plan.md        # Questo documento
│   └── adr/                              # Architecture Decision Records
│       └── 001-llm-provider.md
│
├── docker-compose.yml                    # Orchestrazione locale completa (dev)
├── docker-compose.override.yml           # Override per sviluppo locale (hot-reload)
├── package.json                          # Root package.json per npm workspaces
├── .env.example                          # Variabili d'ambiente globali di esempio
├── .gitignore
└── README.md
```

### 2.1 File di Configurazione Chiave

#### `docker-compose.yml` (radice) — ruolo: orchestrazione locale completa
Definisce i servizi `backend`, `postgres`, `redis` (e opzionalmente `qdrant`), le reti interne Docker e i volumi persistenti per il database.

#### `pyproject.toml` (`apps/backend/`) — ruolo: dipendenze e tooling Python
Gestito con `uv` (alternativa moderna a pip/poetry). Contiene le dipendenze principali (`fastapi`, `langchain`, `sqlalchemy`, `asyncpg`, `httpx`, `tenacity`, `pydantic-settings`) e i gruppi di dipendenze opzionali per test e linting.

#### `package.json` (radice) — ruolo: workspace npm
Dichiara `workspaces: ["apps/mobile", "packages/*"]` per abilitare la condivisione di dipendenze Node e script unificati (`npm run lint`, `npm run test`).

#### `.env.example` (radice e per app) — ruolo: documentazione dei segreti
Elenca tutte le variabili d'ambiente richieste con valori placeholder. **Mai committare file `.env` con valori reali.** Variabili critiche:
```
# LLM
OPENAI_API_KEY=sk-...
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/jobot
REDIS_URL=redis://localhost:6379/0

# API Aggregatori
INFOJOBS_CLIENT_ID=...
INFOJOBS_CLIENT_SECRET=...
ADZUNA_APP_ID=...
ADZUNA_APP_KEY=...
CAREERJET_LOCALE=it_IT

# Sicurezza
JWT_SECRET_KEY=...
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60

# GDPR
AUDIT_LOG_ENABLED=true
PSEUDONYMIZE_PROMPTS=true
```

---

## Sezione 3 — Flusso dei Dati (Data Flow)

### 3.1 Descrizione Sequenziale del Ciclo Completo

**Fase 1 — Input Utente (Mobile)**
1. L'utente digita un messaggio nel campo chat dell'app Expo (es. *"Cerca lavoro come magazziniere a Napoli"*).
2. Il componente `ChatInput.tsx` cattura l'evento `onSubmit`; il hook `useChat.ts` invoca `chatService.sendMessage()`.
3. L'app apre una connessione WebSocket (o SSE) verso `wss://api.jobot.app/v1/chat/stream` per ricevere la risposta in streaming, migliorando la percezione di reattività.

**Fase 2 — Gateway e Autenticazione**
4. La richiesta raggiunge l'API Gateway (Nginx). Il middleware verifica il token JWT nell'header `Authorization: Bearer <token>`.
5. Se il token è valido, la richiesta viene inoltrata al backend FastAPI; in caso di token scaduto, viene restituito HTTP 401 e l'app esegue il token refresh automatico.

**Fase 3 — Backend FastAPI**
6. Il router `/v1/chat` riceve la richiesta; Pydantic valida il payload (`user_id`, `session_id`, `message`).
7. Il backend recupera la cronologia della sessione da Redis (cache) o da PostgreSQL (persistenza), costruisce il contesto conversazionale.
8. Viene invocata la funzione `run_agent(message, session_context)` del modulo agente LangChain.

**Fase 4 — Elaborazione Agente LangChain**
9. L'agente riceve il messaggio e il contesto. Il prompt di sistema definisce il ruolo (*assistente empatico per la ricerca di lavoro, risponde in italiano, target utenti vulnerabili*).
10. L'LLM (GPT-4o) analizza l'intento: classifica la richiesta come ricerca di offerte di lavoro.
11. **Tool Selection**: l'agente seleziona il tool `SearchJobsTool` e costruisce la query strutturata (`{"keywords": "magazziniere", "location": "Napoli"}`).
12. Il tool esegue le chiamate **in parallelo** a InfoJobs, Adzuna e CareerJet tramite `asyncio.gather()`.

**Fase 5 — Chiamate alle API di Lavoro**
13. Ogni client (`infojobs.py`, `adzuna.py`, `careerjet.py`) esegue la richiesta HTTP con timeout configurabile (default: 5 secondi).
14. **Gestione errori e fallback**:
    - Se un aggregatore restituisce errore HTTP 4xx/5xx: log dell'errore, il risultato di quell'aggregatore viene scartato silenziosamente.
    - Se un aggregatore supera il timeout: `httpx.TimeoutException` catturata; circuit breaker incrementa il contatore di fallimenti.
    - Se **tutti** gli aggregatori falliscono: il tool restituisce una lista vuota e l'agente risponde con un messaggio di scusa e invita l'utente a riprovare.
15. Le risposte valide vengono normalizzate nello schema `JobOffer` (titolo, azienda, luogo, URL, data pubblicazione, fonte).

**Fase 6 — Aggregazione e Risposta LLM**
16. Le offerte normalizzate vengono de-duplicate (per URL) e ordinate per data di pubblicazione.
17. Le offerte vengono iniettate nel prompt come contesto strutturato: l'LLM genera una risposta conversazionale in italiano, presentando le offerte in modo comprensibile.
18. La risposta viene trasmessa in streaming al backend FastAPI tramite `async_generator`.

**Fase 7 — Persistenza e Restituzione**
19. Il backend persiste il turno di conversazione (messaggio utente + risposta agente) su PostgreSQL; aggiorna la cache Redis della sessione.
20. I token della risposta vengono inoltrati in streaming al frontend tramite WebSocket/SSE.
21. Il componente `ChatBubble.tsx` renderizza la risposta progressivamente; al termine, annuncia la risposta al sistema di accessibilità (`accessibilityLiveRegion="polite"`).

---

### 3.2 Diagramma di Sequenza Testuale

```
Utente          App Mobile         API Gateway       Backend FastAPI      Agente LangChain    API Lavoro         LLM (OpenAI)
  │                  │                   │                   │                    │                 │                    │
  │──[digita msg]──▶│                   │                   │                    │                 │                    │
  │                  │──[POST /chat]────▶│                   │                    │                 │                    │
  │                  │                   │──[verifica JWT]   │                    │                 │                    │
  │                  │                   │──[forward]───────▶│                    │                 │                    │
  │                  │                   │                   │──[carica contesto] │                 │                    │
  │                  │                   │                   │──[run_agent()]────▶│                 │                    │
  │                  │                   │                   │                    │──[costruisce prompt]               │
  │                  │                   │                   │                    │──[chiamata LLM]────────────────────▶│
  │                  │                   │                   │                    │◀──[tool_call: SearchJobsTool]───────│
  │                  │                   │                   │                    │──[query parallela]──▶[InfoJobs]     │
  │                  │                   │                   │                    │──[query parallela]──▶[Adzuna]       │
  │                  │                   │                   │                    │──[query parallela]──▶[CareerJet]    │
  │                  │                   │                   │                    │◀──[risultati / errori]──────────────│
  │                  │                   │                   │                    │──[normalizza + de-duplica]          │
  │                  │                   │                   │                    │──[chiamata LLM con offerte]─────────▶│
  │                  │                   │                   │                    │◀──[risposta streaming]──────────────│
  │                  │                   │                   │◀──[yield tokens]───│                 │                    │
  │                  │                   │                   │──[persisti su DB]  │                 │                    │
  │                  │◀──[stream SSE/WS]─│◀──[forward stream]│                   │                 │                    │
  │◀──[render msg]───│                   │                   │                   │                 │                    │
```

---

### 3.3 Gestione Errori e Timeout — Riepilogo

| Scenario | Comportamento | Risposta all'Utente |
|---|---|---|
| Aggregatore non disponibile (1 su 3) | Scarta silenziosamente, usa gli altri 2 | Nessuna notifica (trasparente) |
| Aggregatore non disponibile (2 su 3) | Usa il solo aggregatore disponibile | Avviso che i risultati potrebbero essere limitati |
| Tutti gli aggregatori non disponibili | Restituisce lista vuota all'agente | Messaggio di scuse + invito a riprovare |
| LLM non disponibile / timeout | HTTP 503 dal backend | Messaggio di errore generico + retry automatico lato app |
| Token JWT scaduto | HTTP 401 dall'API Gateway | App esegue refresh silenzioso del token |
| Input non valido (Pydantic) | HTTP 422 dal backend | Messaggio di errore localizzato in italiano |
| Timeout totale richiesta (> 30s) | HTTP 504 dall'API Gateway | Messaggio all'utente con opzione di riprovare |

---

## Sezione 4 — Milestone di Sviluppo per l'MVP

---

### Milestone 1 — Fondamenta: Scaffolding, Infrastruttura e Autenticazione

**Obiettivo principale**: Creare la struttura del monorepo, il setup dell'infrastruttura locale containerizzata e il flusso di autenticazione end-to-end. Al termine di questa milestone il team può sviluppare in parallelo su frontend e backend con un ambiente locale riproducibile.

**Deliverable concreti**:
- Monorepo strutturato come da Sezione 2 con Dockerfile per il backend e `docker-compose.yml` funzionante
- Backend FastAPI avviabile con health check (`GET /health`) che risponde HTTP 200
- Database PostgreSQL con schema iniziale (tabelle `users`, `sessions`, `messages`) e migrazioni Alembic
- Endpoint di autenticazione: `POST /v1/auth/register`, `POST /v1/auth/login`, `POST /v1/auth/refresh`
- App Expo avviabile su simulatore con schermata di login funzionante (chiamata reale al backend)
- Pipeline CI GitHub Actions che esegue lint e test per backend e mobile
- File `.env.example` documentato e `README.md` con istruzioni di setup locale

**Criteri di accettazione misurabili**:
- `docker compose up` avvia tutti i servizi senza errori su macchina pulita
- `pytest apps/backend/tests/` supera con ≥ 1 test di integrazione per gli endpoint auth
- L'app Expo si connette al backend locale, effettua login e riceve JWT valido
- CI verde su branch `main` dopo merge

**Dipendenze tecniche da risolvere preventivamente**:
- Scelta definitiva del gestore dipendenze Python: `uv` (raccomandato) vs `poetry`
- Accesso a un'istanza PostgreSQL per i test di integrazione CI (Docker service in Actions)
- Configurazione del progetto Expo (bundle ID, account Expo)

**Complessità stimata**: **Media** — lavoro di setup infrastrutturale ben delimitato, senza logica di business complessa; la parte di CI richiede attenzione alla configurazione degli ambienti

---

### Milestone 2 — Core AI: Agente LangChain e Integrazione API di Lavoro

**Obiettivo principale**: Implementare il cuore funzionale di JoBot: l'agente LangChain con la capacità di ricercare offerte di lavoro reali tramite almeno una delle tre API di aggregazione, e di restituirle in formato conversazionale. Al termine, il prodotto è dimostrabile end-to-end.

**Deliverable concreti**:
- Agente LangChain funzionante con architettura ReAct e tool `SearchJobsTool`
- Client HTTP per almeno **2 aggregatori** (priorità: Adzuna + CareerJet per facilità di accesso API), con normalizzazione schema `JobOffer`
- Gestione errori e timeout come da Sezione 3.3, incluso fallback tra aggregatori
- Endpoint `POST /v1/chat` con risposta sincrona (streaming implementato nella M3)
- Pseudonimizzazione dei dati utente prima della trasmissione all'LLM (requisito GDPR)
- Audit log su PostgreSQL di ogni invocazione LLM (timestamp, hash utente pseudonimizzato, token usati)
- Schermata chat nell'app mobile collegata all'endpoint `/v1/chat` con rendering delle risposte
- Test unitari per: normalizzazione `JobOffer`, logica di fallback tra aggregatori, pseudonimizzazione

**Criteri di accettazione misurabili**:
- Dato il messaggio *"Trova offerte come magazziniere a Napoli"*, l'agente restituisce ≥ 3 offerte reali o un messaggio di fallback spiegato
- In caso di indisponibilità simulata di un aggregatore (mock), il sistema usa gli altri senza errori visibili
- L'audit log contiene la registrazione dell'invocazione senza dati personali in chiaro
- `pytest` supera ≥ 80% dei test del modulo `agent/` e `integrations/`

**Dipendenze tecniche da risolvere preventivamente**:
- Ottenere le credenziali API per Adzuna e CareerJet (registrazione sviluppatore)
- Scelta del provider LLM e creazione chiave API OpenAI (o alternativa)
- Decisione su pgvector vs Qdrant per la memoria semantica (per M2 è sufficiente memoria in-session su Redis)

**Complessità stimata**: **Alta** — coordinazione di più sistemi esterni con comportamenti non deterministici (LLM, API terze parti); richiede mocking accurato per i test e attenzione ai requisiti GDPR

---

### Milestone 3 — UX e Produzione: Streaming, Accessibilità e Deploy

**Obiettivo principale**: Elevare l'esperienza utente con risposte in streaming, consolidare l'accessibilità WCAG 2.1 AA del frontend mobile, e preparare l'infrastruttura per un primo deploy su ambiente di staging accessibile esternamente.

**Deliverable concreti**:
- Endpoint `/v1/chat/stream` con Server-Sent Events (SSE) o WebSocket per lo streaming dei token
- Integrazione dello streaming nel frontend (hook `useChat.ts` con rendering progressivo)
- Audit di accessibilità WCAG 2.1 AA: `accessibilityLabel` su tutti i componenti interattivi, contrasto colori verificato, supporto screen reader (VoiceOver / TalkBack)
- Gestione completa degli errori nel frontend con messaggi in italiano chiari e semplici
- Deploy su ambiente di staging (es. Fly.io, Railway o VPS) con HTTPS tramite certificato TLS
- Configurazione Nginx come API Gateway con rate limiting (es. 60 req/min per IP)
- Documentazione API automatica (Swagger UI di FastAPI) aggiornata e accessibile
- GDPR: endpoint `DELETE /v1/users/{id}` (diritto all'oblio) e `GET /v1/users/{id}/data` (portabilità)

**Criteri di accettazione misurabili**:
- La risposta dell'agente inizia a renderizzarsi nell'app entro 2 secondi dall'invio del messaggio
- Audit automatico con axe-core (o Expo Accessibility Inspector) restituisce 0 violazioni di livello A e AA
- Il deploy su staging è raggiungibile da browser e app esterna con HTTPS valido
- Gli endpoint GDPR sono documentati e coperti da test di integrazione

**Dipendenze tecniche da risolvere preventivamente**:
- Scelta della piattaforma di hosting per lo staging
- Generazione e gestione dei certificati TLS (Let's Encrypt / Cloudflare)
- Definizione della politica di data retention per i messaggi (input del Data Protection Officer o del referente legale del progetto)

**Complessità stimata**: **Media** — le singole componenti sono ben delimitate; la complessità principale è nell'integrazione dello streaming end-to-end e nella verifica sistematica dell'accessibilità

---

## Appendice — Requisiti Trasversali Riepilogati

| Requisito | Implementazione |
|---|---|
| WCAG 2.1 AA | Componenti Expo accessibili, `accessibilityLabel`, contrasto ≥ 4.5:1, audit con axe-core (M3) |
| GDPR — Consenso | Schermata onboarding con consenso esplicito, log del consenso su PostgreSQL |
| GDPR — Pseudonimizzazione | Pipeline in `core/security.py` attiva prima di ogni chiamata LLM (M2) |
| GDPR — Diritto all'oblio | Endpoint `DELETE /v1/users/{id}` (M3) |
| GDPR — Portabilità | Endpoint `GET /v1/users/{id}/data` (M3) |
| Scalabilità orizzontale | Backend stateless (JWT + Redis), deploy containerizzato, pronto per replica (M3) |
| Sicurezza chiavi | Variabili d'ambiente, mai in repository; rotazione periodica |
| Audit trail LLM | Log su PostgreSQL con hash pseudonimizzato (M2) |

---

*Documento redatto in fase di pianificazione architetturale. Da aggiornare progressivamente con Architecture Decision Records (ADR) al termine di ciascuna milestone.*
