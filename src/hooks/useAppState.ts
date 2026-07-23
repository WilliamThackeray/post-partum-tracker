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
import { addMedicine, parseMedicines, removeMedicine, takeMedicine } from "../medicine";
import { defaultState, loadState, saveState } from "../storage";
import type { AppState, BreastSide } from "../types";

export type UseAppStateResult = {
  ready: boolean;
  state: AppState;
  selectedSide: BreastSide;
  timerLabel: string;
  selectSide: (side: BreastSide) => void;
  markSchedule: () => void;
  startTimer: () => void;
  endTimer: () => void;
  takeMed: (id: string) => void;
  addMed: (name: string, intervalHours: number) => void;
  removeMed: (id: string) => void;
  intervalDown: () => void;
  intervalUp: () => void;
};

function coerceState(raw: AppState): AppState {
  return {
    ...raw,
    medicines: Array.isArray(raw.medicines)
      ? raw.medicines
      : parseMedicines(raw.medicines),
  };
}

export function useAppState(): UseAppStateResult {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<AppState | null>(null);
  const [selectedSide, setSelectedSide] = useState<BreastSide>("left");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const loaded = coerceState(await loadState());
      if (cancelled) return;
      setState(loaded);
      setSelectedSide(loaded.activeFeed?.side ?? loaded.lastBreast ?? "left");
      setReady(true);
      // Re-save so legacy Record medicines get rewritten as an array.
      await saveState(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: AppState) => {
    const coerced = coerceState(next);
    setState(coerced);
    await saveState(coerced);
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
    (id: string) => {
      if (!state) return;
      void persist(takeMedicine(state, id));
    },
    [persist, state],
  );

  const addMed = useCallback(
    (name: string, intervalHours: number) => {
      if (!state) return;
      void persist(addMedicine(state, name, intervalHours));
    },
    [persist, state],
  );

  const removeMed = useCallback(
    (id: string) => {
      if (!state) return;
      void persist(removeMedicine(state, id));
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
    state: state ?? defaultState(),
    selectedSide,
    timerLabel,
    selectSide,
    markSchedule,
    startTimer,
    endTimer,
    takeMed,
    addMed,
    removeMed,
    intervalDown,
    intervalUp,
  };
}
