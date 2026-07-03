# JoBot — Piattaforma Ibrida Psicologico-AI per il Reinserimento Lavorativo

> Versione MVP · Area Metropolitana di Napoli

JoBot è una piattaforma conversazionale che affianca il supporto psicologico umano a un agente IA, con l'obiettivo di abbattere le barriere tecnologiche per categorie vulnerabili e guidarle nella ricerca attiva di lavoro.

---

## Struttura del Monorepo

```
jobot/
├── backend/          # Servizio Python/FastAPI
├── frontend/         # App React Native/Expo
└── CONTRACT.md       # Contratto dati backend → frontend
```

---

## Avvio Rapido

### Backend (Python/FastAPI)

**Requisiti:** Python 3.11+

```bash
cd jobot/backend

# Copia le variabili d'ambiente
cp .env.example .env

# Installa le dipendenze
pip install -r requirements.txt

# Avvia il server di sviluppo
uvicorn main:app --reload --port 8000
```

Il backend sarà disponibile su: http://localhost:8000  
Documentazione API (Swagger): http://localhost:8000/docs

### Frontend (React Native/Expo)

**Requisiti:** Node.js 18+, npm o yarn, app Expo Go su smartphone

```bash
cd jobot/frontend

# Copia le variabili d'ambiente
cp .env.example .env

# Installa le dipendenze
npm install

# Avvia Expo
npx expo start
```

Scansiona il QR code con l'app **Expo Go** (disponibile su App Store e Google Play).

> **Demo rapida senza smartphone:** premi `w` nel terminale Expo per aprire nel browser web.

---

## Demo in 2 Minuti

1. Avvia il backend (`uvicorn main:app --reload`)
2. Avvia il frontend (`npx expo start`)
3. Apri l'app su telefono o browser
4. Scrivi il tuo nome e segui la conversazione con JoBot
5. Prova a cercare lavoro scrivendo: *"Cerco lavoro come magazziniere a Napoli"*

---

## Variabili d'Ambiente

| File | Scopo |
|---|---|
| `backend/.env.example` | Variabili per il backend FastAPI |
| `frontend/.env.example` | URL del backend per il frontend |

**Non committare mai file `.env` con valori reali.**

---

## Segnalazione Demo per Screenshot/Video

Per acquisire una demo efficace:
1. Mostra la schermata di benvenuto
2. Conduci una conversazione completa: nome → zona → competenze → ricerca lavoro
3. Mostra le card delle offerte di lavoro
4. Per testare il supporto psicologico, scrivi: *"Mi sento molto scoraggiato e solo"*

---

## Architettura

Vedi [`jobot-architettura-plan.md`](../jobot-architettura-plan.md) per il documento di design architetturale completo.

Vedi [`CONTRACT.md`](./CONTRACT.md) per il contratto dati backend → frontend.

---

## Stack Tecnologico

| Componente | Tecnologia |
|---|---|
| Backend | Python 3.11+, FastAPI, Pydantic v2 |
| Frontend | React Native, Expo, TypeScript |
| Mock dati | JSON locale (offerte per l'area di Napoli) |
| Futuro LLM | OpenAI GPT-4o (configurabile via env var) |
| Future API lavoro | InfoJobs, Adzuna, CareerJet |
