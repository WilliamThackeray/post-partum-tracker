import { createId } from "./id";
import {
  MAX_FEED_INTERVAL_HOURS,
  MAX_FEEDS,
  MIN_FEED_INTERVAL_HOURS,
} from "./storage";
import type {
  ActiveSession,
  AppState,
  BreastSide,
  FeedSegment,
  FeedSession,
} from "./types";

function closeActiveSegment(
  session: ActiveSession,
  endedAt = new Date(),
): ActiveSession {
  if (!session.activeSegment) return session;

  const startedAt = new Date(session.activeSegment.startedAt);
  const durationMs = Math.max(0, endedAt.getTime() - startedAt.getTime());
  const segment: FeedSegment = {
    side: session.activeSegment.side,
    startedAt: session.activeSegment.startedAt,
    endedAt: endedAt.toISOString(),
    durationMs,
  };

  return {
    ...session,
    segments: [...session.segments, segment],
    activeSegment: null,
  };
}

function sessionDurationMs(segments: FeedSegment[]): number {
  return segments.reduce((sum, segment) => sum + segment.durationMs, 0);
}

/** Begin a feeding session and stamp the next-feed schedule. */
export function startSession(state: AppState): AppState {
  if (state.activeSession) return state;
  const startedAt = new Date().toISOString();
  return {
    ...state,
    scheduleStartedAt: startedAt,
    activeSession: {
      startedAt,
      segments: [],
      activeSegment: null,
    },
  };
}

/** End the session, finalize any open side, and log the total. */
export function stopSession(state: AppState): AppState {
  if (!state.activeSession) return state;

  const endedAt = new Date();
  const closed = closeActiveSegment(state.activeSession, endedAt);
  const lastSegment = closed.segments[closed.segments.length - 1];
  const entry: FeedSession = {
    id: createId("feed"),
    startedAt: closed.startedAt,
    endedAt: endedAt.toISOString(),
    durationMs: sessionDurationMs(closed.segments),
    segments: closed.segments,
  };

  return {
    ...state,
    lastBreast: lastSegment?.side ?? state.lastBreast,
    activeSession: null,
    feeds: [entry, ...state.feeds].slice(0, MAX_FEEDS),
  };
}

/** Start timing a side. Ends the other side first if it was running. */
export function startSide(state: AppState, side: BreastSide): AppState {
  if (!state.activeSession) return state;

  let session = state.activeSession;
  if (session.activeSegment?.side === side) return state;

  if (session.activeSegment) {
    session = closeActiveSegment(session);
  }

  return {
    ...state,
    activeSession: {
      ...session,
      activeSegment: {
        side,
        startedAt: new Date().toISOString(),
      },
    },
  };
}

/** Stop timing the active side without ending the session. */
export function endSide(state: AppState): AppState {
  if (!state.activeSession?.activeSegment) return state;
  return {
    ...state,
    lastBreast: state.activeSession.activeSegment.side,
    activeSession: closeActiveSegment(state.activeSession),
  };
}

/** Remove a logged feed and refresh next-feed schedule from remaining history. */
export function deleteFeed(state: AppState, id: string): AppState {
  const feeds = state.feeds.filter((feed) => feed.id !== id);
  if (feeds.length === state.feeds.length) return state;

  // Keep active session schedule; otherwise base next feed on newest remaining log.
  const scheduleStartedAt = state.activeSession
    ? state.scheduleStartedAt
    : (feeds[0]?.startedAt ?? null);

  return {
    ...state,
    feeds,
    scheduleStartedAt,
    lastBreast:
      feeds.length === 0
        ? null
        : (feeds[0]?.segments[feeds[0].segments.length - 1]?.side ??
          state.lastBreast),
  };
}

export function setFeedIntervalHours(state: AppState, hours: number): AppState {
  const clamped = Math.min(
    MAX_FEED_INTERVAL_HOURS,
    Math.max(MIN_FEED_INTERVAL_HOURS, hours),
  );
  return { ...state, feedIntervalHours: clamped };
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

export function sideTotals(session: FeedSession): {
  leftMs: number;
  rightMs: number;
} {
  let leftMs = 0;
  let rightMs = 0;
  for (const segment of session.segments) {
    if (segment.side === "left") leftMs += segment.durationMs;
    else rightMs += segment.durationMs;
  }
  return { leftMs, rightMs };
}
