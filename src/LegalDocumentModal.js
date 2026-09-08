import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LEGAL_DOCUMENTS, LEGAL_URLS } from './legal';

const BRAND_GRADIENT = ['#7a00df', '#a699fc', '#fb7153'];
const BRAND_GRADIENT_START = { x: 0, y: 1 };
const BRAND_GRADIENT_END = { x: 1, y: 0 };
const BRAND_GRADIENT_TEXT = '#ffffff';
const FONT = {
  body: 'Krub-Regular',
  bodyBold: 'Krub-Bold',
  title: 'Inter-ExtraBold',
  mono: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
};

const WEB_URL_BY_KEY = {
  privacy: LEGAL_URLS.privacy,
  terms: LEGAL_URLS.terms,
  deletion: LEGAL_URLS.accountDeletion
};

export function LegalDocumentModal({ documentKey, onClose, theme, visible }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const modalStyles = useMemo(() => createStyles(theme), [theme]);
  const document = LEGAL_DOCUMENTS[documentKey];
  const webUrl = WEB_URL_BY_KEY[documentKey];
  const scrollMaxHeight = Math.round(height * 0.52);

  if (!document) return null;

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={[modalStyles.scrim, { paddingBottom: Math.max(insets.bottom, 16), paddingTop: Math.max(insets.top, 16) }]}>
        <View style={modalStyles.panel}>
          <LinearGradient
            colors={BRAND_GRADIENT}
            end={{ x: 1, y: 0 }}
            start={{ x: 0, y: 0 }}
            style={modalStyles.accentBar}
          />

          <View style={modalStyles.header}>
            <View style={modalStyles.titleBlock}>
              <Text style={modalStyles.filePath}>{document.file}</Text>
              <Text style={modalStyles.title}>{document.title}</Text>
            </View>
            <Pressable accessibilityLabel="Zamknij" hitSlop={8} onPress={onClose} style={modalStyles.closeButton}>
              <Ionicons color={theme.text} name="close" size={20} />
            </Pressable>
          </View>

          <View style={modalStyles.chipRow}>
            {document.chips.map((chip) => (
              <View key={chip} style={modalStyles.chip}>
                <Text style={modalStyles.chipText}>{chip}</Text>
              </View>
            ))}
          </View>

          <Text style={modalStyles.summary}>{document.summary}</Text>

          <ScrollView
            contentContainerStyle={modalStyles.scrollContent}
            showsVerticalScrollIndicator={false}
            style={[modalStyles.scroll, { maxHeight: scrollMaxHeight }]}
          >
            {document.sections.map((section) => (
              <View key={section.id} style={modalStyles.section}>
                <View style={modalStyles.sectionHead}>
                  <Text style={modalStyles.sectionId}>{section.id}</Text>
                  <Text style={modalStyles.heading}>{section.heading}</Text>
                </View>

                {section.body ? <Text style={modalStyles.body}>{section.body}</Text> : null}

                {section.rows?.length ? (
                  <View style={modalStyles.spec}>
                    {section.rows.map((row, index) => (
                      <View
                        key={row.k}
                        style={[modalStyles.specRow, index === section.rows.length - 1 && modalStyles.specRowLast]}
                      >
                        <Text style={modalStyles.specKey}>{row.k}</Text>
                        <Text style={modalStyles.specValue}>{row.v}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {section.bullets?.length ? (
                  <View style={modalStyles.list}>
                    {section.bullets.map((item) => (
                      <View key={item} style={modalStyles.listRow}>
                        <Text style={modalStyles.listMark}>›</Text>
                        <Text style={modalStyles.listText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {section.steps?.length ? (
                  <View style={modalStyles.list}>
                    {section.steps.map((step, index) => (
                      <View key={step} style={modalStyles.listRow}>
                        <Text style={modalStyles.stepIndex}>{String(index + 1).padStart(2, '0')}</Text>
                        <Text style={modalStyles.listText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {section.note ? <Text style={modalStyles.note}>{section.note}</Text> : null}
              </View>
            ))}
          </ScrollView>

          <View style={modalStyles.footer}>
            {webUrl ? (
              <Pressable
                onPress={() => Linking.openURL(webUrl).catch(() => {})}
                style={modalStyles.secondaryButton}
              >
                <Ionicons color={theme.mutedText} name="open-outline" size={16} />
                <Text style={modalStyles.secondaryButtonText}>Źródło</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={onClose} style={modalStyles.primaryButton}>
              <LinearGradient
                colors={BRAND_GRADIENT}
                end={BRAND_GRADIENT_END}
                start={BRAND_GRADIENT_START}
                style={modalStyles.primaryGradient}
              >
                <Text style={modalStyles.primaryText}>Zamknij</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    scrim: {
      backgroundColor: 'rgba(0,0,0,0.55)',
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 16
    },
    panel: {
      backgroundColor: theme.screenBg,
      borderColor: theme.border,
      borderRadius: 18,
      borderWidth: 1,
      overflow: 'hidden',
      paddingBottom: 16,
      paddingHorizontal: 16,
      paddingTop: 14,
      width: '100%'
    },
    accentBar: {
      height: 3,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0
    },
    header: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 10,
      marginTop: 6
    },
    titleBlock: {
      flex: 1,
      paddingTop: 2
    },
    filePath: {
      color: theme.formFocus,
      fontFamily: FONT.mono,
      fontSize: 11,
      letterSpacing: 0.2
    },
    title: {
      color: theme.text,
      fontFamily: FONT.title,
      fontSize: 22,
      includeFontPadding: false,
      letterSpacing: -0.4,
      marginTop: 4
    },
    closeButton: {
      alignItems: 'center',
      backgroundColor: theme.surfaceBg,
      borderRadius: 16,
      height: 32,
      justifyContent: 'center',
      width: 32
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 12
    },
    chip: {
      backgroundColor: theme.surfaceBg,
      borderColor: theme.border,
      borderRadius: 6,
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 4
    },
    chipText: {
      color: theme.mutedText,
      fontFamily: FONT.mono,
      fontSize: 10,
      letterSpacing: 0.3
    },
    summary: {
      color: theme.secondaryText,
      fontFamily: FONT.body,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 12,
      marginTop: 12
    },
    scroll: {
      flexGrow: 0
    },
    scrollContent: {
      gap: 10,
      paddingBottom: 4
    },
    section: {
      backgroundColor: theme.panelAlt,
      borderColor: theme.border,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 10
    },
    sectionHead: {
      alignItems: 'baseline',
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8
    },
    sectionId: {
      color: theme.formFocus,
      fontFamily: FONT.mono,
      fontSize: 12
    },
    heading: {
      color: theme.text,
      fontFamily: FONT.bodyBold,
      fontSize: 14,
      letterSpacing: 0.4,
      textTransform: 'uppercase'
    },
    body: {
      color: theme.fieldText,
      fontFamily: FONT.body,
      fontSize: 14,
      lineHeight: 21
    },
    spec: {
      gap: 0
    },
    specRow: {
      borderBottomColor: theme.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 8
    },
    specRowLast: {
      borderBottomWidth: 0,
      paddingBottom: 0
    },
    specKey: {
      color: theme.mutedText,
      fontFamily: FONT.mono,
      fontSize: 12,
      lineHeight: 18,
      width: 72
    },
    specValue: {
      color: theme.fieldText,
      flex: 1,
      fontFamily: FONT.body,
      fontSize: 13,
      lineHeight: 18
    },
    list: {
      gap: 8
    },
    listRow: {
      flexDirection: 'row',
      gap: 8
    },
    listMark: {
      color: theme.formFocus,
      fontFamily: FONT.mono,
      fontSize: 14,
      lineHeight: 20,
      width: 12
    },
    stepIndex: {
      color: theme.formFocus,
      fontFamily: FONT.mono,
      fontSize: 12,
      lineHeight: 20,
      width: 22
    },
    listText: {
      color: theme.fieldText,
      flex: 1,
      fontFamily: FONT.body,
      fontSize: 14,
      lineHeight: 20
    },
    note: {
      color: theme.mutedText,
      fontFamily: FONT.body,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 10
    },
    footer: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 14
    },
    secondaryButton: {
      alignItems: 'center',
      backgroundColor: theme.surfaceBg,
      borderColor: theme.border,
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12
    },
    secondaryButtonText: {
      color: theme.fieldText,
      fontFamily: FONT.bodyBold,
      fontSize: 13
    },
    primaryButton: {
      borderRadius: 12,
      flex: 1,
      overflow: 'hidden'
    },
    primaryGradient: {
      alignItems: 'center',
      paddingVertical: 12
    },
    primaryText: {
      color: BRAND_GRADIENT_TEXT,
      fontFamily: FONT.bodyBold,
      fontSize: 14
    }
  });
}
