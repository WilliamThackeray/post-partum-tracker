import { useEffect, useMemo, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  DEFAULT_MEDICINE_INTERVAL_HOURS,
  MAX_MEDICINE_INTERVAL_HOURS,
  MIN_MEDICINE_INTERVAL_HOURS,
} from "../medicine";
import { colors, fonts, radius } from "../theme";

const ITEM_HEIGHT = 40;
const VISIBLE_ROWS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;

function buildHourOptions(): number[] {
  const options: number[] = [];
  for (
    let hours = MIN_MEDICINE_INTERVAL_HOURS;
    hours <= MAX_MEDICINE_INTERVAL_HOURS + 1e-9;
    hours += 0.5
  ) {
    options.push(Number(hours.toFixed(1)));
  }
  return options;
}

const HOUR_OPTIONS = buildHourOptions();

function nearestOptionIndex(hours: number): number {
  let best = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < HOUR_OPTIONS.length; i += 1) {
    const dist = Math.abs(HOUR_OPTIONS[i]! - hours);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

function indexFromOffset(offsetY: number): number {
  return Math.min(
    HOUR_OPTIONS.length - 1,
    Math.max(0, Math.round(offsetY / ITEM_HEIGHT)),
  );
}

function formatOption(hours: number): string {
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

type HourWheelScrollerProps = {
  value: number;
  onChange: (hours: number) => void;
};

export function HourWheelScroller({ value, onChange }: HourWheelScrollerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const valueIndex = useMemo(() => nearestOptionIndex(value), [value]);
  const [activeIndex, setActiveIndex] = useState(valueIndex);
  const pad = Math.floor(VISIBLE_ROWS / 2);
  const isDragging = useRef(false);

  useEffect(() => {
    if (isDragging.current) return;
    setActiveIndex(valueIndex);
    const id = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: valueIndex * ITEM_HEIGHT,
        animated: false,
      });
    });
    return () => cancelAnimationFrame(id);
  }, [valueIndex]);

  const commitOffset = (offsetY: number) => {
    const index = indexFromOffset(offsetY);
    const next = HOUR_OPTIONS[index] ?? DEFAULT_MEDICINE_INTERVAL_HOURS;
    setActiveIndex(index);
    if (next !== value) onChange(next);
    scrollRef.current?.scrollTo({
      y: index * ITEM_HEIGHT,
      animated: true,
    });
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveIndex(indexFromOffset(event.nativeEvent.contentOffset.y));
  };

  const onScrollBeginDrag = () => {
    isDragging.current = true;
  };

  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    isDragging.current = false;
    commitOffset(event.nativeEvent.contentOffset.y);
  };

  const onScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Web often won't fire momentum end; snap on drag end too.
    isDragging.current = false;
    commitOffset(event.nativeEvent.contentOffset.y);
  };

  return (
    <View
      style={styles.wrap}
      accessibilityRole="adjustable"
      accessibilityLabel="Hours between doses"
      accessibilityValue={{
        text: formatOption(HOUR_OPTIONS[activeIndex] ?? value),
      }}
    >
      <View pointerEvents="none" style={styles.selection} />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="center"
        decelerationRate="fast"
        disableIntervalMomentum
        nestedScrollEnabled
        scrollEventThrottle={16}
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onMomentumScrollEnd={onMomentumEnd}
        onScrollEndDrag={onScrollEndDrag}
        contentContainerStyle={{
          paddingVertical: pad * ITEM_HEIGHT,
        }}
      >
        {HOUR_OPTIONS.map((hours, index) => {
          const selected = index === activeIndex;
          return (
            <View key={hours} style={styles.item}>
              <Text style={[styles.itemText, selected && styles.itemSelected]}>
                {formatOption(hours)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: PICKER_HEIGHT,
    borderRadius: radius.control,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    overflow: "hidden",
  },
  selection: {
    position: "absolute",
    left: 8,
    right: 8,
    top: ITEM_HEIGHT * Math.floor(VISIBLE_ROWS / 2),
    height: ITEM_HEIGHT,
    borderRadius: radius.soft,
    backgroundColor: colors.accentSoft,
    zIndex: 0,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  itemText: {
    fontFamily: fonts.body,
    fontSize: 17,
    color: colors.inkMuted,
    opacity: 0.55,
  },
  itemSelected: {
    fontFamily: fonts.bodySemiBold,
    color: colors.ink,
    opacity: 1,
  },
});
