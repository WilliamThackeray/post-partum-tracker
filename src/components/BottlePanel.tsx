import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  combineOunces,
  formatOunces,
  MAX_BOTTLE_OUNCES,
  OUNCE_FRACTIONS,
  type OunceFraction,
} from "../bottle";
import { isFeedOverdue, nextFeedAt } from "../feed";
import { formatTime } from "../medicine";
import { panelShadow } from "../shadow";
import { colors, fonts, radius } from "../theme";
import type { KidState } from "../types";
import { BottleLogList } from "./BottleLogList";
import { WheelScroller } from "./WheelScroller";

/** How many recent bottle feeds to show on the home card before "See more". */
export const BOTTLE_PREVIEW_LIMIT = 5;

const DEFAULT_WHOLE = 4;
const DEFAULT_FRACTION: OunceFraction = 0;

const WHOLE_OPTIONS = Array.from(
  { length: MAX_BOTTLE_OUNCES + 1 },
  (_, i) => i,
);

function formatFraction(fraction: OunceFraction): string {
  if (fraction === 0) return ".00";
  if (fraction === 0.5) return ".50";
  return `.${String(fraction).split(".")[1]}`;
}

type BottlePanelProps = {
  state: KidState;
  onStart: () => void;
  onEnd: (ounces: number) => void;
  onDeleteFeed: (id: string) => void;
  onSeeMoreFeeds: () => void;
};

export function BottlePanel({
  state,
  onStart,
  onEnd,
  onDeleteFeed,
  onSeeMoreFeeds,
}: BottlePanelProps) {
  const sessionActive = Boolean(state.activeBottleSession);
  const [whole, setWhole] = useState(DEFAULT_WHOLE);
  const [fraction, setFraction] = useState<OunceFraction>(DEFAULT_FRACTION);

  useEffect(() => {
    if (sessionActive) {
      setWhole(DEFAULT_WHOLE);
      setFraction(DEFAULT_FRACTION);
    }
  }, [sessionActive, state.activeBottleSession?.startedAt]);

  const fractionOptions = useMemo(() => {
    if (whole >= MAX_BOTTLE_OUNCES) return [0] as const;
    return OUNCE_FRACTIONS;
  }, [whole]);

  const ounces = combineOunces(whole, fraction);
  const canEnd = ounces >= 0.25;
  const next = nextFeedAt(state);
  const overdue = isFeedOverdue(state);
  const nextLabel = next
    ? overdue
      ? `${formatTime(next.toISOString())} · due now`
      : formatTime(next.toISOString())
    : "—";

  const last = state.bottleFeeds[0] ?? null;
  const previewFeeds = state.bottleFeeds.slice(0, BOTTLE_PREVIEW_LIMIT);
  const hasMoreFeeds = state.bottleFeeds.length > BOTTLE_PREVIEW_LIMIT;

  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>Bottle</Text>

      <View style={styles.metaBlock}>
        <View style={styles.meta}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Last bottle</Text>
            <Text style={styles.metaValue}>
              {last
                ? `${formatTime(last.startedAt)} · ${formatOunces(last.ounces)}`
                : "—"}
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

        {!sessionActive ? (
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.btn,
              styles.btnStart,
              pressed && styles.pressed,
            ]}
            onPress={onStart}
          >
            <Text style={styles.btnText}>Start Bottle Feed</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canEnd }}
            style={({ pressed }) => [
              styles.btn,
              styles.btnEnd,
              !canEnd && styles.btnDisabled,
              pressed && canEnd && styles.pressed,
            ]}
            onPress={() => onEnd(ounces)}
            disabled={!canEnd}
          >
            <Text style={styles.btnText}>
              End Feed · {formatOunces(ounces)}
            </Text>
          </Pressable>
        )}
      </View>

      {sessionActive ? (
        <View style={styles.ounceBlock}>
          <Text style={styles.ounceHeading}>Ounces eaten</Text>
          <View style={styles.wheels}>
            <View style={styles.wheelCol}>
              <WheelScroller
                options={WHOLE_OPTIONS}
                value={whole}
                onChange={(nextWhole) => {
                  setWhole(nextWhole);
                  if (nextWhole >= MAX_BOTTLE_OUNCES) setFraction(0);
                }}
                accessibilityLabel="Whole ounces"
              />
            </View>
            <View style={styles.wheelCol}>
              <WheelScroller
                options={fractionOptions}
                value={fraction}
                onChange={setFraction}
                accessibilityLabel="Fractional ounces"
                formatOption={formatFraction}
              />
            </View>
          </View>
        </View>
      ) : (
        <Text style={styles.hint}>
          Start a bottle feed, then enter ounces when it ends.
        </Text>
      )}

      <View style={styles.history}>
        <BottleLogList feeds={previewFeeds} onDelete={onDeleteFeed} />
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
  ounceBlock: {
    marginBottom: 4,
  },
  ounceHeading: {
    marginBottom: 10,
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.ink,
    textAlign: "center",
  },
  wheels: {
    flexDirection: "row",
    gap: 10.4,
  },
  wheelCol: {
    flex: 1,
  },
  wheelLabel: {
    marginBottom: 8,
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: colors.accentDeep,
    textAlign: "center",
  },
  hint: {
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
