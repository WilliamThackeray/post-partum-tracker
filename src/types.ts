export type BreastSide = "left" | "right";

export type ActiveFeed = {
  side: BreastSide;
  startedAt: string;
};

export type FeedEntry = {
  id: string;
  side: BreastSide;
  startedAt: string;
  endedAt: string;
  durationMs: number;
};

export type MedicineKey = "ibuprofen" | "tylenol";

export type MedicineState = {
  lastTakenAt: string | null;
};

export type AppState = {
  lastBreast: BreastSide | null;
  activeFeed: ActiveFeed | null;
  feeds: FeedEntry[];
  medicines: Record<MedicineKey, MedicineState>;
};
