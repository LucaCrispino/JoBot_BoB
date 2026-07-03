/**
 * JoBot — Componente BoxSupporto.
 *
 * Mostra un messaggio empatico di orientamento verso il supporto umano
 * o psicologico quando JoBot rileva segnali di disagio.
 *
 * Design:
 * - Tono caldo e rassicurante, mai allarmistico
 * - Nessun linguaggio clinico o diagnostico
 * - Visivamente distinguibile ma non invasivo
 * - Colori morbidi (giallo tenue) per non spaventare
 *
 * Accessibilità:
 * - accessibilityRole="alert" per annunciarlo agli screen reader
 * - accessibilityLiveRegion="polite" per non interrompere bruscamente
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colori, Raggi, Spaziatura, Tipografia } from '../../theme';
import type { InfoSupporto } from '../../types';

interface PropsBoxSupporto {
  supporto: InfoSupporto;
}

/**
 * Box empatico per il suggerimento di supporto umano/psicologico.
 *
 * Non viene mostrato se `supporto.suggested` è false.
 */
export function BoxSupporto({ supporto }: PropsBoxSupporto): React.JSX.Element | null {
  if (!supporto.suggested || !supporto.message) {
    return null;
  }

  const icona =
    supporto.type === 'psychological_orientation' ? '🤝' : '💬';

  const titolo =
    supporto.type === 'psychological_orientation'
      ? 'Un aiuto è disponibile per te'
      : 'Non sei solo/a in questo';

  return (
    <View
      style={stili.contenitore}
      accessible={true}
      accessibilityLabel={`${titolo}: ${supporto.message}`}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={stili.header}>
        <Text style={stili.icona} accessibilityElementsHidden={true}>
          {icona}
        </Text>
        <Text style={stili.titolo} accessibilityElementsHidden={true}>
          {titolo}
        </Text>
      </View>
      <Text style={stili.messaggio} accessibilityElementsHidden={true}>
        {supporto.message}
      </Text>
    </View>
  );
}

const stili = StyleSheet.create({
  contenitore: {
    backgroundColor: Colori.supportoSfondo,
    borderRadius: Raggi.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colori.supportoBordo,
    padding: Spaziatura.base,
    marginVertical: Spaziatura.sm,
    marginHorizontal: Spaziatura.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spaziatura.sm,
  },
  icona: {
    fontSize: Tipografia.dimensioniLG,
    marginRight: Spaziatura.sm,
  },
  titolo: {
    fontSize: Tipografia.dimensioniBase,
    fontWeight: Tipografia.pesoGrassetto,
    color: Colori.supportoTesto,
    flex: 1,
  },
  messaggio: {
    fontSize: Tipografia.dimensioniSM,
    color: Colori.supportoTesto,
    lineHeight: Tipografia.dimensioniSM * Tipografia.altezzaRigaBase,
  },
});
