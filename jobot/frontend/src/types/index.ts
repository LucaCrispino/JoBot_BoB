/**
 * JoBot — Tipi TypeScript condivisi.
 *
 * Questo file definisce i tipi esatti corrispondenti al contratto dati
 * descritto in CONTRACT.md. Ogni risposta del backend deve corrispondere
 * all'interfaccia `RispostaChat`.
 *
 * Regola: nessun `any` — usare `unknown` con narrowing dove necessario.
 */

// ============================================================
// Enum — Valori ammessi
// ============================================================

/** Stati possibili della macchina conversazionale di JoBot. */
export type StatoConversazione =
  | 'profile_collection'
  | 'skills_summary'
  | 'job_search'
  | 'support_referral';

/** Fonte dell'offerta di lavoro. */
export type FonteOfferta = 'mock' | 'adzuna' | 'infojobs' | 'careerjet';

/** Tipo di supporto psicologico/umano suggerito. */
export type TipoSupporto = 'none' | 'human_support' | 'psychological_orientation';

// ============================================================
// Modelli di output — sub-interfacce
// ============================================================

/** Profilo utente raccolto progressivamente durante la conversazione. */
export interface ProfiloUtente {
  /** Nome o alias dell'utente. */
  name: string;
  /** Zona geografica dell'utente. */
  location: string;
  /** Lista di competenze dichiarate. */
  skills: string[];
  /** Esperienza lavorativa in testo libero. */
  experience: string;
  /** Preferenze lavorative. */
  preferences: string[];
}

/** Singola offerta di lavoro nel formato normalizzato CONTRACT.md. */
export interface OffertaLavoro {
  /** Titolo della posizione lavorativa. */
  title: string;
  /** Nome dell'azienda. */
  company: string;
  /** Luogo di lavoro. */
  location: string;
  /** Breve descrizione dell'offerta. */
  description: string;
  /** Fonte dell'offerta. */
  source: FonteOfferta;
  /** URL dell'offerta originale. */
  url: string;
  /** Data di pubblicazione (ISO 8601 o stringa vuota). */
  published_at: string;
}

/** Informazioni sul supporto umano/psicologico suggerito. */
export interface InfoSupporto {
  /** True se JoBot suggerisce supporto umano o psicologico. */
  suggested: boolean;
  /** Messaggio empatico di orientamento (vuoto se non suggerito). */
  message: string;
  /** Tipo di supporto suggerito. */
  type: TipoSupporto;
}

/** Informazioni su eventuali errori nella risposta. */
export interface InfoErrore {
  /** True se si è verificato un errore. */
  has_error: boolean;
  /** Descrizione dell'errore in italiano (vuota se nessun errore). */
  message: string;
}

// ============================================================
// Modello principale di risposta — conforme al CONTRACT.md
// ============================================================

/**
 * Risposta dell'endpoint POST /v1/chat — conforme al CONTRACT.md.
 *
 * Ogni campo è sempre presente. I valori possono essere vuoti/default
 * quando non rilevanti per lo stato corrente.
 */
export interface RispostaChat {
  /** Testo da mostrare nella chat come messaggio di JoBot. */
  message: string;
  /** Stato corrente della macchina conversazionale. */
  state: StatoConversazione;
  /** Profilo utente aggiornato. */
  profile: ProfiloUtente;
  /** Offerte di lavoro trovate (vuota se non in fase job_search). */
  jobs: OffertaLavoro[];
  /** Informazioni sul supporto psicologico/umano. */
  support: InfoSupporto;
  /** Informazioni su eventuali errori. */
  error: InfoErrore;
}

// ============================================================
// Modelli di input
// ============================================================

/** Payload da inviare all'endpoint POST /v1/chat. */
export interface RichiestaChat {
  /** Il testo inviato dall'utente. */
  messaggio: string;
  /** Identificatore opaco della sessione corrente. */
  session_id: string;
}

/** Payload da inviare all'endpoint POST /v1/chat/start. */
export interface RichiestaAvvio {
  /** Identificatore opaco della sessione da inizializzare. */
  session_id: string;
}

// ============================================================
// Tipi UI interni
// ============================================================

/** Tipo di mittente di un messaggio nella chat. */
export type MittentMessaggio = 'jobot' | 'utente';

/** Singolo messaggio nella chat (per lo stato locale del frontend). */
export interface MessaggioChat {
  /** Identificatore univoco del messaggio. */
  id: string;
  /** Chi ha inviato il messaggio. */
  mittente: MittentMessaggio;
  /** Testo del messaggio. */
  testo: string;
  /** Timestamp di creazione. */
  timestamp: Date;
  /** Offerte di lavoro associate al messaggio (solo per messaggi JoBot). */
  offerte?: OffertaLavoro[];
  /** Informazioni di supporto associate al messaggio. */
  supporto?: InfoSupporto;
}
