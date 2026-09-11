import { useRef } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { formatOunces } from "../bottle";
import { formatDateTime } from "../medicine";
import { colors, fonts } from "../theme";
import type { BottleFeed } from "../types";

type BottleLogListProps = {
  feeds: BottleFeed[];
  emptyLabel?: string;
  onDelete?: (id: string) => void;
};

function BottleLogRow({
  feed,
  onDelete,
}: {
  feed: BottleFeed;
  onDelete?: (id: string) => void;
}) {
  const swipeRef = useRef<Swipeable>(null);
  const ouncesLabel = formatOunces(feed.ounces);

  const content = (
    <View style={styles.row}>
      <Text style={styles.rowTime}>{formatDateTime(feed.startedAt)}</Text>
      <Text style={styles.rowAmount}>{ouncesLabel}</Text>
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
          accessibilityLabel={`Delete ${ouncesLabel} bottle feed from ${formatDateTime(feed.startedAt)}`}
          style={styles.deleteAction}
          onPress={() => {
            swipeRef.current?.close();
            Alert.alert(
              "Delete bottle log?",
              `This removes the ${ouncesLabel} feed from ${formatDateTime(feed.startedAt)}.`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => onDelete(feed.id),
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

export function BottleLogList({
  feeds,
  emptyLabel = "No bottle feeds logged yet.",
  onDelete,
}: BottleLogListProps) {
  if (feeds.length === 0) {
    return <Text style={styles.empty}>{emptyLabel}</Text>;
  }

  return (
    <View>
      {feeds.map((feed) => (
        <BottleLogRow key={feed.id} feed={feed} onDelete={onDelete} />
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
  rowAmount: {
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
