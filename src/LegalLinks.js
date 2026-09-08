import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function LegalLinks({ onOpenDeletion, onOpenPrivacy, onOpenTerms, theme }) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.text, { color: theme.mutedText }]}>
        Tylko Collegium Da Vinci. Logując się akceptujesz politykę i regulamin.
      </Text>
      <View style={styles.row}>
        <Pressable hitSlop={6} onPress={onOpenPrivacy}>
          <Text style={[styles.link, { color: theme.formFocus }]}>privacy.md</Text>
        </Pressable>
        <Text style={[styles.sep, { color: theme.mutedText }]}>/</Text>
        <Pressable hitSlop={6} onPress={onOpenTerms}>
          <Text style={[styles.link, { color: theme.formFocus }]}>terms.md</Text>
        </Pressable>
        {onOpenDeletion ? (
          <>
            <Text style={[styles.sep, { color: theme.mutedText }]}>/</Text>
            <Pressable hitSlop={6} onPress={onOpenDeletion}>
              <Text style={[styles.link, { color: theme.formFocus }]}>wipe.md</Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 4
  },
  text: {
    fontFamily: 'Krub-Regular',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center'
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 8
  },
  link: {
    fontFamily: 'monospace',
    fontSize: 12,
    letterSpacing: 0.2
  },
  sep: {
    fontFamily: 'monospace',
    fontSize: 12
  }
});
