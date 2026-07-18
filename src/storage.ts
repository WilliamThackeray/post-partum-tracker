import type { AppState, BreastSide, FeedEntry, MedicineKey } from "./types";

const STORAGE_KEY = "postpartum-tracker";
export const MAX_FEEDS = 20;

export function defaultState(): AppState {
  return {
    lastBreast: null,
    activeFeed: null,
    feeds: [],
    medicines: {
      ibuprofen: { lastTakenAt: null },
      tylenol: { lastTakenAt: null },
    },
  };
}

function isBreastSide(value: unknown): value is BreastSide {
  return value === "left" || value === "right";
}

function isIsoString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function parseFeed(value: unknown): FeedEntry | null {
  if (!value || typeof value !== "object") return null;
  const f = value as Record<string, unknown>;
  if (
    typeof f.id !== "string" ||
    !isBreastSide(f.side) ||
    !isIsoString(f.startedAt) ||
    !isIsoString(f.endedAt) ||
    typeof f.durationMs !== "number"
  ) {
    return null;
  }
  return {
    id: f.id,
    side: f.side,
    startedAt: f.startedAt,
    endedAt: f.endedAt,
    durationMs: f.durationMs,
  };
}

function parseMedicine(value: unknown): { lastTakenAt: string | null } {
  if (!value || typeof value !== "object") return { lastTakenAt: null };
  const m = value as Record<string, unknown>;
  if (m.lastTakenAt === null) return { lastTakenAt: null };
  if (isIsoString(m.lastTakenAt)) return { lastTakenAt: m.lastTakenAt };
  return { lastTakenAt: null };
}

function normalize(raw: unknown): AppState {
  const base = defaultState();
  if (!raw || typeof raw !== "object") return base;

  const data = raw as Record<string, unknown>;

  if (isBreastSide(data.lastBreast)) {
    base.lastBreast = data.lastBreast;
  } else {
    base.lastBreast = null;
  }

  if (data.activeFeed && typeof data.activeFeed === "object") {
    const af = data.activeFeed as Record<string, unknown>;
    if (isBreastSide(af.side) && isIsoString(af.startedAt)) {
      base.activeFeed = { side: af.side, startedAt: af.startedAt };
    }
  }

  if (Array.isArray(data.feeds)) {
    base.feeds = data.feeds
      .map(parseFeed)
      .filter((f): f is FeedEntry => f !== null)
      .slice(0, MAX_FEEDS);
  }

  if (data.medicines && typeof data.medicines === "object") {
    const meds = data.medicines as Record<string, unknown>;
    for (const key of ["ibuprofen", "tylenol"] as MedicineKey[]) {
      base.medicines[key] = parseMedicine(meds[key]);
    }
  }

  return base;
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return normalize(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
