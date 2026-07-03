# JoBot — Contratto Dati Backend → Frontend

> **Versione:** 1.0  
> **Lingua:** Italiano  
> **Scopo:** Definisce il formato JSON esatto di ogni risposta che il backend invia al frontend.

---

## Formato della Risposta

Ogni risposta dell'endpoint `POST /v1/chat` deve rispettare **esattamente** questo schema JSON:

```json
{
  "message": "Testo da mostrare nella chat",
  "state": "profile_collection | skills_summary | job_search | support_referral",
  "profile": {
    "name": "",
    "location": "",
    "skills": [],
    "experience": "",
    "preferences": []
  },
  "jobs": [
    {
      "title": "",
      "company": "",
      "location": "",
      "description": "",
      "source": "mock | adzuna | infojobs | careerjet",
      "url": "",
      "published_at": ""
    }
  ],
  "support": {
    "suggested": false,
    "message": "",
    "type": "none | human_support | psychological_orientation"
  },
  "error": {
    "has_error": false,
    "message": ""
  }
}
```

---

## Descrizione dei Campi

| Campo | Tipo | Obbligatorio | Descrizione |
|---|---|---|---|
| `message` | `string` | ✅ | Testo da mostrare nella chat come messaggio di JoBot |
| `state` | `enum` | ✅ | Stato corrente della macchina conversazionale |
| `profile` | `object` | ✅ | Profilo utente raccolto fino a quel momento (valori vuoti se non ancora raccolti) |
| `profile.name` | `string` | ✅ | Nome o alias dell'utente |
| `profile.location` | `string` | ✅ | Zona geografica dell'utente |
| `profile.skills` | `string[]` | ✅ | Lista di competenze dichiarate |
| `profile.experience` | `string` | ✅ | Esperienza lavorativa in forma testuale |
| `profile.preferences` | `string[]` | ✅ | Preferenze lavorative (es. settore, orario, contratto) |
| `jobs` | `array` | ✅ | Lista di offerte di lavoro trovate (vuota se non in fase `job_search`) |
| `jobs[].title` | `string` | ✅ | Titolo della posizione lavorativa |
| `jobs[].company` | `string` | ✅ | Nome dell'azienda |
| `jobs[].location` | `string` | ✅ | Luogo di lavoro |
| `jobs[].description` | `string` | ✅ | Breve descrizione dell'offerta |
| `jobs[].source` | `enum` | ✅ | Fonte dell'offerta: `mock`, `adzuna`, `infojobs`, `careerjet` |
| `jobs[].url` | `string` | ✅ | URL dell'offerta originale |
| `jobs[].published_at` | `string` | ✅ | Data di pubblicazione (formato ISO 8601 o stringa vuota) |
| `support` | `object` | ✅ | Informazioni sul supporto umano/psicologico suggerito |
| `support.suggested` | `boolean` | ✅ | `true` se JoBot suggerisce supporto umano o psicologico |
| `support.message` | `string` | ✅ | Messaggio empatico di orientamento verso il supporto |
| `support.type` | `enum` | ✅ | Tipo di supporto: `none`, `human_support`, `psychological_orientation` |
| `error` | `object` | ✅ | Informazioni su eventuali errori |
| `error.has_error` | `boolean` | ✅ | `true` se si è verificato un errore |
| `error.message` | `string` | ✅ | Descrizione dell'errore in italiano (vuota se nessun errore) |

---

## Stati Conversazionali

| Stato | Descrizione |
|---|---|
| `profile_collection` | JoBot sta raccogliendo le informazioni sul profilo dell'utente |
| `skills_summary` | JoBot ha raccolto abbastanza informazioni e mostra la sintesi delle competenze |
| `job_search` | JoBot sta cercando o ha trovato offerte di lavoro pertinenti |
| `support_referral` | JoBot ha rilevato segnali di disagio e orienta verso supporto umano/psicologico |

---

## Esempi JSON per Stato

### Stato: `profile_collection`
```json
{
  "message": "Ciao! Sono JoBot, il tuo assistente per trovare lavoro nella zona di Napoli. Come posso chiamarti?",
  "state": "profile_collection",
  "profile": { "name": "", "location": "", "skills": [], "experience": "", "preferences": [] },
  "jobs": [],
  "support": { "suggested": false, "message": "", "type": "none" },
  "error": { "has_error": false, "message": "" }
}
```

### Stato: `skills_summary`
```json
{
  "message": "Ho capito bene! Ecco un riepilogo di quello che mi hai detto...",
  "state": "skills_summary",
  "profile": { "name": "Mario", "location": "Napoli centro", "skills": ["magazzino", "guida muletto"], "experience": "5 anni in logistica", "preferences": ["full-time", "turni diurni"] },
  "jobs": [],
  "support": { "suggested": false, "message": "", "type": "none" },
  "error": { "has_error": false, "message": "" }
}
```

### Stato: `job_search`
```json
{
  "message": "Ho trovato queste offerte che potrebbero fare al caso tuo!",
  "state": "job_search",
  "profile": { "name": "Mario", "location": "Napoli centro", "skills": ["magazzino", "guida muletto"], "experience": "5 anni in logistica", "preferences": ["full-time"] },
  "jobs": [
    {
      "title": "Operatore di Magazzino",
      "company": "LogiNapoli S.r.l.",
      "location": "Napoli, NA",
      "description": "Cerchiamo operatori di magazzino con patente muletto per turni diurni.",
      "source": "mock",
      "url": "https://esempio.it/offerta/1",
      "published_at": "2025-01-15"
    }
  ],
  "support": { "suggested": false, "message": "", "type": "none" },
  "error": { "has_error": false, "message": "" }
}
```

### Stato: `support_referral`
```json
{
  "message": "Capisco che le cose possano sembrare difficili in questo momento. Sono qui con te.",
  "state": "support_referral",
  "profile": { "name": "Mario", "location": "", "skills": [], "experience": "", "preferences": [] },
  "jobs": [],
  "support": {
    "suggested": true,
    "message": "Parlare con qualcuno di fiducia può aiutarti molto. A Napoli ci sono centri di orientamento e supporto psicologico gratuiti che possono affiancarti in questo percorso.",
    "type": "psychological_orientation"
  },
  "error": { "has_error": false, "message": "" }
}
```
