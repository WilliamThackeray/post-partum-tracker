import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { panelShadow } from "../shadow";
import { colors, fonts, radius } from "../theme";
import type { PanelId, VisiblePanels } from "../types";

const PANEL_OPTIONS: { id: PanelId; label: string; hint: string }[] = [
  {
    id: "feed",
    label: "Feeding",
    hint: "Start feeds, track sides, and see recent sessions.",
  },
  {
    id: "medicine",
    label: "Medicine",
    hint: "Dose reminders and medicine list.",
  },
  {
    id: "diaper",
    label: "Diaper",
    hint: "Log wet and messy changes.",
  },
  {
    id: "interval",
    label: "Feeding interval",
    hint: "Set how long between feeds.",
  },
];

type SettingsScreenProps = {
  visiblePanels: VisiblePanels;
  onBack: () => void;
  onSetPanelVisible: (id: PanelId, visible: boolean) => void;
};

export function SettingsScreen({
  visiblePanels,
  onBack,
  onSetPanelVisible,
}: SettingsScreenProps) {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Choose what shows on the home screen.</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.panel}>
          <Text style={styles.sectionHeading}>Panels</Text>
          {PANEL_OPTIONS.map((option, index) => (
            <View
              key={option.id}
              style={[
                styles.row,
                index < PANEL_OPTIONS.length - 1 && styles.rowBorder,
              ]}
            >
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{option.label}</Text>
                <Text style={styles.rowHint}>{option.hint}</Text>
              </View>
              <Switch
                accessibilityLabel={`Show ${option.label} panel`}
                value={visiblePanels[option.id]}
                onValueChange={(visible) => onSetPanelVisible(option.id, visible)}
                trackColor={{ false: colors.border, true: colors.accentSoft }}
                thumbColor={
                  visiblePanels[option.id] ? colors.accent : colors.inkMuted
                }
                ios_backgroundColor={colors.border}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 17.6,
    paddingTop: 6.4,
  },
  header: {
    paddingHorizontal: 2.4,
    paddingBottom: 18,
  },
  backBtn: {
    alignSelf: "flex-start",
    marginBottom: 12,
    paddingVertical: 4,
  },
  backText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.brand,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 36,
    color: colors.brand,
    letterSpacing: -1,
    lineHeight: 40,
  },
  subtitle: {
    marginTop: 6,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.brandMuted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.panel,
    paddingHorizontal: 17.6,
    paddingTop: 16,
    paddingBottom: 8,
    ...panelShadow,
  },
  sectionHeading: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.inkMuted,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 17,
    color: colors.ink,
  },
  rowHint: {
    marginTop: 3,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.75,
  },
});
