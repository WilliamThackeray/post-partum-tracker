import { useEffect, useMemo, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, fonts, radius } from "../theme";

const ITEM_HEIGHT = 40;
const VISIBLE_ROWS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;

function indexFromOffset(offsetY: number, length: number): number {
  return Math.min(length - 1, Math.max(0, Math.round(offsetY / ITEM_HEIGHT)));
}

type WheelScrollerProps<T extends string | number> = {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
  formatOption?: (value: T) => string;
};

export function WheelScroller<T extends string | number>({
  options,
  value,
  onChange,
  accessibilityLabel,
  formatOption = (option) => String(option),
}: WheelScrollerProps<T>) {
  const scrollRef = useRef<ScrollView>(null);
  const valueIndex = useMemo(() => {
    const index = options.indexOf(value);
    return index >= 0 ? index : 0;
  }, [options, value]);
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
    const index = indexFromOffset(offsetY, options.length);
    const next = options[index];
    if (next === undefined) return;
    setActiveIndex(index);
    if (next !== value) onChange(next);
    scrollRef.current?.scrollTo({
      y: index * ITEM_HEIGHT,
      animated: true,
    });
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveIndex(indexFromOffset(event.nativeEvent.contentOffset.y, options.length));
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

  const activeValue = options[activeIndex] ?? value;

  return (
    <View
      style={styles.wrap}
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: formatOption(activeValue) }}
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
        {options.map((option, index) => {
          const selected = index === activeIndex;
          return (
            <View key={String(option)} style={styles.item}>
              <Text style={[styles.itemText, selected && styles.itemSelected]}>
                {formatOption(option)}
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
    fontSize: 22,
    color: colors.inkMuted,
    opacity: 0.55,
    fontVariant: ["tabular-nums"],
  },
  itemSelected: {
    fontFamily: fonts.bodySemiBold,
    color: colors.ink,
    opacity: 1,
  },
});
