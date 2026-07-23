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

export type Medicine = {
  id: string;
  name: string;
  /** Hours between doses. */
  intervalHours: number;
  lastTakenAt: string | null;
};

export type AppState = {
  lastBreast: BreastSide | null;
  activeFeed: ActiveFeed | null;
  feeds: FeedEntry[];
  /** When the current feeding cycle started (for last/next schedule). */
  scheduleStartedAt: string | null;
  feedIntervalHours: number;
  medicines: Medicine[];
};
