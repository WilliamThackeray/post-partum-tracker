import { MAX_FEEDS } from "./storage";
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
    id: crypto.randomUUID(),
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

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function elapsedMs(startedAt: string, now = Date.now()): number {
  return Math.max(0, now - new Date(startedAt).getTime());
}
