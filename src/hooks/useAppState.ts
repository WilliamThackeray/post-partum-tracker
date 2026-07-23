import { useCallback, useEffect, useState } from "react";
import { deleteDiaper, logDiaper, parseDiapers } from "../diaper";
import {
  deleteFeed,
  endSide,
  elapsedMs,
  formatDuration,
  setFeedIntervalHours,
  startSession,
  startSide,
  stopSession,
} from "../feed";
import { addMedicine, parseMedicines, removeMedicine, takeMedicine } from "../medicine";
import { defaultState, loadState, saveState } from "../storage";
import type { AppState, BreastSide, DiaperKind } from "../types";

export type UseAppStateResult = {
  ready: boolean;
  state: AppState;
  timerLabel: string;
  toggleSession: () => void;
  toggleSide: (side: BreastSide) => void;
  deleteLoggedFeed: (id: string) => void;
  takeMed: (id: string) => void;
  addMed: (name: string, intervalHours: number) => void;
  removeMed: (id: string) => void;
  logDiaperChange: (kind: DiaperKind) => void;
  deleteLoggedDiaper: (id: string) => void;
  intervalDown: () => void;
  intervalUp: () => void;
};

function coerceState(raw: AppState): AppState {
  return {
    ...raw,
    medicines: Array.isArray(raw.medicines)
      ? raw.medicines
      : parseMedicines(raw.medicines),
    diapers: Array.isArray(raw.diapers) ? raw.diapers : parseDiapers(raw.diapers),
  };
}

export function useAppState(): UseAppStateResult {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<AppState | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const loaded = coerceState(await loadState());
      if (cancelled) return;
      setState(loaded);
      setReady(true);
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
    if (!state?.activeSession?.activeSegment) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state?.activeSession?.activeSegment]);

  const toggleSession = useCallback(() => {
    if (!state) return;
    if (state.activeSession) {
      void persist(stopSession(state));
    } else {
      void persist(startSession(state));
    }
  }, [persist, state]);

  const toggleSide = useCallback(
    (side: BreastSide) => {
      if (!state?.activeSession) return;
      if (state.activeSession.activeSegment?.side === side) {
        void persist(endSide(state));
      } else {
        void persist(startSide(state, side));
      }
    },
    [persist, state],
  );

  const deleteLoggedFeed = useCallback(
    (id: string) => {
      if (!state) return;
      void persist(deleteFeed(state, id));
    },
    [persist, state],
  );

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

  const logDiaperChange = useCallback(
    (kind: DiaperKind) => {
      if (!state) return;
      void persist(logDiaper(state, kind));
    },
    [persist, state],
  );

  const deleteLoggedDiaper = useCallback(
    (id: string) => {
      if (!state) return;
      void persist(deleteDiaper(state, id));
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

  const activeStartedAt = state?.activeSession?.activeSegment?.startedAt;
  const timerLabel =
    activeStartedAt != null
      ? formatDuration(elapsedMs(activeStartedAt, now))
      : "00:00";

  return {
    ready,
    state: state ?? defaultState(),
    timerLabel,
    toggleSession,
    toggleSide,
    deleteLoggedFeed,
    takeMed,
    addMed,
    removeMed,
    logDiaperChange,
    deleteLoggedDiaper,
    intervalDown,
    intervalUp,
  };
}
