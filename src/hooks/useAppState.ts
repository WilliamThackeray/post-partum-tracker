import { useCallback, useEffect, useState } from "react";
import {
  endFeed,
  elapsedMs,
  formatDuration,
  markScheduleStart,
  setFeedIntervalHours,
  setFeedSide,
  startFeed,
} from "../feed";
import { takeMedicine } from "../medicine";
import { loadState, saveState } from "../storage";
import type { AppState, BreastSide, MedicineKey } from "../types";

export type UseAppStateResult = {
  ready: boolean;
  state: AppState;
  selectedSide: BreastSide;
  timerLabel: string;
  selectSide: (side: BreastSide) => void;
  markSchedule: () => void;
  startTimer: () => void;
  endTimer: () => void;
  takeMed: (key: MedicineKey) => void;
  intervalDown: () => void;
  intervalUp: () => void;
};

export function useAppState(): UseAppStateResult {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<AppState | null>(null);
  const [selectedSide, setSelectedSide] = useState<BreastSide>("left");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const loaded = await loadState();
      if (cancelled) return;
      setState(loaded);
      setSelectedSide(loaded.activeFeed?.side ?? loaded.lastBreast ?? "left");
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: AppState) => {
    setState(next);
    await saveState(next);
  }, []);

  useEffect(() => {
    if (!state?.activeFeed) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state?.activeFeed]);

  const selectSide = useCallback(
    (side: BreastSide) => {
      setSelectedSide(side);
      if (!state) return;
      if (state.activeFeed) {
        void persist(setFeedSide(state, side));
      }
    },
    [persist, state],
  );

  const markSchedule = useCallback(() => {
    if (!state) return;
    void persist(markScheduleStart(state));
  }, [persist, state]);

  const startTimer = useCallback(() => {
    if (!state) return;
    void persist(startFeed(state, selectedSide));
  }, [persist, selectedSide, state]);

  const endTimer = useCallback(() => {
    if (!state) return;
    const next = endFeed(state);
    setSelectedSide(
      next.lastBreast === "left"
        ? "right"
        : next.lastBreast === "right"
          ? "left"
          : selectedSide,
    );
    void persist(next);
  }, [persist, selectedSide, state]);

  const takeMed = useCallback(
    (key: MedicineKey) => {
      if (!state) return;
      void persist(takeMedicine(state, key));
    },
    [persist, state],
  );

  const intervalDown = useCallback(() => {
    if (!state) return;
    void persist(setFeedIntervalHours(state, state.feedIntervalHours - 0.5));
  }, [persist, state]);

  const intervalUp = useCallback(() => {
    if (!state) return;
    void persist(setFeedIntervalHours(state, state.feedIntervalHours + 0.5));
  }, [persist, state]);

  const timerLabel =
    state?.activeFeed != null
      ? formatDuration(elapsedMs(state.activeFeed.startedAt, now))
      : "00:00";

  return {
    ready,
    state: state ?? ({} as AppState),
    selectedSide,
    timerLabel,
    selectSide,
    markSchedule,
    startTimer,
    endTimer,
    takeMed,
    intervalDown,
    intervalUp,
  };
}
