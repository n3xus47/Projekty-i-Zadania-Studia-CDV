import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LEGAL_DOCUMENTS, LEGAL_URLS } from './legal';

const BRAND_GRADIENT = ['#7a00df', '#a699fc', '#fb7153'];
const BRAND_GRADIENT_START = { x: 0, y: 1 };
const BRAND_GRADIENT_END = { x: 1, y: 0 };
const BRAND_GRADIENT_TEXT = '#ffffff';

export function LegalDocumentModal({ documentKey, onClose, theme, visible }) {
  const modalStyles = useMemo(() => createStyles(theme), [theme]);
  const document = LEGAL_DOCUMENTS[documentKey];
  const webUrl =
    documentKey === 'privacy' ? LEGAL_URLS.privacy : documentKey === 'terms' ? LEGAL_URLS.terms : LEGAL_URLS.accountDeletion;

  if (!document) return null;

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={modalStyles.scrim}>
        <View style={modalStyles.panel}>
          <View style={modalStyles.header}>
            <LinearGradient
              colors={BRAND_GRADIENT}
              end={BRAND_GRADIENT_END}
              start={BRAND_GRADIENT_START}
              style={modalStyles.iconWrap}
            >
              <Ionicons color={BRAND_GRADIENT_TEXT} name="shield-checkmark-outline" size={22} />
            </LinearGradient>
            <View style={modalStyles.titleBlock}>
              <Text style={modalStyles.title}>{document.title}</Text>
              <Text style={modalStyles.subtitle}>{document.subtitle}</Text>
            </View>
            <Pressable accessibilityLabel="Zamknij" hitSlop={8} onPress={onClose} style={modalStyles.closeButton}>
              <Ionicons color={theme.text} name="close" size={22} />
            </Pressable>
          </View>

          <ScrollView style={modalStyles.scroll} contentContainerStyle={modalStyles.scrollContent}>
            {document.sections.map((section) => (
              <View key={section.heading} style={modalStyles.section}>
                <Text style={modalStyles.heading}>{section.heading}</Text>
                <Text style={modalStyles.body}>{section.body}</Text>
              </View>
            ))}
          </ScrollView>

          {webUrl ? (
            <Pressable
              onPress={() => Linking.openURL(webUrl).catch(() => {})}
              style={modalStyles.linkButton}
            >
              <Text style={modalStyles.linkButtonText}>Otwórz w przeglądarce</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    scrim: {
      backgroundColor: 'rgba(0,0,0,0.45)',
      flex: 1,
      justifyContent: 'center',
      padding: 16
    },
    panel: {
      backgroundColor: theme.surfaceBg,
      borderRadius: 16,
      maxHeight: '88%',
      padding: 18,
      width: '100%'
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12
    },
    iconWrap: {
      alignItems: 'center',
      borderRadius: 12,
      height: 44,
      justifyContent: 'center',
      width: 44
    },
    titleBlock: {
      flex: 1
    },
    title: {
      color: theme.fieldText,
      fontSize: 17,
      fontWeight: '700'
    },
    subtitle: {
      color: theme.mutedText,
      fontSize: 13,
      marginTop: 2
    },
    closeButton: {
      padding: 4
    },
    scroll: {
      maxHeight: 420
    },
    scrollContent: {
      gap: 14,
      paddingBottom: 8
    },
    section: {
      gap: 4
    },
    heading: {
      color: theme.fieldText,
      fontSize: 15,
      fontWeight: '700'
    },
    body: {
      color: theme.fieldText,
      fontSize: 14,
      lineHeight: 20
    },
    linkButton: {
      alignItems: 'center',
      marginTop: 12,
      paddingVertical: 10
    },
    linkButtonText: {
      color: theme.mutedText,
      fontSize: 13,
      textDecorationLine: 'underline'
    }
  });
}
