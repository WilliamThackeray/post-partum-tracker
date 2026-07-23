import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import {
  formatDateTime,
  formatIntervalHours,
  formatTime,
  isOverdue,
  nextDueAt,
} from "../medicine";
import { colors, fonts, radius } from "../theme";
import type { Medicine } from "../types";

type MedicineCardProps = {
  medicine: Medicine;
  onTake: (id: string) => void;
  onUndoTake: (id: string) => void;
  onRemove: (id: string) => void;
  isFirst?: boolean;
};

export function MedicineCard({
  medicine,
  onTake,
  onUndoTake,
  onRemove,
  isFirst = false,
}: MedicineCardProps) {
  if (!medicine) return null;

  const last = medicine.lastTakenAt;
  const intervalHours = medicine.intervalHours;
  const overdue = isOverdue(last, intervalHours);
  const canUndo =
    (medicine.takenAtLog?.length ?? 0) > 0 || medicine.lastTakenAt != null;
  const nextLabel = last
    ? overdue
      ? `${formatTime(nextDueAt(last, intervalHours).toISOString())} · due now`
      : formatTime(nextDueAt(last, intervalHours).toISOString())
    : "—";

  return (
    <View style={[styles.card, isFirst && styles.cardFirst]}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{medicine.name}</Text>
          <Text style={styles.interval}>
            Every {formatIntervalHours(intervalHours)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${medicine.name}`}
          style={({ pressed }) => [
            styles.removeBtn,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            Alert.alert(
              "Remove medicine?",
              `This removes ${medicine.name} and its dose history.`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Remove",
                  style: "destructive",
                  onPress: () => onRemove(medicine.id),
                },
              ],
            );
          }}
        >
          <Text style={styles.removeText}>Remove</Text>
        </Pressable>
      </View>
      <View style={styles.times}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Last taken</Text>
          <Text style={styles.statValue}>
            {last ? formatDateTime(last) : "Not yet"}
          </Text>
        </View>
        <View
          style={[
            styles.stat,
            last && overdue ? styles.statDue : null,
            last && !overdue ? styles.statOk : null,
          ]}
        >
          <Text style={styles.statLabel}>Next dose</Text>
          <Text
            style={[
              styles.statValue,
              last && overdue ? styles.dueValue : null,
              last && !overdue ? styles.okValue : null,
            ]}
          >
            {nextLabel}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Took ${medicine.name}`}
          style={({ pressed }) => [
            styles.btn,
            styles.takeBtn,
            pressed && styles.pressed,
          ]}
          onPress={() => onTake(medicine.id)}
        >
          <Text style={styles.btnText} numberOfLines={1}>
            Took {medicine.name}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Undo last take of ${medicine.name}`}
          accessibilityState={{ disabled: !canUndo }}
          disabled={!canUndo}
          style={({ pressed }) => [
            styles.btn,
            styles.undoBtn,
            !canUndo && styles.undoBtnDisabled,
            canUndo && pressed && styles.pressed,
          ]}
          onPress={() => {
            Alert.alert(
              "Undo last dose?",
              `This restores the previous next-dose time for ${medicine.name}.`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Undo",
                  style: "destructive",
                  onPress: () => onUndoTake(medicine.id),
                },
              ],
            );
          }}
        >
          <Text
            style={[styles.undoBtnText, !canUndo && styles.undoBtnTextDisabled]}
          >
            Undo
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cardFirst: {
    borderTopWidth: 0,
    paddingTop: 2.4,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10.4,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 19.2,
    color: colors.ink,
  },
  interval: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: colors.inkMuted,
  },
  removeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  removeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.inkMuted,
  },
  times: {
    flexDirection: "row",
    gap: 8.8,
    marginBottom: 12,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.medStatBg,
    borderRadius: radius.soft,
    paddingHorizontal: 12,
    paddingVertical: 10.4,
  },
  statDue: {
    backgroundColor: colors.warnBg,
  },
  statOk: {
    backgroundColor: colors.okBg,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 12.8,
    color: colors.inkMuted,
    marginBottom: 3.2,
  },
  statValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16.8,
    color: colors.ink,
  },
  dueValue: {
    color: colors.warn,
  },
  okValue: {
    color: colors.ok,
  },
  actions: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
  },
  btn: {
    minHeight: 52,
    borderRadius: radius.control,
    alignItems: "center",
    justifyContent: "center",
  },
  takeBtn: {
    flex: 4,
    backgroundColor: colors.accentDeep,
    paddingHorizontal: 10,
  },
  undoBtn: {
    flex: 1,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 6,
  },
  undoBtnDisabled: {
    opacity: 0.45,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  btnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16.8,
    color: colors.white,
  },
  undoBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14.4,
    color: colors.accentDeep,
  },
  undoBtnTextDisabled: {
    color: colors.inkMuted,
  },
});
