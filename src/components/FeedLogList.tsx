import { StyleSheet, Text, View } from "react-native";
import { formatDuration } from "../feed";
import { formatDateTime } from "../medicine";
import { colors, fonts } from "../theme";
import type { FeedEntry } from "../types";

type FeedLogListProps = {
  feeds: FeedEntry[];
  emptyLabel?: string;
};

export function FeedLogList({
  feeds,
  emptyLabel = "No feeds logged yet.",
}: FeedLogListProps) {
  if (feeds.length === 0) {
    return <Text style={styles.empty}>{emptyLabel}</Text>;
  }

  return (
    <View>
      {feeds.map((feed) => (
        <View key={feed.id} style={styles.row}>
          <Text style={styles.left}>
            <Text style={styles.side}>{feed.side}</Text>
            <Text style={styles.muted}> · {formatDateTime(feed.endedAt)}</Text>
          </Text>
          <Text style={styles.duration}>{formatDuration(feed.durationMs)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 12,
    paddingVertical: 8.8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  left: {
    flexShrink: 1,
  },
  side: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15.2,
    color: colors.ink,
    textTransform: "capitalize",
  },
  muted: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
  },
  duration: {
    fontFamily: fonts.body,
    fontSize: 15.2,
    color: colors.ink,
  },
  empty: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 15.2,
    color: colors.inkMuted,
  },
});
