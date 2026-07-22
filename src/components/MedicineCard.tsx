import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  formatDateTime,
  formatTime,
  isOverdue,
  MEDICINE_LABELS,
  nextDueAt,
} from "../medicine";
import { colors, fonts, radius } from "../theme";
import type { MedicineKey, MedicineState } from "../types";

type MedicineCardProps = {
  medicineKey: MedicineKey;
  medicine: MedicineState;
  onTake: (key: MedicineKey) => void;
  isFirst?: boolean;
};

export function MedicineCard({
  medicineKey,
  medicine,
  onTake,
  isFirst = false,
}: MedicineCardProps) {
  const last = medicine.lastTakenAt;
  const overdue = isOverdue(last);
  const nextLabel = last
    ? overdue
      ? `${formatTime(nextDueAt(last).toISOString())} · due now`
      : formatTime(nextDueAt(last).toISOString())
    : "—";

  return (
    <View style={[styles.card, isFirst && styles.cardFirst]}>
      <Text style={styles.title}>{MEDICINE_LABELS[medicineKey]}</Text>
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
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
        onPress={() => onTake(medicineKey)}
      >
        <Text style={styles.btnText}>
          Took {MEDICINE_LABELS[medicineKey]}
        </Text>
      </Pressable>
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
  title: {
    marginBottom: 10.4,
    fontFamily: fonts.display,
    fontSize: 19.2,
    color: colors.ink,
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
  btn: {
    width: "100%",
    minHeight: 52,
    borderRadius: radius.control,
    backgroundColor: colors.accentDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  btnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16.8,
    color: colors.white,
  },
});
