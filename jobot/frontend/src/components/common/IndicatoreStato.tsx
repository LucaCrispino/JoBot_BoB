/**
 * JoBot — Componente IndicatoreStato.
 *
 * Mostra una pillola visiva con lo stato corrente della conversazione.
 *
 * Accessibilità:
 * - accessibilityLabel descrittivo
 * - accessibilityLiveRegion="polite" per annunciare i cambi di stato
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colori, EtichetteStato, Raggi, Spaziatura, Tipografia } from '../../theme';
import type { StatoConversazione } from '../../types';

interface PropsIndicatoreStato {
  stato: StatoConversazione;
}

/**
 * Pillola che indica lo stato corrente della conversazione.
 */
export function IndicatoreStato({ stato }: PropsIndicatoreStato): React.JSX.Element {
  const etichetta = EtichetteStato[stato] ?? stato;

  return (
    <View
      style={stili.contenitore}
      accessible={true}
      accessibilityLabel={`Fase corrente: ${etichetta}`}
      accessibilityLiveRegion="polite"
    >
      <Text style={stili.testo} accessibilityElementsHidden={true}>
        {etichetta}
      </Text>
    </View>
  );
}

const stili = StyleSheet.create({
  contenitore: {
    backgroundColor: Colori.sfondoChatBot,
    borderRadius: Raggi.completo,
    paddingHorizontal: Spaziatura.md,
    paddingVertical: Spaziatura.xs,
    alignSelf: 'center',
    marginVertical: Spaziatura.xs,
    borderWidth: 1,
    borderColor: Colori.primarioChiaro,
  },
  testo: {
    fontSize: Tipografia.dimensioniXS,
    color: Colori.primarioScuro,
    fontWeight: Tipografia.pesoCorsivo,
  },
});
