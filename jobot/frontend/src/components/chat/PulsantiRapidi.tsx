/**
 * JoBot — Componente PulsantiRapidi.
 *
 * Mostra pulsanti contestuali per guidare gli utenti poco esperti
 * nelle fasi iniziali della conversazione.
 *
 * I suggerimenti cambiano in base allo stato conversazionale corrente.
 *
 * Accessibilità:
 * - accessibilityRole="button" su ogni pulsante
 * - accessibilityHint descrittivo
 */

import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Colori, Raggi, Spaziatura, Tipografia } from '../../theme';
import type { StatoConversazione } from '../../types';

interface PropsPulsantiRapidi {
  stato: StatoConversazione;
  onSuggerimento: (testo: string) => void;
}

// ============================================================
// Suggerimenti contestuali per ogni stato
// ============================================================

const SUGGERIMENTI: Record<StatoConversazione, string[]> = {
  profile_collection: [
    'Mario',
    'Napoli centro',
    'Non lo so ancora',
    'Ho lavorato in un magazzino',
  ],
  skills_summary: [
    'Cerca lavoro',
    'Sì, cerca pure',
    'Fammi vedere le offerte',
    'Va bene così',
  ],
  job_search: [
    'Cerca altri lavori',
    'Cambia ricerca',
    'Cerca magazziniere',
    'Cerca cameriere',
    'Cerca assistente',
  ],
  support_referral: [
    'Grazie, continua a cercare',
    'Dimmi dove posso andare',
    'Continua con la ricerca',
  ],
};

/**
 * Barra di pulsanti rapidi contestuali.
 *
 * Visibile solo nelle prime fasi della conversazione per aiutare
 * utenti con bassa familiarità con le app di chat.
 */
export function PulsantiRapidi({
  stato,
  onSuggerimento,
}: PropsPulsantiRapidi): React.JSX.Element {
  const suggerimenti = SUGGERIMENTI[stato] ?? [];

  if (suggerimenti.length === 0) {
    return <></>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={stili.scrollView}
      contentContainerStyle={stili.contenuto}
      accessibilityLabel="Suggerimenti rapidi per la chat"
      accessibilityRole="none"
    >
      {suggerimenti.map((testo) => (
        <TouchableOpacity
          key={testo}
          style={stili.pulsante}
          onPress={() => onSuggerimento(testo)}
          accessibilityLabel={`Suggerimento: ${testo}`}
          accessibilityHint="Invia questo testo come messaggio"
          accessibilityRole="button"
        >
          <Text style={stili.testoPulsante}>{testo}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const stili = StyleSheet.create({
  scrollView: {
    maxHeight: 52,
    backgroundColor: Colori.sfondoCard,
    borderTopWidth: 1,
    borderTopColor: Colori.bordoChiaro,
  },
  contenuto: {
    paddingHorizontal: Spaziatura.base,
    paddingVertical: Spaziatura.sm,
    gap: Spaziatura.sm,
  },
  pulsante: {
    backgroundColor: Colori.sfondoChatBot,
    borderRadius: Raggi.completo,
    paddingHorizontal: Spaziatura.md,
    paddingVertical: Spaziatura.xs,
    borderWidth: 1,
    borderColor: Colori.primarioChiaro,
  },
  testoPulsante: {
    fontSize: Tipografia.dimensioniSM,
    color: Colori.primarioScuro,
    fontWeight: Tipografia.pesoMedio,
  },
});
