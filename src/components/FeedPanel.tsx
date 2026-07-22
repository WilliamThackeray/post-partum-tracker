import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  formatDuration,
  isFeedOverdue,
  lastFeedStartedAt,
  nextFeedAt,
} from "../feed";
import { formatDateTime, formatTime } from "../medicine";
import { colors, fonts, radius } from "../theme";
import { panelShadow } from "../shadow";
import type { AppState, BreastSide, FeedEntry } from "../types";

type FeedPanelProps = {
  state: AppState;
  selectedSide: BreastSide;
  timerLabel: string;
  onSelectSide: (side: BreastSide) => void;
  onMarkSchedule: () => void;
  onStartTimer: () => void;
  onEndTimer: () => void;
};

function FeedHistory({ feeds }: { feeds: FeedEntry[] }) {
  if (feeds.length === 0) {
    return <Text style={styles.emptyHistory}>No feeds logged yet.</Text>;
  }

  return (
    <ScrollView
      style={styles.history}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
    >
      {feeds.map((feed) => (
        <View key={feed.id} style={styles.historyRow}>
          <Text style={styles.historyLeft}>
            <Text style={styles.historySide}>{feed.side}</Text>
            <Text style={styles.historyMuted}>
              {" "}
              · {formatDateTime(feed.endedAt)}
            </Text>
          </Text>
          <Text style={styles.historyDuration}>
            {formatDuration(feed.durationMs)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

export function FeedPanel({
  state,
  selectedSide,
  timerLabel,
  onSelectSide,
  onMarkSchedule,
  onStartTimer,
  onEndTimer,
}: FeedPanelProps) {
  const feeding = Boolean(state.activeFeed);
  const last = lastFeedStartedAt(state);
  const next = nextFeedAt(state);
  const overdue = isFeedOverdue(state);
  const nextLabel = next
    ? overdue
      ? `${formatTime(next.toISOString())} · due now`
      : formatTime(next.toISOString())
    : "—";

  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>Feeding</Text>

      <View style={styles.metaBlock}>
        <View style={styles.meta}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Last feed</Text>
            <Text style={styles.metaValue}>
              {last ? formatTime(last) : "—"}
            </Text>
          </View>
          <View style={[styles.metaCol, styles.metaColRight]}>
            <Text style={styles.metaLabel}>Next feed</Text>
            <Text
              style={[
                styles.metaValue,
                overdue ? styles.dueValue : next ? styles.okValue : null,
              ]}
            >
              {nextLabel}
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.btn,
            styles.btnStart,
            pressed && styles.pressed,
          ]}
          onPress={onMarkSchedule}
        >
          <Text style={styles.btnText}>Start Feed</Text>
        </Pressable>
      </View>

      <View style={styles.sideToggle}>
        {(["left", "right"] as const).map((side) => {
          const selected = selectedSide === side;
          return (
            <Pressable
              key={side}
              style={[styles.sideBtn, selected && styles.sideBtnSelected]}
              onPress={() => onSelectSide(side)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text
                style={[
                  styles.sideBtnText,
                  selected && styles.sideBtnTextSelected,
                ]}
              >
                {side === "left" ? "Left" : "Right"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.timer, !feeding && styles.timerIdle]}>
        {timerLabel}
      </Text>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.btn,
            styles.btnStart,
            styles.actionBtn,
            feeding && styles.btnDisabled,
            pressed && !feeding && styles.pressed,
          ]}
          onPress={onStartTimer}
          disabled={feeding}
        >
          <Text style={styles.btnText}>Start</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.btn,
            styles.btnEnd,
            styles.actionBtn,
            !feeding && styles.btnDisabled,
            pressed && feeding && styles.pressed,
          ]}
          onPress={onEndTimer}
          disabled={!feeding}
        >
          <Text style={styles.btnText}>End</Text>
        </Pressable>
      </View>

      <FeedHistory feeds={state.feeds} />
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
  metaBlock: {
    marginBottom: 16,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10.4,
    paddingHorizontal: 13.6,
    paddingVertical: 12,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.soft,
  },
  metaCol: {
    flex: 1,
  },
  metaColRight: {
    alignItems: "flex-end",
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
  dueValue: {
    color: colors.warn,
  },
  okValue: {
    color: colors.ok,
  },
  sideToggle: {
    flexDirection: "row",
    gap: 9.6,
    marginBottom: 14.4,
  },
  sideBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.control,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  sideBtnSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  sideBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16.8,
    color: colors.inkMuted,
  },
  sideBtnTextSelected: {
    color: colors.white,
  },
  timer: {
    textAlign: "center",
    fontFamily: fonts.display,
    fontSize: 48,
    letterSpacing: -1.5,
    lineHeight: 52,
    marginVertical: 8,
    color: colors.ink,
    fontVariant: ["tabular-nums"],
  },
  timerIdle: {
    color: colors.inkMuted,
    opacity: 0.55,
  },
  actions: {
    flexDirection: "row",
    gap: 10.4,
  },
  actionBtn: {
    flex: 1,
  },
  btn: {
    minHeight: 56,
    borderRadius: radius.control,
    alignItems: "center",
    justifyContent: "center",
  },
  btnStart: {
    backgroundColor: colors.accent,
  },
  btnEnd: {
    backgroundColor: colors.ink,
  },
  btnDisabled: {
    opacity: 0.38,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  btnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 17.6,
    color: colors.white,
  },
  history: {
    marginTop: 18.4,
    maxHeight: 280,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 12,
    paddingVertical: 8.8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  historyLeft: {
    flexShrink: 1,
  },
  historySide: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15.2,
    color: colors.ink,
    textTransform: "capitalize",
  },
  historyMuted: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
  },
  historyDuration: {
    fontFamily: fonts.body,
    fontSize: 15.2,
    color: colors.ink,
  },
  emptyHistory: {
    marginTop: 13.6,
    fontFamily: fonts.body,
    fontSize: 15.2,
    color: colors.inkMuted,
  },
});
