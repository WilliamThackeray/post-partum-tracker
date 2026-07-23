import { createId } from "./id";
import {
  MAX_FEED_INTERVAL_HOURS,
  MAX_FEEDS,
  MIN_FEED_INTERVAL_HOURS,
} from "./storage";
import type { AppState, BreastSide, FeedEntry } from "./types";

export function setFeedSide(state: AppState, side: BreastSide): AppState {
  if (state.activeFeed) {
    return {
      ...state,
      activeFeed: { ...state.activeFeed, side },
    };
  }
  return state;
}

export function startFeed(state: AppState, side: BreastSide): AppState {
  if (state.activeFeed) return state;
  return {
    ...state,
    activeFeed: {
      side,
      startedAt: new Date().toISOString(),
    },
  };
}

export function endFeed(state: AppState): AppState {
  if (!state.activeFeed) return state;

  const endedAt = new Date();
  const startedAt = new Date(state.activeFeed.startedAt);
  const durationMs = Math.max(0, endedAt.getTime() - startedAt.getTime());

  const entry: FeedEntry = {
    id: createId("feed"),
    side: state.activeFeed.side,
    startedAt: state.activeFeed.startedAt,
    endedAt: endedAt.toISOString(),
    durationMs,
  };

  return {
    ...state,
    lastBreast: entry.side,
    activeFeed: null,
    feeds: [entry, ...state.feeds].slice(0, MAX_FEEDS),
  };
}

export function setFeedIntervalHours(state: AppState, hours: number): AppState {
  const clamped = Math.min(
    MAX_FEED_INTERVAL_HOURS,
    Math.max(MIN_FEED_INTERVAL_HOURS, hours),
  );
  return { ...state, feedIntervalHours: clamped };
}

/** Stamp last/next feed schedule only — does not start the timer. */
export function markScheduleStart(state: AppState): AppState {
  return {
    ...state,
    scheduleStartedAt: new Date().toISOString(),
  };
}

export function lastFeedStartedAt(state: AppState): string | null {
  return state.scheduleStartedAt;
}

export function nextFeedAt(state: AppState): Date | null {
  const last = lastFeedStartedAt(state);
  if (!last) return null;
  return new Date(
    new Date(last).getTime() + state.feedIntervalHours * 60 * 60 * 1000,
  );
}

export function isFeedOverdue(state: AppState, now = Date.now()): boolean {
  const next = nextFeedAt(state);
  if (!next) return false;
  return next.getTime() <= now;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function elapsedMs(startedAt: string, now = Date.now()): number {
  return Math.max(0, now - new Date(startedAt).getTime());
}
