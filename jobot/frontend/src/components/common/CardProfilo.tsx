/**
 * JoBot — Componente CardProfilo.
 *
 * Mostra il profilo utente raccolto progressivamente durante la chat.
 * Viene aggiornato in tempo reale man mano che l'utente risponde alle
 * domande di JoBot.
 *
 * Accessibilità:
 * - accessibilityLabel descrittivo per screen reader
 * - Non mostrato se il profilo è completamente vuoto
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colori, Raggi, Spaziatura, Tipografia } from '../../theme';
import type { ProfiloUtente } from '../../types';

interface PropsCardProfilo {
  profilo: ProfiloUtente;
}

/**
 * Verifica se il profilo contiene almeno un campo valorizzato.
 */
function profiloHaDati(profilo: ProfiloUtente): boolean {
  return Boolean(
    profilo.name ||
      profilo.location ||
      profilo.skills.length > 0 ||
      profilo.experience ||
      profilo.preferences.length > 0,
  );
}

/**
 * Card del profilo utente.
 *
 * Non viene renderizzata se il profilo è completamente vuoto.
 */
export function CardProfilo({ profilo }: PropsCardProfilo): React.JSX.Element | null {
  if (!profiloHaDati(profilo)) {
    return null;
  }

  const riassunto = [
    profilo.name && `Nome: ${profilo.name}`,
    profilo.location && `Zona: ${profilo.location}`,
    profilo.skills.length > 0 && `Competenze: ${profilo.skills.join(', ')}`,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <View
      style={stili.card}
      accessible={true}
      accessibilityLabel={`Il tuo profilo: ${riassunto}`}
      accessibilityRole="none"
    >
      <Text style={stili.titoloCard} accessibilityElementsHidden={true}>
        👤 Il tuo profilo
      </Text>

      {profilo.name ? (
        <RigaProfilo etichetta="Nome" valore={profilo.name} />
      ) : null}
      {profilo.location ? (
        <RigaProfilo etichetta="Zona" valore={profilo.location} />
      ) : null}
      {profilo.skills.length > 0 ? (
        <RigaProfilo
          etichetta="Competenze"
          valore={profilo.skills.join(', ')}
        />
      ) : null}
      {profilo.experience ? (
        <RigaProfilo etichetta="Esperienza" valore={profilo.experience} />
      ) : null}
      {profilo.preferences.length > 0 ? (
        <RigaProfilo
          etichetta="Preferenze"
          valore={profilo.preferences.join(', ')}
        />
      ) : null}
    </View>
  );
}

// ============================================================
// Sub-componente: singola riga del profilo
// ============================================================

interface PropsRigaProfilo {
  etichetta: string;
  valore: string;
}

function RigaProfilo({ etichetta, valore }: PropsRigaProfilo): React.JSX.Element {
  return (
    <View style={stili.riga} accessibilityElementsHidden={true}>
      <Text style={stili.etichetta}>{etichetta}:</Text>
      <Text style={stili.valore} numberOfLines={2}>
        {valore}
      </Text>
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
    borderColor: Colori.bordoChiaro,
    borderLeftWidth: 4,
    borderLeftColor: Colori.primario,
  },
  titoloCard: {
    fontSize: Tipografia.dimensioniBase,
    fontWeight: Tipografia.pesoGrassetto,
    color: Colori.primario,
    marginBottom: Spaziatura.sm,
  },
  riga: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  etichetta: {
    fontSize: Tipografia.dimensioniSM,
    fontWeight: Tipografia.pesoCorsivo,
    color: Colori.testoSecondario,
    width: 90,
    flexShrink: 0,
  },
  valore: {
    fontSize: Tipografia.dimensioniSM,
    color: Colori.testo,
    flex: 1,
  },
});
