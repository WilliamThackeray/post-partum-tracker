import { StyleSheet, Text, View } from "react-native";
import { formatDuration, sideTotals } from "../feed";
import { formatDateTime } from "../medicine";
import { colors, fonts } from "../theme";
import type { FeedSession } from "../types";

type FeedLogListProps = {
  feeds: FeedSession[];
  emptyLabel?: string;
};

function sideSummary(session: FeedSession): string {
  const { leftMs, rightMs } = sideTotals(session);
  const parts: string[] = [];
  if (leftMs > 0) parts.push(`Left ${formatDuration(leftMs)}`);
  if (rightMs > 0) parts.push(`Right ${formatDuration(rightMs)}`);
  if (parts.length === 0) return "No side time logged";
  return parts.join(" · ");
}

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
          <View style={styles.left}>
            <Text style={styles.muted}>{formatDateTime(feed.endedAt)}</Text>
            <Text style={styles.sides}>{sideSummary(feed)}</Text>
          </View>
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
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
});
