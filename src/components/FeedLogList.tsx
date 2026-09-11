import { useRef } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { formatDuration, sideTotals } from "../feed";
import { formatDateTime } from "../medicine";
import { colors, fonts } from "../theme";
import type { FeedSession } from "../types";

type FeedLogListProps = {
  feeds: FeedSession[];
  emptyLabel?: string;
  onDelete?: (id: string) => void;
};

function sideSummary(session: FeedSession): string {
  const { leftMs, rightMs } = sideTotals(session);
  const parts: string[] = [];
  if (leftMs > 0) parts.push(`Left ${formatDuration(leftMs)}`);
  if (rightMs > 0) parts.push(`Right ${formatDuration(rightMs)}`);
  if (parts.length === 0) return "No side time logged";
  return parts.join(" · ");
}

function FeedLogRow({
  feed,
  onDelete,
}: {
  feed: FeedSession;
  onDelete?: (id: string) => void;
}) {
  const swipeRef = useRef<Swipeable>(null);

  const content = (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.muted}>{formatDateTime(feed.endedAt)}</Text>
        <Text style={styles.sides}>{sideSummary(feed)}</Text>
      </View>
      <Text style={styles.duration}>{formatDuration(feed.durationMs)}</Text>
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
          accessibilityLabel={`Delete feed from ${formatDateTime(feed.endedAt)}`}
          style={styles.deleteAction}
          onPress={() => {
            swipeRef.current?.close();
            Alert.alert(
              "Delete feed?",
              `This removes the feed from ${formatDateTime(feed.endedAt)}.`,
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

export function FeedLogList({
  feeds,
  emptyLabel = "No feeds logged yet.",
  onDelete,
}: FeedLogListProps) {
  if (feeds.length === 0) {
    return <Text style={styles.empty}>{emptyLabel}</Text>;
  }

  return (
    <View>
      {feeds.map((feed) => (
        <FeedLogRow key={feed.id} feed={feed} onDelete={onDelete} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  left: {
    flexShrink: 1,
    flex: 1,
    gap: 2,
  },
  muted: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
  },
  sides: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14.5,
    color: colors.ink,
  },
  duration: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.ink,
    marginTop: 1,
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
