import type {
  ActiveSession,
  AppState,
  BreastSide,
  FeedSegment,
  FeedSession,
  KidState,
  NotificationSettings,
  PanelId,
  VisiblePanels,
} from "./types";
import { parseDiapers } from "./diaper";
import { createId } from "./id";
import { parseMedicines } from "./medicine";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "postpartum-tracker";
export const MAX_FEEDS = 20;
export const DEFAULT_FEED_INTERVAL_HOURS = 3;
export const MIN_FEED_INTERVAL_HOURS = 1;
export const MAX_FEED_INTERVAL_HOURS = 6;
export const DEFAULT_KID_NAME = "Baby";

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

export function defaultNotificationSettings(): NotificationSettings {
  return {
    feed: true,
    medicine: true,
  };
}

function parseNotificationSettings(value: unknown): NotificationSettings {
  const base = defaultNotificationSettings();
  if (!value || typeof value !== "object") return base;
  const data = value as Record<string, unknown>;
  if (typeof data.feed === "boolean") base.feed = data.feed;
  if (typeof data.medicine === "boolean") base.medicine = data.medicine;
  return base;
}

export function defaultKidState(name = DEFAULT_KID_NAME): KidState {
  return {
    id: createId("kid"),
    name: name.trim() || DEFAULT_KID_NAME,
    lastBreast: null,
    activeSession: null,
    feeds: [],
    scheduleStartedAt: null,
    feedIntervalHours: DEFAULT_FEED_INTERVAL_HOURS,
    babyMedicines: [],
    diapers: [],
  };
}

export function defaultState(): AppState {
  const kid = defaultKidState();
  return {
    kids: [kid],
    activeKidId: kid.id,
    motherMedicines: [],
    visiblePanels: defaultVisiblePanels(),
    notificationSettings: defaultNotificationSettings(),
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

function parseFeedIntervalHours(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(
      MAX_FEED_INTERVAL_HOURS,
      Math.max(MIN_FEED_INTERVAL_HOURS, value),
    );
  }
  return DEFAULT_FEED_INTERVAL_HOURS;
}

function parseKidState(value: unknown): KidState | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  if (typeof data.id !== "string" || !data.id) return null;

  const name =
    typeof data.name === "string" && data.name.trim()
      ? data.name.trim()
      : DEFAULT_KID_NAME;

  const kid = defaultKidState(name);
  kid.id = data.id;

  if (isBreastSide(data.lastBreast)) {
    kid.lastBreast = data.lastBreast;
  }

  if (data.activeSession) {
    kid.activeSession = parseActiveSession(data.activeSession);
  }

  if (Array.isArray(data.feeds)) {
    kid.feeds = data.feeds
      .map(parseFeedSession)
      .filter((f): f is FeedSession => f !== null)
      .slice(0, MAX_FEEDS);
  }

  if (isIsoString(data.scheduleStartedAt)) {
    kid.scheduleStartedAt = data.scheduleStartedAt;
  } else if (kid.feeds[0]?.startedAt) {
    kid.scheduleStartedAt = kid.feeds[0].startedAt;
  } else if (kid.activeSession?.startedAt) {
    kid.scheduleStartedAt = kid.activeSession.startedAt;
  }

  kid.feedIntervalHours = parseFeedIntervalHours(data.feedIntervalHours);

  if (data.babyMedicines !== undefined) {
    kid.babyMedicines = parseMedicines(data.babyMedicines);
  }

  if (data.diapers !== undefined) {
    kid.diapers = parseDiapers(data.diapers);
  }

  return kid;
}

/** Build a kid from the pre-multi-kid flat AppState shape. */
function kidFromLegacyFlat(data: Record<string, unknown>): KidState {
  const kid = defaultKidState(DEFAULT_KID_NAME);

  if (isBreastSide(data.lastBreast)) {
    kid.lastBreast = data.lastBreast;
  }

  if (data.activeSession) {
    kid.activeSession = parseActiveSession(data.activeSession);
  } else if (data.activeFeed && typeof data.activeFeed === "object") {
    const af = data.activeFeed as Record<string, unknown>;
    if (isBreastSide(af.side) && isIsoString(af.startedAt)) {
      kid.activeSession = {
        startedAt: af.startedAt,
        segments: [],
        activeSegment: { side: af.side, startedAt: af.startedAt },
      };
    }
  }

  if (Array.isArray(data.feeds)) {
    kid.feeds = data.feeds
      .map(parseFeedSession)
      .filter((f): f is FeedSession => f !== null)
      .slice(0, MAX_FEEDS);
  }

  if (isIsoString(data.scheduleStartedAt)) {
    kid.scheduleStartedAt = data.scheduleStartedAt;
  } else if (kid.feeds[0]?.startedAt) {
    kid.scheduleStartedAt = kid.feeds[0].startedAt;
  } else if (kid.activeSession?.startedAt) {
    kid.scheduleStartedAt = kid.activeSession.startedAt;
  }

  kid.feedIntervalHours = parseFeedIntervalHours(data.feedIntervalHours);

  if (data.babyMedicines !== undefined) {
    kid.babyMedicines = parseMedicines(data.babyMedicines);
  }

  if (data.diapers !== undefined) {
    kid.diapers = parseDiapers(data.diapers);
  }

  return kid;
}

function parseMotherMedicines(data: Record<string, unknown>) {
  if (data.motherMedicines !== undefined) {
    return parseMedicines(data.motherMedicines);
  }
  if (data.medicines !== undefined) {
    // Migrate legacy single medicines list → mother's medicines
    return parseMedicines(data.medicines);
  }
  return [];
}

function normalize(raw: unknown): AppState {
  if (!raw || typeof raw !== "object") return defaultState();

  const data = raw as Record<string, unknown>;

  // Multi-kid shape
  if (Array.isArray(data.kids)) {
    const kids = data.kids
      .map(parseKidState)
      .filter((k): k is KidState => k !== null);

    if (kids.length === 0) return defaultState();

    const activeKidId =
      typeof data.activeKidId === "string" &&
      kids.some((k) => k.id === data.activeKidId)
        ? data.activeKidId
        : kids[0].id;

    return {
      kids,
      activeKidId,
      motherMedicines: parseMotherMedicines(data),
      visiblePanels:
        data.visiblePanels !== undefined
          ? parseVisiblePanels(data.visiblePanels)
          : defaultVisiblePanels(),
      notificationSettings: parseNotificationSettings(
        data.notificationSettings,
      ),
    };
  }

  // Legacy flat AppState → one kid named "Baby"
  const kid = kidFromLegacyFlat(data);
  return {
    kids: [kid],
    activeKidId: kid.id,
    motherMedicines: parseMotherMedicines(data),
    visiblePanels:
      data.visiblePanels !== undefined
        ? parseVisiblePanels(data.visiblePanels)
        : defaultVisiblePanels(),
    notificationSettings: parseNotificationSettings(
      data.notificationSettings,
    ),
  };
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

export function getActiveKid(state: AppState): KidState {
  return (
    state.kids.find((k) => k.id === state.activeKidId) ??
    state.kids[0] ??
    defaultKidState()
  );
}

export function updateActiveKid(
  state: AppState,
  updater: (kid: KidState) => KidState,
): AppState {
  const activeId = state.activeKidId;
  const kids = state.kids.map((kid) =>
    kid.id === activeId ? updater(kid) : kid,
  );
  // If active id was missing, ensure we still have a valid active kid
  const activeKidId = kids.some((k) => k.id === activeId)
    ? activeId
    : (kids[0]?.id ?? activeId);
  return { ...state, kids, activeKidId };
}
