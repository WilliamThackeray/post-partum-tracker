import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { BUG_REPORT_FORM_URL, FEEDBACK_FORM_URL } from "../feedback";
import { panelShadow } from "../shadow";
import { colors, fonts, radius } from "../theme";
import type {
  NotificationSettings,
  PanelId,
  VisiblePanels,
} from "../types";
import { AddToHomeScreenModal } from "./AddToHomeScreenModal";

const PANEL_OPTIONS: { id: PanelId; label: string; hint: string }[] = [
  {
    id: "feed",
    label: "Feeding",
    hint: "Start feeds, track sides, and see recent sessions.",
  },
  {
    id: "bottle",
    label: "Bottle",
    hint: "Start bottle feeds and log ounces eaten.",
  },
  {
    id: "motherMedicine",
    label: "Mom's medicine",
    hint: "Dose reminders and medicine list for mom.",
  },
  {
    id: "babyMedicine",
    label: "Baby's medicine",
    hint: "Dose reminders and medicine list for baby.",
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

const NOTIFICATION_OPTIONS: {
  key: keyof NotificationSettings;
  label: string;
  hint: string;
}[] = [
  {
    key: "feed",
    label: "Feeding alerts",
    hint: "Notify when the next feed is due.",
  },
  {
    key: "medicine",
    label: "Medicine alerts",
    hint: "Notify when a dose is due for mom or baby.",
  },
];

const HELP_OPTIONS: {
  id: "addToHome" | "bug" | "feedback";
  label: string;
  hint: string;
  url?: string;
}[] = [
  {
    id: "addToHome",
    label: "Add to Home Screen",
    hint: "Add the app to your home screen for quick access.",
  },
  {
    id: "bug",
    label: "Report a bug",
    hint: "Something broken or wrong",
    url: BUG_REPORT_FORM_URL,
  },
  {
    id: "feedback",
    label: "Send feedback",
    hint: "Ideas and suggestions",
    url: FEEDBACK_FORM_URL,
  },
];

async function openFormUrl(url: string) {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      throw new Error("cannot open");
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert("Couldn't open link", "Try again in a moment.");
  }
}

type SettingsScreenProps = {
  visiblePanels: VisiblePanels;
  notificationSettings: NotificationSettings;
  onBack: () => void;
  onSetPanelVisible: (id: PanelId, visible: boolean) => void;
  onSetNotificationEnabled: (
    key: keyof NotificationSettings,
    enabled: boolean,
  ) => void;
};

export function SettingsScreen({
  visiblePanels,
  notificationSettings,
  onBack,
  onSetPanelVisible,
  onSetNotificationEnabled,
}: SettingsScreenProps) {
  const [homeScreenOpen, setHomeScreenOpen] = useState(false);

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
        <Text style={styles.subtitle}>Panels, alerts, and feedback.</Text>
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

        <View style={[styles.panel, styles.sectionPanel]}>
          <Text style={styles.sectionHeading}>Notifications</Text>
          {NOTIFICATION_OPTIONS.map((option, index) => (
            <View
              key={option.key}
              style={[
                styles.row,
                index < NOTIFICATION_OPTIONS.length - 1 && styles.rowBorder,
              ]}
            >
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{option.label}</Text>
                <Text style={styles.rowHint}>{option.hint}</Text>
              </View>
              <Switch
                accessibilityLabel={option.label}
                value={notificationSettings[option.key]}
                onValueChange={(enabled) =>
                  onSetNotificationEnabled(option.key, enabled)
                }
                trackColor={{ false: colors.border, true: colors.accentSoft }}
                thumbColor={
                  notificationSettings[option.key]
                    ? colors.accent
                    : colors.inkMuted
                }
                ios_backgroundColor={colors.border}
              />
            </View>
          ))}
        </View>

        <View style={[styles.panel, styles.sectionPanel]}>
          <Text style={styles.sectionHeading}>Help</Text>
          {HELP_OPTIONS.map((option, index) => {
            const isLink = Boolean(option.url);
            return (
              <Pressable
                key={option.id}
                accessibilityRole={isLink ? "link" : "button"}
                accessibilityLabel={option.label}
                accessibilityHint={
                  isLink ? "Opens in browser" : "Shows install steps"
                }
                onPress={() => {
                  if (option.id === "addToHome") {
                    setHomeScreenOpen(true);
                    return;
                  }
                  if (option.url) {
                    void openFormUrl(option.url);
                  }
                }}
                style={({ pressed }) => [
                  styles.row,
                  index < HELP_OPTIONS.length - 1 && styles.rowBorder,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{option.label}</Text>
                  <Text style={styles.rowHint}>{option.hint}</Text>
                </View>
                <Ionicons
                  name={isLink ? "open-outline" : "phone-portrait-outline"}
                  size={20}
                  color={colors.inkMuted}
                  accessibilityElementsHidden
                />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <AddToHomeScreenModal
        visible={homeScreenOpen}
        onClose={() => setHomeScreenOpen(false)}
      />
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
  sectionPanel: {
    marginTop: 16,
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
