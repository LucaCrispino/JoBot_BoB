/**
 * JoBot — Servizio API per comunicare con il backend FastAPI.
 *
 * Tutti i metodi usano fetch nativo (compatibile con React Native/Expo).
 * Non viene usato axios per mantenere le dipendenze al minimo.
 *
 * La URL base viene letta dalla variabile d'ambiente EXPO_PUBLIC_API_URL.
 * Se non configurata, usa localhost:8000 (sviluppo locale).
 */

import type {
  RichiestaAvvio,
  RichiestaChat,
  RispostaChat,
} from '../types';

// ============================================================
// Configurazione base
// ============================================================

/**
 * URL base del backend FastAPI.
 *
 * Configurazione:
 *   - Sviluppo locale (simulatore iOS/Android): http://localhost:8000
 *   - Sviluppo locale (dispositivo fisico): http://<IP-del-tuo-PC>:8000
 *   - Produzione: configurare EXPO_PUBLIC_API_URL nel file .env
 *
 * TODO (Milestone 3): configurare la URL di produzione tramite .env
 */
const URL_BASE: string =
  (process.env['EXPO_PUBLIC_API_URL'] as string | undefined) ??
  'http://localhost:8000';

// Timeout per le richieste HTTP (in millisecondi)
const TIMEOUT_MS = 15_000;

// ============================================================
// Utility
// ============================================================

/**
 * Esegue una richiesta fetch con timeout.
 *
 * @param url - URL completa della richiesta.
 * @param opzioni - Opzioni fetch standard.
 * @returns La risposta HTTP.
 * @throws Error se il timeout viene superato o la rete non è disponibile.
 */
async function fetchConTimeout(
  url: string,
  opzioni: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const risposta = await fetch(url, {
      ...opzioni,
      signal: controller.signal,
    });
    return risposta;
  } finally {
    clearTimeout(id);
  }
}

// ============================================================
// Funzioni del servizio
// ============================================================

/**
 * Verifica che il backend sia raggiungibile.
 *
 * @returns true se il backend risponde con stato "ok".
 */
export async function verificaSalute(): Promise<boolean> {
  try {
    const risposta = await fetchConTimeout(`${URL_BASE}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!risposta.ok) return false;
    const dati = (await risposta.json()) as { stato?: string };
    return dati.stato === 'ok';
  } catch {
    return false;
  }
}

/**
 * Avvia una nuova conversazione e ottiene il messaggio di benvenuto.
 *
 * @param sessionId - Identificatore univoco della sessione.
 * @returns La risposta di benvenuto nel formato CONTRACT.md.
 * @throws Error se la richiesta fallisce o il backend non è disponibile.
 */
export async function avviaConversazione(
  sessionId: string,
): Promise<RispostaChat> {
  const payload: RichiestaAvvio = { session_id: sessionId };

  const risposta = await fetchConTimeout(`${URL_BASE}/v1/chat/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!risposta.ok) {
    throw new Error(
      `Errore del server (${risposta.status}): impossibile avviare la conversazione.`,
    );
  }

  return risposta.json() as Promise<RispostaChat>;
}

/**
 * Invia un messaggio al backend e ottiene la risposta di JoBot.
 *
 * @param messaggio - Il testo scritto dall'utente.
 * @param sessionId - Identificatore della sessione corrente.
 * @returns La risposta di JoBot nel formato CONTRACT.md.
 * @throws Error se la richiesta fallisce o il backend non è disponibile.
 */
export async function inviaMessaggio(
  messaggio: string,
  sessionId: string,
): Promise<RispostaChat> {
  const payload: RichiestaChat = {
    messaggio,
    session_id: sessionId,
  };

  const risposta = await fetchConTimeout(`${URL_BASE}/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!risposta.ok) {
    throw new Error(
      `Errore del server (${risposta.status}): impossibile inviare il messaggio.`,
    );
  }

  return risposta.json() as Promise<RispostaChat>;
}
