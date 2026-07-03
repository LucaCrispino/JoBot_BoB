/**
 * JoBot — Design System: colori, tipografia e spaziatura.
 *
 * Palette progettata per:
 * - Contrasto ≥ 4.5:1 (WCAG 2.1 AA) per tutto il testo principale
 * - Tono caldo e accogliente (non clinico)
 * - Leggibilità per utenti con bassa alfabetizzazione digitale
 */

// ============================================================
// Palette Colori
// ============================================================

export const Colori = {
  // --- Sfondo ---
  sfondo: '#FAFAFA',
  sfondoCard: '#FFFFFF',
  sfondoChatBot: '#EEF2FF',   // Azzurro tenue — messaggi JoBot
  sfondoChatUtente: '#3B5BDB', // Blu scuro — messaggi utente

  // --- Testo ---
  testo: '#1A1A2E',            // Quasi nero — contrasto ≥ 7:1
  testoSecondario: '#4A4A68',  // Grigio scuro — contrasto ≥ 4.5:1
  testoChatBot: '#1A1A2E',
  testoChatUtente: '#FFFFFF',  // Bianco su blu — contrasto ≥ 7:1
  testoMuted: '#6B7280',

  // --- Accenti ---
  primario: '#3B5BDB',         // Blu affidabile
  primarioChiaro: '#748FFC',
  primarioScuro: '#2F49B0',
  secondario: '#F76707',       // Arancione caldo (azione, CTA)

  // --- Supporto / Allerta empatica ---
  supportoSfondo: '#FFF3CD',   // Giallo molto tenue — rassicurante, non allarmistico
  supportoBordo: '#F59E0B',
  supportoTesto: '#78350F',

  // --- Stato / Feedback ---
  successo: '#059669',
  errore: '#DC2626',
  erroreSfondo: '#FEE2E2',

  // --- Bordi ---
  bordo: '#E5E7EB',
  bordoChiaro: '#F3F4F6',

  // --- Badge fonte offerta ---
  badgeMock: '#6B7280',
  badgeAdzuna: '#7C3AED',
  badgeInfojobs: '#1D4ED8',
  badgeCareerjet: '#0369A1',
} as const;

// ============================================================
// Tipografia
// ============================================================

export const Tipografia = {
  // Font system (si adatta a iOS e Android)
  fonteFamiglia: undefined, // usa il default del sistema

  // Dimensioni
  dimensioniXS: 11,
  dimensioniSM: 13,
  dimensioniBase: 15,
  dimensioniMD: 17,
  dimensioniLG: 20,
  dimensioniXL: 24,
  dimensioniXXL: 30,

  // Altezza riga (accessibilità)
  altezzaRigaBase: 1.6,

  // Peso
  pesoNormale: '400' as const,
  pesoMedio: '500' as const,
  pesoCorsivo: '600' as const,
  pesoGrassetto: '700' as const,
} as const;

// ============================================================
// Spaziatura
// ============================================================

export const Spaziatura = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// ============================================================
// Bordi arrotondati
// ============================================================

export const Raggi = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  completo: 999,
} as const;

// ============================================================
// Etichette degli stati conversazionali (per UI)
// ============================================================

export const EtichetteStato: Record<string, string> = {
  profile_collection: '💬 Raccolta profilo',
  skills_summary: '📋 Riepilogo competenze',
  job_search: '🔍 Ricerca lavoro',
  support_referral: '🤝 Supporto',
} as const;
