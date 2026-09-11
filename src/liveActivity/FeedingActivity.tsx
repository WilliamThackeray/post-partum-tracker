import { HStack, Image, Text, VStack } from "@expo/ui/swift-ui";
import {
  font,
  foregroundStyle,
  frame,
  monospacedDigit,
  padding,
} from "@expo/ui/swift-ui/modifiers";
import {
  createLiveActivity,
  type LiveActivityEnvironment,
} from "expo-widgets";
import type { BreastSide } from "../types";

/** Max count-up window for the system timer (12h). */
const TIMER_UPPER_MS = 12 * 60 * 60 * 1000;
const TIMER_WIDTH = 52;

export type FeedingActivityProps = {
  kidId: string;
  kidName: string;
  side: BreastSide | null;
  segmentStartedAt: string | null;
  sessionStartedAt: string;
  leftTotalMs: number;
  rightTotalMs: number;
};

function FeedingActivityLayout(
  props: FeedingActivityProps,
  environment: LiveActivityEnvironment,
) {
  "widget";

  const accent = environment.colorScheme === "dark" ? "#d5ebe3" : "#2f6f5e";
  const ink = environment.colorScheme === "dark" ? "#f2f7f4" : "#14241f";
  const muted = environment.colorScheme === "dark" ? "#a8c4b8" : "#4a635a";

  const sideLetter =
    props.side === "left" ? "L" : props.side === "right" ? "R" : "·";
  const sideTitle =
    props.side === "left"
      ? "Left"
      : props.side === "right"
        ? "Right"
        : "Ready";

  const formatMs = (ms: number) => {
    const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const renderTimer = () => {
    if (!props.segmentStartedAt) {
      return (
        <Text
          modifiers={[
            font({ weight: "semibold", size: 16 }),
            monospacedDigit(),
            foregroundStyle(ink),
            frame({ width: TIMER_WIDTH, alignment: "trailing" }),
          ]}
        >
          00:00
        </Text>
      );
    }

    const lower = new Date(props.segmentStartedAt);
    const upper = new Date(lower.getTime() + TIMER_UPPER_MS);
    return (
      <Text
        timerInterval={{ lower, upper }}
        countsDown={false}
        modifiers={[
          font({ weight: "semibold", size: 16 }),
          monospacedDigit(),
          foregroundStyle(ink),
          frame({ width: TIMER_WIDTH, alignment: "trailing" }),
        ]}
      />
    );
  };

  return {
    banner: (
      <VStack
        alignment="leading"
        spacing={4}
        modifiers={[padding({ all: 12 })]}
      >
        <Text
          modifiers={[
            font({ weight: "bold", size: 15 }),
            foregroundStyle(accent),
          ]}
        >
          {`Feeding ${props.kidName}`}
        </Text>
        <HStack spacing={8}>
          <Text
            modifiers={[
              font({ weight: "semibold", size: 20 }),
              foregroundStyle(ink),
            ]}
          >
            {sideLetter}
          </Text>
          <Text modifiers={[font({ size: 14 }), foregroundStyle(muted)]}>
            {sideTitle}
          </Text>
          {renderTimer()}
        </HStack>
        <Text modifiers={[font({ size: 12 }), foregroundStyle(muted)]}>
          {`L ${formatMs(props.leftTotalMs)}  ·  R ${formatMs(props.rightTotalMs)}`}
        </Text>
      </VStack>
    ),
    compactLeading: (
      <Text
        modifiers={[
          font({ weight: "bold", size: 14 }),
          foregroundStyle(accent),
        ]}
      >
        {sideLetter}
      </Text>
    ),
    compactTrailing: renderTimer(),
    minimal: (
      <Image systemName="drop.fill" color={accent} size={12} />
    ),
    expandedLeading: (
      <VStack
        alignment="center"
        spacing={2}
        modifiers={[padding({ all: 8 })]}
      >
        <Image systemName="drop.fill" color={accent} size={18} />
        <Text modifiers={[font({ size: 11 }), foregroundStyle(muted)]}>
          Feed
        </Text>
      </VStack>
    ),
    expandedTrailing: (
      <VStack
        alignment="trailing"
        spacing={2}
        modifiers={[padding({ all: 8 })]}
      >
        {renderTimer()}
        <Text modifiers={[font({ size: 11 }), foregroundStyle(muted)]}>
          {sideTitle}
        </Text>
      </VStack>
    ),
    expandedBottom: (
      <VStack
        alignment="leading"
        spacing={2}
        modifiers={[padding({ horizontal: 12, bottom: 10 })]}
      >
        <Text
          modifiers={[
            font({ weight: "semibold", size: 14 }),
            foregroundStyle(ink),
          ]}
        >
          {props.kidName}
        </Text>
        <Text modifiers={[font({ size: 12 }), foregroundStyle(muted)]}>
          {`L ${formatMs(props.leftTotalMs)}  ·  R ${formatMs(props.rightTotalMs)}`}
        </Text>
      </VStack>
    ),
  };
}

export default createLiveActivity("FeedingActivity", FeedingActivityLayout);
