import type {
  ActiveSession,
  AppState,
  BreastSide,
  FeedSegment,
  FeedSession,
  PanelId,
  VisiblePanels,
} from "./types";
import { parseDiapers } from "./diaper";
import { parseMedicines } from "./medicine";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "postpartum-tracker";
export const MAX_FEEDS = 20;
export const DEFAULT_FEED_INTERVAL_HOURS = 3;
export const MIN_FEED_INTERVAL_HOURS = 1;
export const MAX_FEED_INTERVAL_HOURS = 6;

const PANEL_IDS: PanelId[] = [
  "feed",
  "motherMedicine",
  "babyMedicine",
  "diaper",
  "interval",
];

export function defaultVisiblePanels(): VisiblePanels {
  return {
    feed: true,
    motherMedicine: true,
    babyMedicine: true,
    diaper: true,
    interval: true,
  };
}

export function defaultState(): AppState {
  return {
    lastBreast: null,
    activeSession: null,
    feeds: [],
    scheduleStartedAt: null,
    feedIntervalHours: DEFAULT_FEED_INTERVAL_HOURS,
    motherMedicines: [],
    babyMedicines: [],
    diapers: [],
    visiblePanels: defaultVisiblePanels(),
  };
}

function parseVisiblePanels(value: unknown): VisiblePanels {
  const base = defaultVisiblePanels();
  if (!value || typeof value !== "object") return base;
  const data = value as Record<string, unknown>;
  for (const id of PANEL_IDS) {
    if (typeof data[id] === "boolean") {
      base[id] = data[id];
    }
  }
  // Migrate legacy single "medicine" toggle → both medicine panels
  if (
    typeof data.medicine === "boolean" &&
    data.motherMedicine === undefined &&
    data.babyMedicine === undefined
  ) {
    base.motherMedicine = data.medicine;
    base.babyMedicine = data.medicine;
  }
  return base;
}

function isBreastSide(value: unknown): value is BreastSide {
  return value === "left" || value === "right";
}

function isIsoString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function parseSegment(value: unknown): FeedSegment | null {
  if (!value || typeof value !== "object") return null;
  const s = value as Record<string, unknown>;
  if (
    !isBreastSide(s.side) ||
    !isIsoString(s.startedAt) ||
    !isIsoString(s.endedAt) ||
    typeof s.durationMs !== "number"
  ) {
    return null;
  }
  return {
    side: s.side,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    durationMs: s.durationMs,
  };
}

function parseFeedSession(value: unknown): FeedSession | null {
  if (!value || typeof value !== "object") return null;
  const f = value as Record<string, unknown>;

  // Legacy single-side feed entry → one-segment session
  if (
    typeof f.id === "string" &&
    isBreastSide(f.side) &&
    isIsoString(f.startedAt) &&
    isIsoString(f.endedAt) &&
    typeof f.durationMs === "number" &&
    !Array.isArray(f.segments)
  ) {
    return {
      id: f.id,
      startedAt: f.startedAt,
      endedAt: f.endedAt,
      durationMs: f.durationMs,
      segments: [
        {
          side: f.side,
          startedAt: f.startedAt,
          endedAt: f.endedAt,
          durationMs: f.durationMs,
        },
      ],
    };
  }

  if (
    typeof f.id !== "string" ||
    !isIsoString(f.startedAt) ||
    !isIsoString(f.endedAt) ||
    typeof f.durationMs !== "number" ||
    !Array.isArray(f.segments)
  ) {
    return null;
  }

  const segments = f.segments
    .map(parseSegment)
    .filter((s): s is FeedSegment => s !== null);

  return {
    id: f.id,
    startedAt: f.startedAt,
    endedAt: f.endedAt,
    durationMs: f.durationMs,
    segments,
  };
}

function parseActiveSession(value: unknown): ActiveSession | null {
  if (!value || typeof value !== "object") return null;
  const s = value as Record<string, unknown>;
  if (!isIsoString(s.startedAt)) return null;

  const segments = Array.isArray(s.segments)
    ? s.segments
        .map(parseSegment)
        .filter((seg): seg is FeedSegment => seg !== null)
    : [];

  let activeSegment: ActiveSession["activeSegment"] = null;
  if (s.activeSegment && typeof s.activeSegment === "object") {
    const a = s.activeSegment as Record<string, unknown>;
    if (isBreastSide(a.side) && isIsoString(a.startedAt)) {
      activeSegment = { side: a.side, startedAt: a.startedAt };
    }
  }

  return { startedAt: s.startedAt, segments, activeSegment };
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

  if (data.activeSession) {
    base.activeSession = parseActiveSession(data.activeSession);
  } else if (data.activeFeed && typeof data.activeFeed === "object") {
    // Migrate legacy activeFeed → activeSession with one open side
    const af = data.activeFeed as Record<string, unknown>;
    if (isBreastSide(af.side) && isIsoString(af.startedAt)) {
      base.activeSession = {
        startedAt: af.startedAt,
        segments: [],
        activeSegment: { side: af.side, startedAt: af.startedAt },
      };
    }
  }

  if (Array.isArray(data.feeds)) {
    base.feeds = data.feeds
      .map(parseFeedSession)
      .filter((f): f is FeedSession => f !== null)
      .slice(0, MAX_FEEDS);
  }

  if (isIsoString(data.scheduleStartedAt)) {
    base.scheduleStartedAt = data.scheduleStartedAt;
  } else if (base.feeds[0]?.startedAt) {
    base.scheduleStartedAt = base.feeds[0].startedAt;
  } else if (base.activeSession?.startedAt) {
    base.scheduleStartedAt = base.activeSession.startedAt;
  }

  if (
    typeof data.feedIntervalHours === "number" &&
    Number.isFinite(data.feedIntervalHours)
  ) {
    base.feedIntervalHours = Math.min(
      MAX_FEED_INTERVAL_HOURS,
      Math.max(MIN_FEED_INTERVAL_HOURS, data.feedIntervalHours),
    );
  }

  if (data.motherMedicines !== undefined) {
    base.motherMedicines = parseMedicines(data.motherMedicines);
  } else if (data.medicines !== undefined) {
    // Migrate legacy single medicines list → mother's medicines
    base.motherMedicines = parseMedicines(data.medicines);
  }

  if (data.babyMedicines !== undefined) {
    base.babyMedicines = parseMedicines(data.babyMedicines);
  }

  if (data.diapers !== undefined) {
    base.diapers = parseDiapers(data.diapers);
  }

  if (data.visiblePanels !== undefined) {
    base.visiblePanels = parseVisiblePanels(data.visiblePanels);
  }

  return base;
}

export async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return normalize(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export async function saveState(state: AppState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
