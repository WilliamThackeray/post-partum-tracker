import { useRef } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { diaperKind, formatDiaperKind } from "../diaper";
import { formatDateTime } from "../medicine";
import { colors, fonts } from "../theme";
import type { DiaperChange } from "../types";

type DiaperLogListProps = {
  diapers: DiaperChange[];
  emptyLabel?: string;
  onDelete?: (id: string) => void;
};

function DiaperLogRow({
  change,
  onDelete,
}: {
  change: DiaperChange;
  onDelete?: (id: string) => void;
}) {
  const swipeRef = useRef<Swipeable>(null);
  const kindLabel = formatDiaperKind(diaperKind(change));

  const content = (
    <View style={styles.row}>
      <Text style={styles.rowTime}>{formatDateTime(change.changedAt)}</Text>
      <Text style={styles.rowKind}>{kindLabel}</Text>
    </View>
  );

  if (!onDelete) return content;

  return (
    <Swipeable
      ref={swipeRef}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
      renderRightActions={() => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${kindLabel} diaper from ${formatDateTime(change.changedAt)}`}
          style={styles.deleteAction}
          onPress={() => {
            swipeRef.current?.close();
            Alert.alert(
              "Delete diaper log?",
              `This removes the ${kindLabel.toLowerCase()} change from ${formatDateTime(change.changedAt)}.`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => onDelete(change.id),
                },
              ],
            );
          }}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      )}
    >
      {content}
    </Swipeable>
  );
}

export function DiaperLogList({
  diapers,
  emptyLabel = "No diaper changes logged yet.",
  onDelete,
}: DiaperLogListProps) {
  if (diapers.length === 0) {
    return <Text style={styles.empty}>{emptyLabel}</Text>;
  }

  return (
    <View>
      {diapers.map((change) => (
        <DiaperLogRow key={change.id} change={change} onDelete={onDelete} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowTime: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
  },
  rowKind: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.ink,
  },
  empty: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 15.2,
    color: colors.inkMuted,
  },
  deleteAction: {
    backgroundColor: colors.warn,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 1,
  },
  deleteText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.white,
  },
});
