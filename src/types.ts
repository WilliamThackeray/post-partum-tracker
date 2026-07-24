export type BreastSide = "left" | "right";

export type FeedSegment = {
  side: BreastSide;
  startedAt: string;
  endedAt: string;
  durationMs: number;
};

export type FeedSession = {
  id: string;
  startedAt: string;
  endedAt: string;
  /** Sum of segment durations. */
  durationMs: number;
  segments: FeedSegment[];
};

export type ActiveSegment = {
  side: BreastSide;
  startedAt: string;
};

export type ActiveSession = {
  startedAt: string;
  segments: FeedSegment[];
  activeSegment: ActiveSegment | null;
};

export type Medicine = {
  id: string;
  name: string;
  /** Hours between doses. */
  intervalHours: number;
  lastTakenAt: string | null;
  /** Newest-first take timestamps for undo / future history. */
  takenAtLog: string[];
};

export type MedicineScope = "mother" | "baby";

export type DiaperKind = "wet" | "messy" | "both";

export type DiaperChange = {
  id: string;
  changedAt: string;
  wet: boolean;
  messy: boolean;
};

export type PanelId =
  | "feed"
  | "motherMedicine"
  | "babyMedicine"
  | "diaper"
  | "interval";

export type VisiblePanels = Record<PanelId, boolean>;

/** Per-kid baby tracking. Mother medicines live on AppState (shared). */
export type KidState = {
  id: string;
  name: string;
  lastBreast: BreastSide | null;
  activeSession: ActiveSession | null;
  feeds: FeedSession[];
  /** When the current feeding cycle started (for last/next schedule). */
  scheduleStartedAt: string | null;
  feedIntervalHours: number;
  babyMedicines: Medicine[];
  diapers: DiaperChange[];
};

export type AppState = {
  kids: KidState[];
  activeKidId: string;
  motherMedicines: Medicine[];
  visiblePanels: VisiblePanels;
};
