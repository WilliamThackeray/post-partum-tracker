import { createId } from "./id";
import type { AppState, Medicine, MedicineScope } from "./types";

export const DEFAULT_MEDICINE_INTERVAL_HOURS = 8;
export const MIN_MEDICINE_INTERVAL_HOURS = 0.5;
export const MAX_MEDICINE_INTERVAL_HOURS = 24;

const LEGACY_MEDICINE_LABELS: Record<string, string> = {
  ibuprofen: "Ibuprofen",
  tylenol: "Tylenol",
};

function medicinesKey(
  scope: MedicineScope,
): "motherMedicines" | "babyMedicines" {
  return scope === "mother" ? "motherMedicines" : "babyMedicines";
}

export function clampMedicineIntervalHours(hours: number): number {
  if (!Number.isFinite(hours)) return DEFAULT_MEDICINE_INTERVAL_HOURS;
  return Math.min(
    MAX_MEDICINE_INTERVAL_HOURS,
    Math.max(MIN_MEDICINE_INTERVAL_HOURS, hours),
  );
}

export function takeMedicine(
  state: AppState,
  scope: MedicineScope,
  id: string,
): AppState {
  const key = medicinesKey(scope);
  return {
    ...state,
    [key]: state[key].map((med) =>
      med.id === id ? { ...med, lastTakenAt: new Date().toISOString() } : med,
    ),
  };
}

export function addMedicine(
  state: AppState,
  scope: MedicineScope,
  name: string,
  intervalHours: number,
): AppState {
  const trimmed = name.trim();
  if (!trimmed) return state;

  const medicine: Medicine = {
    id: createId("med"),
    name: trimmed,
    intervalHours: clampMedicineIntervalHours(intervalHours),
    lastTakenAt: null,
  };

  const key = medicinesKey(scope);
  return {
    ...state,
    [key]: [...state[key], medicine],
  };
}

export function removeMedicine(
  state: AppState,
  scope: MedicineScope,
  id: string,
): AppState {
  const key = medicinesKey(scope);
  return {
    ...state,
    [key]: state[key].filter((med) => med.id !== id),
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

export function parseMedicines(value: unknown): Medicine[] {
  if (Array.isArray(value)) {
    return value
      .map((item): Medicine | null => {
        if (!item || typeof item !== "object") return null;
        const m = item as Record<string, unknown>;
        if (typeof m.id !== "string" || typeof m.name !== "string") return null;
        const name = m.name.trim();
        if (!name) return null;
        return {
          id: m.id,
          name,
          intervalHours: parseIntervalHours(m.intervalHours),
          lastTakenAt: parseLastTakenAt(m.lastTakenAt),
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
      migrated.push({
        id: key,
        name: label,
        intervalHours: DEFAULT_MEDICINE_INTERVAL_HOURS,
        lastTakenAt: parseLastTakenAt(m.lastTakenAt),
      });
    }
    return migrated;
  }

  return [];
}
