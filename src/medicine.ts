import type { AppState, MedicineKey } from "./types";

export const MEDICINE_INTERVAL_MS = 8 * 60 * 60 * 1000;

export const MEDICINE_LABELS: Record<MedicineKey, string> = {
  ibuprofen: "Ibuprofen",
  tylenol: "Tylenol",
};

export function takeMedicine(state: AppState, key: MedicineKey): AppState {
  return {
    ...state,
    medicines: {
      ...state.medicines,
      [key]: { lastTakenAt: new Date().toISOString() },
    },
  };
}

export function nextDueAt(lastTakenAt: string): Date {
  return new Date(new Date(lastTakenAt).getTime() + MEDICINE_INTERVAL_MS);
}

export function isOverdue(lastTakenAt: string | null, now = Date.now()): boolean {
  if (!lastTakenAt) return false;
  return nextDueAt(lastTakenAt).getTime() <= now;
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
