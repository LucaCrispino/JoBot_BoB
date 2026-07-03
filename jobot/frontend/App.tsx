/**
 * JoBot — App.tsx: Entry point dell'applicazione React Native/Expo.
 *
 * Gestisce:
 * - SafeAreaView per notch e barre di sistema
 * - StatusBar configurata con colori JoBot
 * - Routing verso la schermata principale
 *
 * Per avviare:
 *   npx expo start
 */

import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { SchermataChatPrincipale } from './src/screens/SchermataChatPrincipale';
import { Colori } from './src/theme';

/**
 * Componente radice dell'applicazione JoBot.
 */
export default function App(): React.JSX.Element {
  return (
    <SafeAreaView
      style={stili.contenitore}
      accessible={false}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colori.sfondo}
      />
      <SchermataChatPrincipale />
    </SafeAreaView>
  );
}

const stili = StyleSheet.create({
  contenitore: {
    flex: 1,
    backgroundColor: Colori.sfondo,
  },
});
