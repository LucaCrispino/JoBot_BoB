/**
 * JoBot — Hook `useChat` per la gestione della chat.
 *
 * Gestisce:
 * - Inizializzazione della sessione e messaggio di benvenuto
 * - Invio dei messaggi al backend
 * - Stato della conversazione (messaggi, caricamento, errori)
 * - Profilo utente aggiornato
 * - Offerte di lavoro ricevute
 * - Supporto psicologico/umano rilevato
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { avviaConversazione, inviaMessaggio } from '../services/api';
import type {
  InfoSupporto,
  MessaggioChat,
  OffertaLavoro,
  ProfiloUtente,
  StatoConversazione,
} from '../types';

// ============================================================
// Utility
// ============================================================

/** Genera un ID univoco semplice per i messaggi. */
function generaId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Genera un session_id univoco per la sessione corrente. */
function generaSessionId(): string {
  return `sessione-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ============================================================
// Tipi dello stato del hook
// ============================================================

export interface StatoChat {
  /** Lista di tutti i messaggi nella conversazione. */
  messaggi: MessaggioChat[];
  /** True mentre si attende la risposta del backend. */
  caricamento: boolean;
  /** Messaggio di errore visibile all'utente (null se nessun errore). */
  errore: string | null;
  /** Stato corrente della macchina conversazionale. */
  statoConversazione: StatoConversazione;
  /** Profilo utente aggiornato. */
  profilo: ProfiloUtente;
  /** Ultime offerte di lavoro ricevute. */
  offerte: OffertaLavoro[];
  /** Informazioni sul supporto suggerito. */
  supporto: InfoSupporto | null;
  /** ID della sessione corrente. */
  sessionId: string;
}

export interface AzioniChat {
  /** Invia un messaggio al backend. */
  invia: (testo: string) => Promise<void>;
  /** Resetta la conversazione (nuova sessione). */
  resetta: () => void;
  /** Cancella il messaggio di errore. */
  cancellaErrore: () => void;
}

// Profilo vuoto default
const PROFILO_VUOTO: ProfiloUtente = {
  name: '',
  location: '',
  skills: [],
  experience: '',
  preferences: [],
};

// Supporto default
const SUPPORTO_DEFAULT: InfoSupporto = {
  suggested: false,
  message: '',
  type: 'none',
};

// ============================================================
// Hook
// ============================================================

/**
 * Hook principale per la gestione della chat JoBot.
 *
 * Esempio di utilizzo:
 * ```tsx
 * const { stato, azioni } = useChat();
 * ```
 *
 * @returns Un oggetto con `stato` (dati reattivi) e `azioni` (metodi).
 */
export function useChat(): { stato: StatoChat; azioni: AzioniChat } {
  const [messaggi, setMessaggi] = useState<MessaggioChat[]>([]);
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [statoConversazione, setStatoConversazione] =
    useState<StatoConversazione>('profile_collection');
  const [profilo, setProfilo] = useState<ProfiloUtente>(PROFILO_VUOTO);
  const [offerte, setOfferte] = useState<OffertaLavoro[]>([]);
  const [supporto, setSupporto] = useState<InfoSupporto | null>(null);
  const [sessionId] = useState<string>(generaSessionId);

  // Ref per evitare doppie inizializzazioni in React StrictMode
  const inizializzato = useRef(false);

  // ============================================================
  // Aggiunge un messaggio JoBot alla lista
  // ============================================================

  const aggiungiMessaggioJoBot = useCallback(
    (
      testo: string,
      offerteMex?: OffertaLavoro[],
      supportoMex?: InfoSupporto,
    ) => {
      const nuovoMessaggio: MessaggioChat = {
        id: generaId(),
        mittente: 'jobot',
        testo,
        timestamp: new Date(),
        offerte: offerteMex,
        supporto: supportoMex,
      };
      setMessaggi((prev) => [...prev, nuovoMessaggio]);
    },
    [],
  );

  // ============================================================
  // Inizializzazione: messaggio di benvenuto
  // ============================================================

  useEffect(() => {
    if (inizializzato.current) return;
    inizializzato.current = true;

    const caricaBenvenuto = async () => {
      setCaricamento(true);
      try {
        const risposta = await avviaConversazione(sessionId);
        aggiungiMessaggioJoBot(risposta.message);
        setStatoConversazione(risposta.state);
        setProfilo(risposta.profile);
      } catch {
        aggiungiMessaggioJoBot(
          'Ciao! Sono JoBot. Al momento ho qualche difficoltà tecnica, ma sono qui. ' +
            'Riprova tra qualche secondo o scrivi qui sotto per iniziare.',
        );
      } finally {
        setCaricamento(false);
      }
    };

    void caricaBenvenuto();
  }, [sessionId, aggiungiMessaggioJoBot]);

  // ============================================================
  // Azione: invia messaggio
  // ============================================================

  const invia = useCallback(
    async (testo: string) => {
      const testoTrimmed = testo.trim();
      if (!testoTrimmed || caricamento) return;

      // Aggiungi il messaggio dell'utente immediatamente (UX reattiva)
      const messaggioUtente: MessaggioChat = {
        id: generaId(),
        mittente: 'utente',
        testo: testoTrimmed,
        timestamp: new Date(),
      };
      setMessaggi((prev) => [...prev, messaggioUtente]);
      setErrore(null);
      setCaricamento(true);

      try {
        const risposta = await inviaMessaggio(testoTrimmed, sessionId);

        // Aggiorna lo stato globale
        setStatoConversazione(risposta.state);
        setProfilo(risposta.profile);

        if (risposta.jobs.length > 0) {
          setOfferte(risposta.jobs);
        }

        const infoSupporto =
          risposta.support.suggested ? risposta.support : null;
        setSupporto(infoSupporto);

        // Aggiungi la risposta di JoBot
        aggiungiMessaggioJoBot(
          risposta.message,
          risposta.jobs.length > 0 ? risposta.jobs : undefined,
          infoSupporto ?? undefined,
        );

        // Gestione errori nel contratto (has_error = true)
        if (risposta.error.has_error) {
          setErrore(risposta.error.message);
        }
      } catch (err) {
        const messaggioErrore =
          err instanceof Error
            ? err.message
            : 'Qualcosa non ha funzionato. Riprova tra qualche secondo.';

        setErrore(messaggioErrore);
        aggiungiMessaggioJoBot(
          'Mi dispiace, ho avuto un piccolo problema. Puoi riprovare?',
        );
      } finally {
        setCaricamento(false);
      }
    },
    [caricamento, sessionId, aggiungiMessaggioJoBot],
  );

  // ============================================================
  // Azione: resetta la conversazione
  // ============================================================

  const resetta = useCallback(() => {
    setMessaggi([]);
    setCaricamento(false);
    setErrore(null);
    setStatoConversazione('profile_collection');
    setProfilo(PROFILO_VUOTO);
    setOfferte([]);
    setSupporto(null);
    inizializzato.current = false;
    // Ricaricare il componente provocherà un nuovo useEffect
    // TODO: in futuro, gestire il reset senza rimontare il componente
    // usando un contatore di "versione" come dipendenza dell'useEffect
  }, []);

  const cancellaErrore = useCallback(() => setErrore(null), []);

  return {
    stato: {
      messaggi,
      caricamento,
      errore,
      statoConversazione,
      profilo,
      offerte,
      supporto,
      sessionId,
    },
    azioni: {
      invia,
      resetta,
      cancellaErrore,
    },
  };
}
