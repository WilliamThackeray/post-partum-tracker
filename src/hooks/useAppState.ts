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
import {
  addBabyMedicine,
  addMedicine,
  parseMedicines,
  removeBabyMedicine,
  removeMedicine,
  takeBabyMedicine,
  takeMedicine,
  undoTakeBabyMedicine,
  undoTakeMedicine,
} from "../medicine";
import { syncAlertsFromState } from "../notifications";
import {
  defaultKidState,
  defaultNotificationSettings,
  defaultState,
  defaultVisiblePanels,
  getActiveKid,
  loadState,
  saveState,
  updateActiveKid,
} from "../storage";
import type {
  AppState,
  BreastSide,
  DiaperKind,
  KidState,
  MedicineScope,
  NotificationSettings,
  PanelId,
} from "../types";

export type UseAppStateResult = {
  ready: boolean;
  state: AppState;
  activeKid: KidState;
  timerLabel: string;
  toggleSession: () => void;
  toggleSide: (side: BreastSide) => void;
  deleteLoggedFeed: (id: string) => void;
  takeMed: (scope: MedicineScope, id: string) => void;
  undoTakeMed: (scope: MedicineScope, id: string) => void;
  addMed: (scope: MedicineScope, name: string, intervalHours: number) => void;
  removeMed: (scope: MedicineScope, id: string) => void;
  logDiaperChange: (kind: DiaperKind) => void;
  deleteLoggedDiaper: (id: string) => void;
  intervalDown: () => void;
  intervalUp: () => void;
  setPanelVisible: (id: PanelId, visible: boolean) => void;
  setNotificationEnabled: (
    key: keyof NotificationSettings,
    enabled: boolean,
  ) => void;
  selectKid: (id: string) => void;
  addKid: (name: string) => void;
  renameKid: (id: string, name: string) => void;
  removeKid: (id: string) => void;
};

function coerceKid(kid: KidState): KidState {
  return {
    ...kid,
    babyMedicines: parseMedicines(kid.babyMedicines),
    diapers: Array.isArray(kid.diapers) ? kid.diapers : parseDiapers(kid.diapers),
  };
}

function coerceState(raw: AppState): AppState {
  const kids = raw.kids.map(coerceKid);
  const visiblePanels = {
    ...defaultVisiblePanels(),
    ...(raw.visiblePanels ?? {}),
  };
  const notificationSettings = {
    ...defaultNotificationSettings(),
    ...(raw.notificationSettings ?? {}),
  };
  const motherMedicines = parseMedicines(raw.motherMedicines);

  if (kids.length === 0) {
    const kid = defaultKidState();
    return {
      kids: [kid],
      activeKidId: kid.id,
      motherMedicines,
      visiblePanels,
      notificationSettings,
    };
  }

  const activeKidId = kids.some((k) => k.id === raw.activeKidId)
    ? raw.activeKidId
    : kids[0].id;

  return {
    kids,
    activeKidId,
    motherMedicines,
    visiblePanels,
    notificationSettings,
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
      if (cancelled) return;
      void syncAlertsFromState(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: AppState) => {
    const coerced = coerceState(next);
    setState(coerced);
    await saveState(coerced);
    void syncAlertsFromState(coerced);
  }, []);

  const activeKid = state ? getActiveKid(state) : defaultKidState();

  useEffect(() => {
    if (!activeKid.activeSession?.activeSegment) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [activeKid.activeSession?.activeSegment]);

  const toggleSession = useCallback(() => {
    if (!state) return;
    void persist(
      updateActiveKid(state, (kid) =>
        kid.activeSession ? stopSession(kid) : startSession(kid),
      ),
    );
  }, [persist, state]);

  const toggleSide = useCallback(
    (side: BreastSide) => {
      if (!state) return;
      const kid = getActiveKid(state);
      if (!kid.activeSession) return;
      void persist(
        updateActiveKid(state, (k) =>
          k.activeSession?.activeSegment?.side === side
            ? endSide(k)
            : startSide(k, side),
        ),
      );
    },
    [persist, state],
  );

  const deleteLoggedFeed = useCallback(
    (id: string) => {
      if (!state) return;
      void persist(updateActiveKid(state, (kid) => deleteFeed(kid, id)));
    },
    [persist, state],
  );

  const takeMed = useCallback(
    (scope: MedicineScope, id: string) => {
      if (!state) return;
      if (scope === "mother") {
        void persist(takeMedicine(state, "mother", id));
      } else {
        void persist(updateActiveKid(state, (kid) => takeBabyMedicine(kid, id)));
      }
    },
    [persist, state],
  );

  const undoTakeMed = useCallback(
    (scope: MedicineScope, id: string) => {
      if (!state) return;
      if (scope === "mother") {
        void persist(undoTakeMedicine(state, "mother", id));
      } else {
        void persist(
          updateActiveKid(state, (kid) => undoTakeBabyMedicine(kid, id)),
        );
      }
    },
    [persist, state],
  );

  const addMed = useCallback(
    (scope: MedicineScope, name: string, intervalHours: number) => {
      if (!state) return;
      if (scope === "mother") {
        void persist(addMedicine(state, "mother", name, intervalHours));
      } else {
        void persist(
          updateActiveKid(state, (kid) =>
            addBabyMedicine(kid, name, intervalHours),
          ),
        );
      }
    },
    [persist, state],
  );

  const removeMed = useCallback(
    (scope: MedicineScope, id: string) => {
      if (!state) return;
      if (scope === "mother") {
        void persist(removeMedicine(state, "mother", id));
      } else {
        void persist(
          updateActiveKid(state, (kid) => removeBabyMedicine(kid, id)),
        );
      }
    },
    [persist, state],
  );

  const logDiaperChange = useCallback(
    (kind: DiaperKind) => {
      if (!state) return;
      void persist(updateActiveKid(state, (kid) => logDiaper(kid, kind)));
    },
    [persist, state],
  );

  const deleteLoggedDiaper = useCallback(
    (id: string) => {
      if (!state) return;
      void persist(updateActiveKid(state, (kid) => deleteDiaper(kid, id)));
    },
    [persist, state],
  );

  const intervalDown = useCallback(() => {
    if (!state) return;
    void persist(
      updateActiveKid(state, (kid) =>
        setFeedIntervalHours(kid, kid.feedIntervalHours - 0.5),
      ),
    );
  }, [persist, state]);

  const intervalUp = useCallback(() => {
    if (!state) return;
    void persist(
      updateActiveKid(state, (kid) =>
        setFeedIntervalHours(kid, kid.feedIntervalHours + 0.5),
      ),
    );
  }, [persist, state]);

  const setPanelVisible = useCallback(
    (id: PanelId, visible: boolean) => {
      if (!state) return;
      void persist({
        ...state,
        visiblePanels: { ...state.visiblePanels, [id]: visible },
      });
    },
    [persist, state],
  );

  const setNotificationEnabled = useCallback(
    (key: keyof NotificationSettings, enabled: boolean) => {
      if (!state) return;
      void persist({
        ...state,
        notificationSettings: {
          ...state.notificationSettings,
          [key]: enabled,
        },
      });
    },
    [persist, state],
  );

  const selectKid = useCallback(
    (id: string) => {
      if (!state) return;
      if (!state.kids.some((k) => k.id === id)) return;
      void persist({ ...state, activeKidId: id });
    },
    [persist, state],
  );

  const addKid = useCallback(
    (name: string) => {
      if (!state) return;
      const trimmed = name.trim();
      if (!trimmed) return;
      const kid = defaultKidState(trimmed);
      void persist({
        ...state,
        kids: [...state.kids, kid],
        activeKidId: kid.id,
      });
    },
    [persist, state],
  );

  const renameKid = useCallback(
    (id: string, name: string) => {
      if (!state) return;
      const trimmed = name.trim();
      if (!trimmed) return;
      if (!state.kids.some((k) => k.id === id)) return;
      void persist({
        ...state,
        kids: state.kids.map((kid) =>
          kid.id === id ? { ...kid, name: trimmed } : kid,
        ),
      });
    },
    [persist, state],
  );

  const removeKid = useCallback(
    (id: string) => {
      if (!state) return;
      if (state.kids.length <= 1) return;
      const kids = state.kids.filter((k) => k.id !== id);
      if (kids.length === state.kids.length) return;
      const activeKidId =
        state.activeKidId === id
          ? kids[0].id
          : state.activeKidId;
      void persist({ ...state, kids, activeKidId });
    },
    [persist, state],
  );

  const activeStartedAt = activeKid.activeSession?.activeSegment?.startedAt;
  const timerLabel =
    activeStartedAt != null
      ? formatDuration(elapsedMs(activeStartedAt, now))
      : "00:00";

  const resolved = state ?? defaultState();

  return {
    ready,
    state: resolved,
    activeKid: getActiveKid(resolved),
    timerLabel,
    toggleSession,
    toggleSide,
    deleteLoggedFeed,
    takeMed,
    undoTakeMed,
    addMed,
    removeMed,
    logDiaperChange,
    deleteLoggedDiaper,
    intervalDown,
    intervalUp,
    setPanelVisible,
    setNotificationEnabled,
    selectKid,
    addKid,
    renameKid,
    removeKid,
  };
}
