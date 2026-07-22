import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  MAX_FEED_INTERVAL_HOURS,
  MIN_FEED_INTERVAL_HOURS,
} from "../storage";
import { colors, fonts, radius } from "../theme";
import { panelShadow } from "../shadow";

type IntervalSettingsProps = {
  intervalHours: number;
  onDown: () => void;
  onUp: () => void;
};

export function IntervalSettings({
  intervalHours,
  onDown,
  onUp,
}: IntervalSettingsProps) {
  const label =
    intervalHours === 1
      ? "1 hour"
      : `${Number(intervalHours.toFixed(1))} hours`;
  const canDown = intervalHours > MIN_FEED_INTERVAL_HOURS;
  const canUp = intervalHours < MAX_FEED_INTERVAL_HOURS;

  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>Feeding interval</Text>
      <Text style={styles.hint}>
        How long between feeds. Next feed is based on when you press Start Feed.
      </Text>
      <View style={styles.control}>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.btn,
            !canDown && styles.btnDisabled,
            pressed && canDown && styles.pressed,
          ]}
          onPress={onDown}
          disabled={!canDown}
          accessibilityLabel="Decrease interval"
        >
          <Text style={styles.btnText}>−</Text>
        </Pressable>
        <Text style={styles.value} accessibilityLiveRegion="polite">
          {label}
        </Text>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.btn,
            !canUp && styles.btnDisabled,
            pressed && canUp && styles.pressed,
          ]}
          onPress={onUp}
          disabled={!canUp}
          accessibilityLabel="Increase interval"
        >
          <Text style={styles.btnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.panel,
    paddingHorizontal: 17.6,
    paddingTop: 18.4,
    paddingBottom: 20,
    marginBottom: 16,
    ...panelShadow,
  },
  heading: {
    marginBottom: 5.6,
    fontFamily: fonts.display,
    fontSize: 21.6,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  hint: {
    marginBottom: 16,
    fontFamily: fonts.body,
    fontSize: 14.7,
    lineHeight: 20,
    color: colors.inkMuted,
  },
  control: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10.4,
  },
  btn: {
    width: 56,
    minHeight: 52,
    borderRadius: radius.control,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: {
    opacity: 0.35,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  btnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 25.6,
    color: colors.accentDeep,
    lineHeight: 28,
  },
  value: {
    flex: 1,
    textAlign: "center",
    fontFamily: fonts.display,
    fontSize: 21.6,
    color: colors.ink,
  },
});
