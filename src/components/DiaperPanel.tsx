import { Pressable, StyleSheet, Text, View } from "react-native";
import { diaperKind, formatDiaperKind } from "../diaper";
import { formatDateTime } from "../medicine";
import { panelShadow } from "../shadow";
import { colors, fonts, radius } from "../theme";
import type { DiaperChange, DiaperKind } from "../types";
import { DiaperLogList } from "./DiaperLogList";

/** How many recent diaper changes to show on the home card before "See more". */
export const DIAPER_PREVIEW_LIMIT = 5;

const LOG_OPTIONS: { kind: DiaperKind; label: string }[] = [
  { kind: "wet", label: "Wet" },
  { kind: "messy", label: "Messy" },
  { kind: "both", label: "Both" },
];

type DiaperPanelProps = {
  diapers: DiaperChange[];
  onLog: (kind: DiaperKind) => void;
  onDelete: (id: string) => void;
  onSeeMoreDiapers: () => void;
};

export function DiaperPanel({
  diapers,
  onLog,
  onDelete,
  onSeeMoreDiapers,
}: DiaperPanelProps) {
  const list = Array.isArray(diapers) ? diapers : [];
  const preview = list.slice(0, DIAPER_PREVIEW_LIMIT);
  const hasMore = list.length > DIAPER_PREVIEW_LIMIT;
  const last = list[0] ?? null;

  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>Diapers</Text>

      <View style={styles.meta}>
        <Text style={styles.metaLabel}>Last change</Text>
        <Text style={styles.metaValue}>
          {last
            ? `${formatDateTime(last.changedAt)} · ${formatDiaperKind(diaperKind(last))}`
            : "—"}
        </Text>
      </View>

      <View style={styles.actions}>
        {LOG_OPTIONS.map(({ kind, label }) => (
          <Pressable
            key={kind}
            accessibilityRole="button"
            accessibilityLabel={`Log ${label.toLowerCase()} diaper`}
            style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
            onPress={() => onLog(kind)}
          >
            <Text style={styles.btnText}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.history}>
        <DiaperLogList diapers={preview} onDelete={onDelete} />
        {hasMore ? (
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.seeMoreBtn,
              pressed && styles.pressed,
            ]}
            onPress={onSeeMoreDiapers}
          >
            <Text style={styles.seeMoreText}>See more</Text>
          </Pressable>
        ) : null}
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
    marginBottom: 13.6,
    fontFamily: fonts.display,
    fontSize: 21.6,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  meta: {
    marginBottom: 14,
    paddingHorizontal: 13.6,
    paddingVertical: 12,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.soft,
  },
  metaLabel: {
    fontFamily: fonts.body,
    fontSize: 15.2,
    color: colors.accentDeep,
  },
  metaValue: {
    marginTop: 2.4,
    fontFamily: fonts.bodySemiBold,
    fontSize: 16.8,
    color: colors.ink,
  },
  actions: {
    flexDirection: "row",
    gap: 8.8,
  },
  btn: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.control,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  btnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15.5,
    color: colors.white,
  },
  history: {
    marginTop: 16,
  },
  seeMoreBtn: {
    marginTop: 4,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  seeMoreText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15.5,
    color: colors.accentDeep,
  },
});
