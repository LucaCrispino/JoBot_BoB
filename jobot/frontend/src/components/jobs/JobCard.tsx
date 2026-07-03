/**
 * JoBot — Componente JobCard.
 *
 * Mostra una singola offerta di lavoro in formato card.
 *
 * Accessibilità:
 * - accessibilityLabel che descrive l'offerta completa
 * - Badge colorato per la fonte dell'offerta
 * - Link accessibile per aprire l'offerta originale
 */

import React, { useState } from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colori, Raggi, Spaziatura, Tipografia } from '../../theme';
import type { FonteOfferta, OffertaLavoro } from '../../types';

interface PropsJobCard {
  offerta: OffertaLavoro;
}

// ============================================================
// Etichette per badge fonte
// ============================================================

const etichetteFonte: Record<FonteOfferta, string> = {
  mock: 'Demo',
  adzuna: 'Adzuna',
  infojobs: 'InfoJobs',
  careerjet: 'CareerJet',
};

const coloriBadgeFonte: Record<FonteOfferta, string> = {
  mock: Colori.badgeMock,
  adzuna: Colori.badgeAdzuna,
  infojobs: Colori.badgeInfojobs,
  careerjet: Colori.badgeCareerjet,
};

/**
 * Card per visualizzare un'offerta di lavoro.
 *
 * Mostra titolo, azienda, luogo, descrizione e un link per aprire
 * l'offerta nel browser. Include il badge con la fonte dell'offerta.
 */
export function JobCard({ offerta }: PropsJobCard): React.JSX.Element {
  const [descrizioneEstesa, setDescrizioneEstesa] = useState(false);

  const etichettaAccesso = [
    `Offerta: ${offerta.title}`,
    `Azienda: ${offerta.company}`,
    `Luogo: ${offerta.location}`,
    offerta.published_at ? `Pubblicata il ${offerta.published_at}` : '',
  ]
    .filter(Boolean)
    .join(', ');

  const apriLink = async () => {
    if (offerta.url && offerta.url.startsWith('http')) {
      await Linking.openURL(offerta.url);
    }
  };

  const toggleDescrizione = () => {
    setDescrizioneEstesa((prev) => !prev);
  };

  const dataFormattata = offerta.published_at
    ? new Date(offerta.published_at).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <View
      style={stili.card}
      accessible={true}
      accessibilityLabel={etichettaAccesso}
      accessibilityRole="none"
    >
      {/* Header card: titolo + badge fonte */}
      <View style={stili.header}>
        <Text
          style={stili.titolo}
          numberOfLines={2}
          accessibilityElementsHidden={true}
        >
          {offerta.title}
        </Text>
        <View
          style={[
            stili.badge,
            { backgroundColor: coloriBadgeFonte[offerta.source] },
          ]}
          accessibilityElementsHidden={true}
        >
          <Text style={stili.testoBadge}>
            {etichetteFonte[offerta.source]}
          </Text>
        </View>
      </View>

      {/* Azienda e luogo */}
      <Text style={stili.azienda} accessibilityElementsHidden={true}>
        🏢 {offerta.company}
      </Text>
      <Text style={stili.luogo} accessibilityElementsHidden={true}>
        📍 {offerta.location}
      </Text>

      {/* Data pubblicazione */}
      {dataFormattata && (
        <Text style={stili.data} accessibilityElementsHidden={true}>
          📅 {dataFormattata}
        </Text>
      )}

      {/* Descrizione (espandibile) */}
      <TouchableOpacity
        onPress={toggleDescrizione}
        accessibilityLabel={
          descrizioneEstesa ? 'Mostra meno dettagli' : 'Mostra dettagli offerta'
        }
        accessibilityRole="button"
      >
        <Text
          style={stili.descrizione}
          numberOfLines={descrizioneEstesa ? undefined : 2}
        >
          {offerta.description}
        </Text>
        <Text style={stili.mostraAltro}>
          {descrizioneEstesa ? 'Mostra meno ▲' : 'Mostra tutto ▼'}
        </Text>
      </TouchableOpacity>

      {/* Pulsante link */}
      {offerta.url && offerta.url.startsWith('http') && (
        <TouchableOpacity
          style={stili.pulsanteLink}
          onPress={apriLink}
          accessibilityLabel={`Apri offerta: ${offerta.title} su ${etichetteFonte[offerta.source]}`}
          accessibilityRole="link"
          accessibilityHint="Apre il sito dell'offerta di lavoro nel browser"
        >
          <Text style={stili.testoPulsanteLink}>Vedi offerta →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const stili = StyleSheet.create({
  card: {
    backgroundColor: Colori.sfondoCard,
    borderRadius: Raggi.lg,
    padding: Spaziatura.base,
    marginVertical: Spaziatura.sm,
    borderWidth: 1,
    borderColor: Colori.bordo,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spaziatura.sm,
  },
  titolo: {
    flex: 1,
    fontSize: Tipografia.dimensioniMD,
    fontWeight: Tipografia.pesoGrassetto,
    color: Colori.testo,
    marginRight: Spaziatura.sm,
  },
  badge: {
    paddingHorizontal: Spaziatura.sm,
    paddingVertical: 3,
    borderRadius: Raggi.sm,
  },
  testoBadge: {
    color: '#FFFFFF',
    fontSize: Tipografia.dimensioniXS,
    fontWeight: Tipografia.pesoCorsivo,
  },
  azienda: {
    fontSize: Tipografia.dimensioniSM,
    color: Colori.testo,
    fontWeight: Tipografia.pesoMedio,
    marginBottom: 3,
  },
  luogo: {
    fontSize: Tipografia.dimensioniSM,
    color: Colori.testoSecondario,
    marginBottom: 3,
  },
  data: {
    fontSize: Tipografia.dimensioniXS,
    color: Colori.testoMuted,
    marginBottom: Spaziatura.sm,
  },
  descrizione: {
    fontSize: Tipografia.dimensioniSM,
    color: Colori.testoSecondario,
    lineHeight: Tipografia.dimensioniSM * 1.5,
    marginTop: Spaziatura.sm,
  },
  mostraAltro: {
    fontSize: Tipografia.dimensioniXS,
    color: Colori.primario,
    marginTop: 4,
    fontWeight: Tipografia.pesoCorsivo,
  },
  pulsanteLink: {
    marginTop: Spaziatura.md,
    backgroundColor: Colori.primario,
    borderRadius: Raggi.md,
    paddingVertical: Spaziatura.sm,
    paddingHorizontal: Spaziatura.base,
    alignSelf: 'flex-start',
  },
  testoPulsanteLink: {
    color: '#FFFFFF',
    fontSize: Tipografia.dimensioniSM,
    fontWeight: Tipografia.pesoCorsivo,
  },
});
