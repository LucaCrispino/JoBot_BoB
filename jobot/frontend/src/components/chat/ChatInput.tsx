/**
 * JoBot — Componente ChatInput.
 *
 * Campo di input testuale con pulsante di invio.
 * Accessibile per screen reader e tastiere esterne.
 *
 * Accessibilità:
 * - accessibilityLabel su TextInput e pulsante
 * - returnKeyType="send" per tastiera mobile
 * - Disabilitazione visiva durante il caricamento
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colori, Raggi, Spaziatura, Tipografia } from '../../theme';

interface PropsChatInput {
  /** Callback chiamata quando l'utente invia il messaggio. */
  onInvia: (testo: string) => void;
  /** True mentre si attende la risposta del backend. */
  caricamento: boolean;
  /** Placeholder del campo di testo. */
  placeholder?: string;
}

/**
 * Campo di input per la chat con pulsante di invio.
 *
 * Gestisce lo stato locale del testo digitato e svuota il campo
 * automaticamente dopo l'invio.
 */
export function ChatInput({
  onInvia,
  caricamento,
  placeholder = 'Scrivi qui il tuo messaggio...',
}: PropsChatInput): React.JSX.Element {
  const [testo, setTesto] = useState('');

  const gestisciInvio = () => {
    const testoPulito = testo.trim();
    if (!testoPulito || caricamento) return;
    onInvia(testoPulito);
    setTesto('');
  };

  const puòInviare = testo.trim().length > 0 && !caricamento;

  return (
    <View style={stili.contenitore}>
      <TextInput
        style={stili.input}
        value={testo}
        onChangeText={setTesto}
        placeholder={placeholder}
        placeholderTextColor={Colori.testoMuted}
        multiline={true}
        maxLength={2000}
        returnKeyType="send"
        onSubmitEditing={gestisciInvio}
        editable={!caricamento}
        accessibilityLabel="Campo di testo per scrivere a JoBot"
        accessibilityHint="Scrivi il tuo messaggio e premi Invia o il tasto Invio"
        accessibilityRole="none"
      />

      <TouchableOpacity
        style={[stili.pulsante, !puòInviare && stili.pulsanteDisabilitato]}
        onPress={gestisciInvio}
        disabled={!puòInviare}
        accessibilityLabel="Invia messaggio"
        accessibilityHint="Invia il messaggio scritto a JoBot"
        accessibilityRole="button"
        accessibilityState={{ disabled: !puòInviare }}
      >
        {caricamento ? (
          <ActivityIndicator
            size="small"
            color={Colori.sfondoCard}
            accessibilityLabel="JoBot sta rispondendo..."
          />
        ) : (
          <Text style={stili.testoPulsante} accessibilityElementsHidden={true}>
            ➤
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const stili = StyleSheet.create({
  contenitore: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spaziatura.base,
    paddingVertical: Spaziatura.sm,
    backgroundColor: Colori.sfondoCard,
    borderTopWidth: 1,
    borderTopColor: Colori.bordo,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: Colori.sfondo,
    borderRadius: Raggi.xl,
    borderWidth: 1,
    borderColor: Colori.bordo,
    paddingHorizontal: Spaziatura.base,
    paddingVertical: Spaziatura.sm,
    fontSize: Tipografia.dimensioniBase,
    color: Colori.testo,
    marginRight: Spaziatura.sm,
  },
  pulsante: {
    width: 44,
    height: 44,
    borderRadius: Raggi.completo,
    backgroundColor: Colori.primario,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulsanteDisabilitato: {
    backgroundColor: Colori.bordo,
  },
  testoPulsante: {
    color: Colori.sfondoCard,
    fontSize: Tipografia.dimensioniMD,
    fontWeight: Tipografia.pesoGrassetto,
  },
});
