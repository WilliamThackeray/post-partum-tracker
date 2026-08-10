import { scheduleAfterHistoryChange } from "./bottle";
import { createId } from "./id";
import {
  MAX_FEED_INTERVAL_HOURS,
  MAX_FEEDS,
  MIN_FEED_INTERVAL_HOURS,
} from "./storage";
import type {
  ActiveSession,
  BreastSide,
  FeedSegment,
  FeedSession,
  KidState,
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
export function startSession(kid: KidState): KidState {
  if (kid.activeSession) return kid;
  const startedAt = new Date().toISOString();
  return {
    ...kid,
    scheduleStartedAt: startedAt,
    activeSession: {
      startedAt,
      segments: [],
      activeSegment: null,
    },
  };
}

/** End the session, finalize any open side, and log the total. */
export function stopSession(kid: KidState): KidState {
  if (!kid.activeSession) return kid;

  const endedAt = new Date();
  const closed = closeActiveSegment(kid.activeSession, endedAt);
  const lastSegment = closed.segments[closed.segments.length - 1];
  const entry: FeedSession = {
    id: createId("feed"),
    startedAt: closed.startedAt,
    endedAt: endedAt.toISOString(),
    durationMs: sessionDurationMs(closed.segments),
    segments: closed.segments,
  };

  return {
    ...kid,
    lastBreast: lastSegment?.side ?? kid.lastBreast,
    activeSession: null,
    feeds: [entry, ...kid.feeds].slice(0, MAX_FEEDS),
  };
}

/** Start timing a side. Ends the other side first if it was running. */
export function startSide(kid: KidState, side: BreastSide): KidState {
  if (!kid.activeSession) return kid;

  let session = kid.activeSession;
  if (session.activeSegment?.side === side) return kid;

  if (session.activeSegment) {
    session = closeActiveSegment(session);
  }

  return {
    ...kid,
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
export function endSide(kid: KidState): KidState {
  if (!kid.activeSession?.activeSegment) return kid;
  return {
    ...kid,
    lastBreast: kid.activeSession.activeSegment.side,
    activeSession: closeActiveSegment(kid.activeSession),
  };
}

/** Remove a logged feed and refresh next-feed schedule from remaining history. */
export function deleteFeed(kid: KidState, id: string): KidState {
  const feeds = kid.feeds.filter((feed) => feed.id !== id);
  if (feeds.length === kid.feeds.length) return kid;

  const next = { ...kid, feeds };
  return {
    ...next,
    scheduleStartedAt: scheduleAfterHistoryChange(next),
    lastBreast:
      feeds.length === 0
        ? null
        : (feeds[0]?.segments[feeds[0].segments.length - 1]?.side ??
          kid.lastBreast),
  };
}

export function setFeedIntervalHours(kid: KidState, hours: number): KidState {
  const clamped = Math.min(
    MAX_FEED_INTERVAL_HOURS,
    Math.max(MIN_FEED_INTERVAL_HOURS, hours),
  );
  return { ...kid, feedIntervalHours: clamped };
}

export function lastFeedStartedAt(kid: KidState): string | null {
  return kid.scheduleStartedAt;
}

export function nextFeedAt(kid: KidState): Date | null {
  const last = lastFeedStartedAt(kid);
  if (!last) return null;
  return new Date(
    new Date(last).getTime() + kid.feedIntervalHours * 60 * 60 * 1000,
  );
}

export function isFeedOverdue(kid: KidState, now = Date.now()): boolean {
  const next = nextFeedAt(kid);
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
