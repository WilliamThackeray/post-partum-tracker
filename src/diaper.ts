import { createId } from "./id";
import type { DiaperChange, DiaperKind, KidState } from "./types";

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

export function logDiaper(kid: KidState, kind: DiaperKind): KidState {
  const entry: DiaperChange = {
    id: createId("diaper"),
    changedAt: new Date().toISOString(),
    wet: kind === "wet" || kind === "both",
    messy: kind === "messy" || kind === "both",
  };

  return {
    ...kid,
    diapers: [entry, ...kid.diapers].slice(0, MAX_DIAPERS),
  };
}

export function deleteDiaper(kid: KidState, id: string): KidState {
  const diapers = kid.diapers.filter((d) => d.id !== id);
  if (diapers.length === kid.diapers.length) return kid;
  return { ...kid, diapers };
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
