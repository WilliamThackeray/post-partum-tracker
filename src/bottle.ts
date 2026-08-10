import { createId } from "./id";
import { MAX_FEEDS } from "./storage";
import type { ActiveBottleSession, BottleFeed, KidState } from "./types";

export const MAX_BOTTLE_OUNCES = 12;
export const OUNCE_FRACTIONS = [0, 0.25, 0.5, 0.75] as const;

export type OunceFraction = (typeof OUNCE_FRACTIONS)[number];

/** Begin a bottle feed and stamp the shared next-feed schedule. */
export function startBottleSession(kid: KidState): KidState {
  if (kid.activeBottleSession) return kid;
  const startedAt = new Date().toISOString();
  return {
    ...kid,
    scheduleStartedAt: startedAt,
    activeBottleSession: { startedAt },
  };
}

/** End the bottle session and log ounces consumed. */
export function stopBottleSession(kid: KidState, ounces: number): KidState {
  if (!kid.activeBottleSession) return kid;

  const rounded = Math.round(ounces * 4) / 4;
  const clamped = Math.min(
    MAX_BOTTLE_OUNCES,
    Math.max(0.25, rounded),
  );
  const endedAt = new Date().toISOString();
  const entry: BottleFeed = {
    id: createId("bottle"),
    startedAt: kid.activeBottleSession.startedAt,
    endedAt,
    ounces: clamped,
  };

  return {
    ...kid,
    activeBottleSession: null,
    bottleFeeds: [entry, ...kid.bottleFeeds].slice(0, MAX_FEEDS),
  };
}

/** Remove a logged bottle feed; refresh schedule if nothing else is active. */
export function deleteBottleFeed(kid: KidState, id: string): KidState {
  const bottleFeeds = kid.bottleFeeds.filter((feed) => feed.id !== id);
  if (bottleFeeds.length === kid.bottleFeeds.length) return kid;

  const next = { ...kid, bottleFeeds };
  return {
    ...next,
    scheduleStartedAt: scheduleAfterHistoryChange(next),
  };
}

/** Newest logged feed start from breast or bottle history. */
export function newestLoggedFeedStartedAt(kid: KidState): string | null {
  const breast = kid.feeds[0]?.startedAt ?? null;
  const bottle = kid.bottleFeeds[0]?.startedAt ?? null;
  if (!breast) return bottle;
  if (!bottle) return breast;
  return new Date(breast).getTime() >= new Date(bottle).getTime()
    ? breast
    : bottle;
}

/** Keep schedule while a session is active; else use newest logged start. */
export function scheduleAfterHistoryChange(kid: KidState): string | null {
  if (kid.activeSession || kid.activeBottleSession) {
    return kid.scheduleStartedAt;
  }
  return newestLoggedFeedStartedAt(kid);
}

export function formatOunces(ounces: number): string {
  const rounded = Math.round(ounces * 4) / 4;
  if (Number.isInteger(rounded)) return `${rounded} oz`;
  return `${rounded.toFixed(2).replace(/0$/, "")} oz`;
}

export function splitOunces(ounces: number): {
  whole: number;
  fraction: OunceFraction;
} {
  const rounded = Math.round(ounces * 4) / 4;
  const whole = Math.floor(rounded);
  const fraction = (rounded - whole) as OunceFraction;
  return {
    whole: Math.min(MAX_BOTTLE_OUNCES, Math.max(0, whole)),
    fraction: OUNCE_FRACTIONS.includes(fraction) ? fraction : 0,
  };
}

export function combineOunces(whole: number, fraction: OunceFraction): number {
  return Math.min(MAX_BOTTLE_OUNCES, Math.max(0, whole) + fraction);
}

export function parseActiveBottleSession(
  value: unknown,
): ActiveBottleSession | null {
  if (!value || typeof value !== "object") return null;
  const s = value as Record<string, unknown>;
  if (typeof s.startedAt !== "string" || Number.isNaN(Date.parse(s.startedAt))) {
    return null;
  }
  return { startedAt: s.startedAt };
}

export function parseBottleFeeds(value: unknown): BottleFeed[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): BottleFeed | null => {
      if (!item || typeof item !== "object") return null;
      const f = item as Record<string, unknown>;
      if (typeof f.id !== "string") return null;
      if (
        typeof f.startedAt !== "string" ||
        Number.isNaN(Date.parse(f.startedAt))
      ) {
        return null;
      }
      if (
        typeof f.endedAt !== "string" ||
        Number.isNaN(Date.parse(f.endedAt))
      ) {
        return null;
      }
      if (typeof f.ounces !== "number" || !Number.isFinite(f.ounces)) {
        return null;
      }
      const ounces = Math.round(f.ounces * 4) / 4;
      if (ounces < 0.25 || ounces > MAX_BOTTLE_OUNCES) return null;
      return {
        id: f.id,
        startedAt: f.startedAt,
        endedAt: f.endedAt,
        ounces,
      };
    })
    .filter((f): f is BottleFeed => f !== null)
    .slice(0, MAX_FEEDS);
}
