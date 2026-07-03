/**
 * JoBot — Componente ChatBubble.
 *
 * Mostra un singolo messaggio nella chat, distinguendo visivamente
 * i messaggi di JoBot da quelli dell'utente.
 *
 * Accessibilità:
 * - accessibilityLabel descrittivo per screen reader
 * - accessibilityRole="text" per i messaggi
 * - Contrasto colori ≥ 4.5:1 (WCAG 2.1 AA)
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colori, Raggi, Spaziatura, Tipografia } from '../../theme';
import type { MessaggioChat } from '../../types';

interface PropsChatBubble {
  messaggio: MessaggioChat;
}

/**
 * Bolla messaggio nella chat.
 *
 * Visualizza il testo del messaggio con stile diverso per JoBot e utente.
 * Le offerte di lavoro e il box supporto sono gestiti dalla schermata Chat,
 * non da questo componente, per mantenere la separazione delle responsabilità.
 */
export function ChatBubble({ messaggio }: PropsChatBubble): React.JSX.Element {
  const èJoBot = messaggio.mittente === 'jobot';

  const etichettaAccessibilità = èJoBot
    ? `JoBot dice: ${messaggio.testo}`
    : `Tu hai scritto: ${messaggio.testo}`;

  const ora = messaggio.timestamp.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View
      style={[
        stili.contenitore,
        èJoBot ? stili.contenitoreJoBot : stili.contenitoreUtente,
      ]}
      accessible={true}
      accessibilityLabel={etichettaAccessibilità}
      accessibilityRole="text"
    >
      {/* Avatar / etichetta mittente */}
      {èJoBot && (
        <Text style={stili.etichettaMittente} accessibilityElementsHidden={true}>
          🤖 JoBot
        </Text>
      )}

      {/* Testo del messaggio */}
      <Text
        style={[stili.testo, èJoBot ? stili.testoJoBot : stili.testoUtente]}
        accessibilityElementsHidden={true} // già letto dall'accessibilityLabel del View
      >
        {messaggio.testo}
      </Text>

      {/* Timestamp */}
      <Text
        style={[stili.ora, èJoBot ? stili.oraJoBot : stili.oraUtente]}
        accessibilityElementsHidden={true}
      >
        {ora}
      </Text>
    </View>
  );
}

const stili = StyleSheet.create({
  contenitore: {
    maxWidth: '80%',
    borderRadius: Raggi.lg,
    padding: Spaziatura.md,
    marginVertical: Spaziatura.xs,
  },
  contenitoreJoBot: {
    alignSelf: 'flex-start',
    backgroundColor: Colori.sfondoChatBot,
    borderBottomLeftRadius: Raggi.sm,
  },
  contenitoreUtente: {
    alignSelf: 'flex-end',
    backgroundColor: Colori.sfondoChatUtente,
    borderBottomRightRadius: Raggi.sm,
  },
  etichettaMittente: {
    fontSize: Tipografia.dimensioniXS,
    fontWeight: Tipografia.pesoGrassetto,
    color: Colori.primario,
    marginBottom: Spaziatura.xs,
  },
  testo: {
    fontSize: Tipografia.dimensioniBase,
    lineHeight: Tipografia.dimensioniBase * Tipografia.altezzaRigaBase,
  },
  testoJoBot: {
    color: Colori.testoChatBot,
  },
  testoUtente: {
    color: Colori.testoChatUtente,
  },
  ora: {
    fontSize: Tipografia.dimensioniXS,
    marginTop: Spaziatura.xs,
    alignSelf: 'flex-end',
  },
  oraJoBot: {
    color: Colori.testoMuted,
  },
  oraUtente: {
    color: 'rgba(255,255,255,0.7)',
  },
});
