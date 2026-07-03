/**
 * JoBot — Schermata principale della chat.
 *
 * Integra tutti i componenti della chat:
 * - Lista messaggi con auto-scroll
 * - Card profilo (visibile in alto quando ci sono dati)
 * - Card offerte di lavoro (mostrate inline nella chat)
 * - Box supporto (mostrato quando rilevato disagio)
 * - Indicatore stato conversazionale
 * - Pulsanti rapidi contestuali
 * - Campo di input
 *
 * Accessibilità:
 * - KeyboardAvoidingView per gestire la tastiera virtuale
 * - accessibilityLiveRegion sui nuovi messaggi
 */

import React, { useEffect, useRef } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BoxSupporto } from '../components/common/BoxSupporto';
import { CardProfilo } from '../components/common/CardProfilo';
import { IndicatoreStato } from '../components/common/IndicatoreStato';
import { ChatBubble } from '../components/chat/ChatBubble';
import { ChatInput } from '../components/chat/ChatInput';
import { PulsantiRapidi } from '../components/chat/PulsantiRapidi';
import { JobCard } from '../components/jobs/JobCard';
import { useChat } from '../hooks/useChat';
import { Colori, Raggi, Spaziatura, Tipografia } from '../theme';
import type { MessaggioChat } from '../types';

/**
 * Schermata chat principale di JoBot.
 */
export function SchermataChatPrincipale(): React.JSX.Element {
  const { stato, azioni } = useChat();
  const refLista = useRef<FlatList<MessaggioChat>>(null);

  // Auto-scroll verso il basso ad ogni nuovo messaggio
  useEffect(() => {
    if (stato.messaggi.length > 0) {
      setTimeout(() => {
        refLista.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [stato.messaggi.length]);

  // ============================================================
  // Rendering di un singolo elemento della lista
  // ============================================================

  const renderMessaggio = ({ item }: { item: MessaggioChat }) => (
    <View style={stili.wrapperMessaggio}>
      <ChatBubble messaggio={item} />

      {/* Mostra il box supporto dopo il messaggio JoBot che lo contiene */}
      {item.mittente === 'jobot' && item.supporto?.suggested && (
        <BoxSupporto supporto={item.supporto} />
      )}

      {/* Mostra le offerte di lavoro dopo il messaggio JoBot che le contiene */}
      {item.mittente === 'jobot' &&
        item.offerte &&
        item.offerte.length > 0 && (
          <View style={stili.contenitoreOfferte}>
            <Text style={stili.titoloOfferte} accessibilityElementsHidden={true}>
              💼 Offerte trovate ({item.offerte.length})
            </Text>
            {item.offerte.map((offerta, idx) => (
              <JobCard
                key={`${offerta.url}-${idx}`}
                offerta={offerta}
              />
            ))}
          </View>
        )}
    </View>
  );

  // ============================================================
  // Rendering header (sopra la lista messaggi)
  // ============================================================

  const renderHeader = () => (
    <View style={stili.header}>
      <View style={stili.headerTop}>
        <Text style={stili.titoloApp} accessibilityRole="header">
          🤖 JoBot
        </Text>
        <TouchableOpacity
          onPress={azioni.resetta}
          style={stili.pulsanteResetta}
          accessibilityLabel="Ricomincia la conversazione"
          accessibilityRole="button"
        >
          <Text style={stili.testoResetta}>Ricomincia</Text>
        </TouchableOpacity>
      </View>
      <IndicatoreStato stato={stato.statoConversazione} />
      <CardProfilo profilo={stato.profilo} />
    </View>
  );

  // ============================================================
  // Rendering banner errore
  // ============================================================

  const renderErrore = () => {
    if (!stato.errore) return null;
    return (
      <View
        style={stili.bannerErrore}
        accessible={true}
        accessibilityLabel={`Errore: ${stato.errore}`}
        accessibilityRole="alert"
      >
        <Text style={stili.testoErrore}>⚠️ {stato.errore}</Text>
        <TouchableOpacity
          onPress={azioni.cancellaErrore}
          accessibilityLabel="Chiudi notifica errore"
          accessibilityRole="button"
        >
          <Text style={stili.pulsanteChiudiErrore}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ============================================================
  // Render principale
  // ============================================================

  return (
    <KeyboardAvoidingView
      style={stili.schermo}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Banner errore (sopra tutto) */}
      {renderErrore()}

      {/* Lista messaggi */}
      <FlatList
        ref={refLista}
        data={stato.messaggi}
        keyExtractor={(item) => item.id}
        renderItem={renderMessaggio}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={stili.contenutoLista}
        style={stili.lista}
        showsVerticalScrollIndicator={false}
        accessibilityLabel="Conversazione con JoBot"
      />

      {/* Pulsanti rapidi contestuali */}
      <PulsantiRapidi
        stato={stato.statoConversazione}
        onSuggerimento={(testo) => void azioni.invia(testo)}
      />

      {/* Campo di input */}
      <ChatInput
        onInvia={(testo) => void azioni.invia(testo)}
        caricamento={stato.caricamento}
      />
    </KeyboardAvoidingView>
  );
}

// ============================================================
// Stili
// ============================================================

const stili = StyleSheet.create({
  schermo: {
    flex: 1,
    backgroundColor: Colori.sfondo,
  },
  header: {
    paddingHorizontal: Spaziatura.base,
    paddingTop: Spaziatura.xl,
    paddingBottom: Spaziatura.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spaziatura.sm,
  },
  titoloApp: {
    fontSize: Tipografia.dimensioniXL,
    fontWeight: Tipografia.pesoGrassetto,
    color: Colori.primario,
  },
  pulsanteResetta: {
    paddingHorizontal: Spaziatura.md,
    paddingVertical: Spaziatura.xs,
    borderRadius: Raggi.md,
    borderWidth: 1,
    borderColor: Colori.primario,
  },
  testoResetta: {
    color: Colori.primario,
    fontSize: Tipografia.dimensioniXS,
    fontWeight: Tipografia.pesoMedio,
  },
  lista: {
    flex: 1,
  },
  contenutoLista: {
    paddingHorizontal: Spaziatura.base,
    paddingBottom: Spaziatura.base,
  },
  wrapperMessaggio: {
    marginBottom: Spaziatura.xs,
  },
  contenitoreOfferte: {
    marginTop: Spaziatura.sm,
  },
  titoloOfferte: {
    fontSize: Tipografia.dimensioniBase,
    fontWeight: Tipografia.pesoCorsivo,
    color: Colori.testoSecondario,
    marginBottom: Spaziatura.xs,
    marginLeft: Spaziatura.xs,
  },
  bannerErrore: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colori.erroreSfondo,
    paddingHorizontal: Spaziatura.base,
    paddingVertical: Spaziatura.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colori.errore,
  },
  testoErrore: {
    flex: 1,
    color: Colori.errore,
    fontSize: Tipografia.dimensioniSM,
  },
  pulsanteChiudiErrore: {
    color: Colori.errore,
    fontSize: Tipografia.dimensioniMD,
    fontWeight: Tipografia.pesoGrassetto,
    paddingLeft: Spaziatura.sm,
  },
});
