import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function LegalLinks({ onOpenDeletion, onOpenPrivacy, onOpenTerms, theme }) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.text, { color: theme.mutedText }]}>
        CDV Dziś jest aplikacją przygotowaną wyłącznie dla Collegium Da Vinci. Logując się, akceptujesz{' '}
        <Text onPress={onOpenPrivacy} style={styles.link}>politykę prywatności</Text>
        {' '}i{' '}
        <Text onPress={onOpenTerms} style={styles.link}>regulamin</Text>
        .
      </Text>
      {onOpenDeletion ? (
        <Pressable onPress={onOpenDeletion} style={styles.deletionHit}>
          <Text style={[styles.deletion, { color: theme.mutedText }]}>Jak usunąć dane z telefonu</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 20,
    paddingHorizontal: 4
  },
  text: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center'
  },
  link: {
    textDecorationLine: 'underline'
  },
  deletionHit: {
    alignSelf: 'center',
    marginTop: 8,
    padding: 4
  },
  deletion: {
    fontSize: 12,
    textDecorationLine: 'underline'
  }
});
