import { createId } from "./id";
import type { AppState, KidState, Medicine, MedicineScope } from "./types";

export const DEFAULT_MEDICINE_INTERVAL_HOURS = 8;
export const MIN_MEDICINE_INTERVAL_HOURS = 0.5;
export const MAX_MEDICINE_INTERVAL_HOURS = 24;
export const MAX_MEDICINE_TAKES = 50;

const LEGACY_MEDICINE_LABELS: Record<string, string> = {
  ibuprofen: "Ibuprofen",
  tylenol: "Tylenol",
};

export function clampMedicineIntervalHours(hours: number): number {
  if (!Number.isFinite(hours)) return DEFAULT_MEDICINE_INTERVAL_HOURS;
  return Math.min(
    MAX_MEDICINE_INTERVAL_HOURS,
    Math.max(MIN_MEDICINE_INTERVAL_HOURS, hours),
  );
}

function mapMedicine(
  medicines: Medicine[],
  id: string,
  update: (med: Medicine) => Medicine,
): Medicine[] {
  return medicines.map((med) => (med.id === id ? update(med) : med));
}

function takeInList(medicines: Medicine[], id: string): Medicine[] {
  const takenAt = new Date().toISOString();
  return mapMedicine(medicines, id, (med) => {
    const takenAtLog = [takenAt, ...med.takenAtLog].slice(0, MAX_MEDICINE_TAKES);
    return { ...med, lastTakenAt: takenAt, takenAtLog };
  });
}

function undoTakeInList(medicines: Medicine[], id: string): Medicine[] {
  return mapMedicine(medicines, id, (med) => {
    if (med.takenAtLog.length === 0 && med.lastTakenAt == null) return med;
    const takenAtLog = med.takenAtLog.length > 0 ? med.takenAtLog.slice(1) : [];
    return {
      ...med,
      takenAtLog,
      lastTakenAt: takenAtLog[0] ?? null,
    };
  });
}

function addInList(
  medicines: Medicine[],
  name: string,
  intervalHours: number,
): Medicine[] {
  const trimmed = name.trim();
  if (!trimmed) return medicines;

  const medicine: Medicine = {
    id: createId("med"),
    name: trimmed,
    intervalHours: clampMedicineIntervalHours(intervalHours),
    lastTakenAt: null,
    takenAtLog: [],
  };

  return [...medicines, medicine];
}

function removeInList(medicines: Medicine[], id: string): Medicine[] {
  return medicines.filter((med) => med.id !== id);
}

/** Mother medicines are shared on AppState. Baby medicines live on KidState. */
export function takeMedicine(
  state: AppState,
  scope: MedicineScope,
  id: string,
): AppState {
  if (scope === "mother") {
    return {
      ...state,
      motherMedicines: takeInList(state.motherMedicines, id),
    };
  }
  // Baby scope must be applied via takeBabyMedicine on the active kid.
  return state;
}

export function takeBabyMedicine(kid: KidState, id: string): KidState {
  return {
    ...kid,
    babyMedicines: takeInList(kid.babyMedicines, id),
  };
}

export function undoTakeMedicine(
  state: AppState,
  scope: MedicineScope,
  id: string,
): AppState {
  if (scope === "mother") {
    return {
      ...state,
      motherMedicines: undoTakeInList(state.motherMedicines, id),
    };
  }
  return state;
}

export function undoTakeBabyMedicine(kid: KidState, id: string): KidState {
  return {
    ...kid,
    babyMedicines: undoTakeInList(kid.babyMedicines, id),
  };
}

export function addMedicine(
  state: AppState,
  scope: MedicineScope,
  name: string,
  intervalHours: number,
): AppState {
  if (scope === "mother") {
    return {
      ...state,
      motherMedicines: addInList(state.motherMedicines, name, intervalHours),
    };
  }
  return state;
}

export function addBabyMedicine(
  kid: KidState,
  name: string,
  intervalHours: number,
): KidState {
  return {
    ...kid,
    babyMedicines: addInList(kid.babyMedicines, name, intervalHours),
  };
}

export function removeMedicine(
  state: AppState,
  scope: MedicineScope,
  id: string,
): AppState {
  if (scope === "mother") {
    return {
      ...state,
      motherMedicines: removeInList(state.motherMedicines, id),
    };
  }
  return state;
}

export function removeBabyMedicine(kid: KidState, id: string): KidState {
  return {
    ...kid,
    babyMedicines: removeInList(kid.babyMedicines, id),
  };
}

export function nextDueAt(lastTakenAt: string, intervalHours: number): Date {
  const hours = clampMedicineIntervalHours(intervalHours);
  return new Date(new Date(lastTakenAt).getTime() + hours * 60 * 60 * 1000);
}

export function isOverdue(
  lastTakenAt: string | null,
  intervalHours: number,
  now = Date.now(),
): boolean {
  if (!lastTakenAt) return false;
  return nextDueAt(lastTakenAt, intervalHours).getTime() <= now;
}

export function formatIntervalHours(hours: number): string {
  const value = clampMedicineIntervalHours(hours);
  if (value === 1) return "1 hour";
  return `${Number(value.toFixed(1))} hours`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function parseIntervalHours(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return clampMedicineIntervalHours(value);
  }
  return DEFAULT_MEDICINE_INTERVAL_HOURS;
}

function parseLastTakenAt(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return value;
  }
  return null;
}

function parseTakenAtLog(
  value: unknown,
  lastTakenAt: string | null,
): string[] {
  if (Array.isArray(value)) {
    const log = value
      .filter(
        (item): item is string =>
          typeof item === "string" && !Number.isNaN(Date.parse(item)),
      )
      .slice(0, MAX_MEDICINE_TAKES);
    if (log.length > 0) return log;
  }
  // Seed from lastTakenAt so undo works for pre-log data
  return lastTakenAt ? [lastTakenAt] : [];
}

export function parseMedicines(value: unknown): Medicine[] {
  if (Array.isArray(value)) {
    return value
      .map((item): Medicine | null => {
        if (!item || typeof item !== "object") return null;
        const m = item as Record<string, unknown>;
        if (typeof m.id !== "string" || typeof m.name !== "string") return null;
        const name = m.name.trim();
        if (!name) return null;
        const lastTakenAt = parseLastTakenAt(m.lastTakenAt);
        const takenAtLog = parseTakenAtLog(m.takenAtLog, lastTakenAt);
        return {
          id: m.id,
          name,
          intervalHours: parseIntervalHours(m.intervalHours),
          lastTakenAt: takenAtLog[0] ?? lastTakenAt,
          takenAtLog,
        };
      })
      .filter((m): m is Medicine => m !== null);
  }

  // Migrate legacy Record<"ibuprofen" | "tylenol", { lastTakenAt }>
  if (value && typeof value === "object") {
    const meds = value as Record<string, unknown>;
    const migrated: Medicine[] = [];
    for (const [key, label] of Object.entries(LEGACY_MEDICINE_LABELS)) {
      const entry = meds[key];
      if (!entry || typeof entry !== "object") continue;
      const m = entry as Record<string, unknown>;
      const lastTakenAt = parseLastTakenAt(m.lastTakenAt);
      migrated.push({
        id: key,
        name: label,
        intervalHours: DEFAULT_MEDICINE_INTERVAL_HOURS,
        lastTakenAt,
        takenAtLog: lastTakenAt ? [lastTakenAt] : [],
      });
    }
    return migrated;
  }

  return [];
}
