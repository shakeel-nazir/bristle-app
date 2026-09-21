import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, radius } from '../theme/theme';
import AnimatedPressable from './AnimatedPressable';
import { LEGAL_SECTIONS } from '../utils/legal';

// Shows the legal text. With `onAgree` it is a "read this, then agree to continue" step;
// without it, it is just a reader with a Close button.
export default function LegalModal({ visible, onClose, onAgree }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{onAgree ? 'Before you continue' : 'Legal'}</Text>
          {onAgree ? (
            <Text style={styles.intro}>Please read and agree to our terms to create your Bristle account.</Text>
          ) : null}

          <ScrollView style={styles.scroll}>
            {LEGAL_SECTIONS.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionBody}>{section.body}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <AnimatedPressable style={styles.secondary} onPress={onClose}>
              <Text style={styles.secondaryText}>{onAgree ? 'Cancel' : 'Close'}</Text>
            </AnimatedPressable>
            {onAgree ? (
              <AnimatedPressable style={styles.primary} onPress={onAgree}>
                <Text style={styles.primaryText}>Agree & continue</Text>
              </AnimatedPressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(24,20,16,0.45)', alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  card: { width: '100%', maxWidth: 460, maxHeight: '90%', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  intro: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  scroll: { flexGrow: 0, marginTop: spacing.md },
  section: { marginBottom: spacing.md },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },
  sectionBody: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  secondary: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.md },
  secondaryText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  primary: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 18 },
  primaryText: { fontSize: 14, fontWeight: '700', color: colors.accentText },
});
