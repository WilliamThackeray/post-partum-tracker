import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  isFeedOverdue,
  lastFeedStartedAt,
  nextFeedAt,
} from "../feed";
import { formatTime } from "../medicine";
import { colors, fonts, radius } from "../theme";
import { panelShadow } from "../shadow";
import type { AppState, BreastSide } from "../types";
import { FeedLogList } from "./FeedLogList";

/** How many recent feeds to show on the home card before "See more". */
export const FEED_PREVIEW_LIMIT = 5;

type FeedPanelProps = {
  state: AppState;
  timerLabel: string;
  onToggleSession: () => void;
  onToggleSide: (side: BreastSide) => void;
  onDeleteFeed: (id: string) => void;
  onSeeMoreFeeds: () => void;
};

export function FeedPanel({
  state,
  timerLabel,
  onToggleSession,
  onToggleSide,
  onDeleteFeed,
  onSeeMoreFeeds,
}: FeedPanelProps) {
  const sessionActive = Boolean(state.activeSession);
  const activeSide = state.activeSession?.activeSegment?.side ?? null;
  const last = lastFeedStartedAt(state);
  const next = nextFeedAt(state);
  const overdue = isFeedOverdue(state);
  const nextLabel = next
    ? overdue
      ? `${formatTime(next.toISOString())} · due now`
      : formatTime(next.toISOString())
    : "—";

  const previewFeeds = state.feeds.slice(0, FEED_PREVIEW_LIMIT);
  const hasMoreFeeds = state.feeds.length > FEED_PREVIEW_LIMIT;

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
            sessionActive ? styles.btnEnd : styles.btnStart,
            pressed && styles.pressed,
          ]}
          onPress={onToggleSession}
        >
          <Text style={styles.btnText}>
            {sessionActive ? "Stop Feed" : "Start Feed"}
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.timer, !activeSide && styles.timerIdle]}>
        {timerLabel}
      </Text>

      <View style={styles.actions}>
        {(["left", "right"] as const).map((side) => {
          const isActive = activeSide === side;
          const label = isActive
            ? side === "left"
              ? "End Left Side"
              : "End Right Side"
            : side === "left"
              ? "Start Left Side"
              : "Start Right Side";

          return (
            <Pressable
              key={side}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.btn,
                styles.actionBtn,
                isActive ? styles.btnEnd : styles.btnStart,
                !sessionActive && styles.btnDisabled,
                pressed && sessionActive && styles.pressed,
              ]}
              onPress={() => onToggleSide(side)}
              disabled={!sessionActive}
            >
              <Text style={styles.sideBtnText}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {!sessionActive ? (
        <Text style={styles.hint}>Start a feed to time each side.</Text>
      ) : null}

      <View style={styles.history}>
        <FeedLogList feeds={previewFeeds} onDelete={onDeleteFeed} />
        {hasMoreFeeds ? (
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.seeMoreBtn,
              pressed && styles.pressed,
            ]}
            onPress={onSeeMoreFeeds}
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
  timer: {
    textAlign: "center",
    fontFamily: fonts.display,
    fontSize: 48,
    letterSpacing: -1.5,
    lineHeight: 52,
    marginBottom: 12,
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
    paddingHorizontal: 8,
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
  sideBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14.5,
    color: colors.white,
    textAlign: "center",
  },
  hint: {
    marginTop: 10,
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: colors.inkMuted,
    textAlign: "center",
  },
  history: {
    marginTop: 18.4,
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
