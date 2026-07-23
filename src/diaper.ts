import { createId } from "./id";
import type { AppState, DiaperChange, DiaperKind } from "./types";

export const MAX_DIAPERS = 40;

export function diaperKind(change: DiaperChange): DiaperKind {
  if (change.wet && change.messy) return "both";
  if (change.messy) return "messy";
  return "wet";
}

export function formatDiaperKind(kind: DiaperKind): string {
  if (kind === "both") return "Wet & messy";
  if (kind === "messy") return "Messy";
  return "Wet";
}

export function logDiaper(state: AppState, kind: DiaperKind): AppState {
  const entry: DiaperChange = {
    id: createId("diaper"),
    changedAt: new Date().toISOString(),
    wet: kind === "wet" || kind === "both",
    messy: kind === "messy" || kind === "both",
  };

  return {
    ...state,
    diapers: [entry, ...state.diapers].slice(0, MAX_DIAPERS),
  };
}

export function deleteDiaper(state: AppState, id: string): AppState {
  const diapers = state.diapers.filter((d) => d.id !== id);
  if (diapers.length === state.diapers.length) return state;
  return { ...state, diapers };
}

export function parseDiapers(value: unknown): DiaperChange[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): DiaperChange | null => {
      if (!item || typeof item !== "object") return null;
      const d = item as Record<string, unknown>;
      if (typeof d.id !== "string") return null;
      if (typeof d.changedAt !== "string" || Number.isNaN(Date.parse(d.changedAt))) {
        return null;
      }
      const wet = d.wet === true;
      const messy = d.messy === true;
      if (!wet && !messy) return null;
      return { id: d.id, changedAt: d.changedAt, wet, messy };
    })
    .filter((d): d is DiaperChange => d !== null)
    .slice(0, MAX_DIAPERS);
}
