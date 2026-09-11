import type { LiveActivity } from "expo-widgets";
import type { AppState, KidState } from "../types";
import FeedingActivity, {
  type FeedingActivityProps,
} from "./FeedingActivity";

/** Ignore stale syncs when state changes quickly. */
let syncGeneration = 0;

const instances = new Map<string, LiveActivity<FeedingActivityProps>>();
const lastPropsJson = new Map<string, string>();

function propsFromKid(kid: KidState): FeedingActivityProps {
  const session = kid.activeSession!;
  let leftTotalMs = 0;
  let rightTotalMs = 0;
  for (const segment of session.segments) {
    if (segment.side === "left") leftTotalMs += segment.durationMs;
    else rightTotalMs += segment.durationMs;
  }

  return {
    kidId: kid.id,
    kidName: kid.name,
    side: session.activeSegment?.side ?? null,
    segmentStartedAt: session.activeSegment?.startedAt ?? null,
    sessionStartedAt: session.startedAt,
    leftTotalMs,
    rightTotalMs,
  };
}

/**
 * Start / update / end iOS Live Activities to match active feeding sessions.
 * Call only from a development build with expo-widgets native code.
 */
export async function syncFeedingLiveActivityImpl(
  state: AppState,
): Promise<void> {
  const generation = ++syncGeneration;

  // After JS reload our map is empty but ActivityKit may still have activities.
  if (instances.size === 0) {
    for (const orphan of FeedingActivity.getInstances()) {
      await orphan.end("immediate");
      if (generation !== syncGeneration) return;
    }
  }

  const desired = new Map<string, FeedingActivityProps>();
  for (const kid of state.kids) {
    if (!kid.activeSession) continue;
    desired.set(kid.id, propsFromKid(kid));
  }

  for (const [kidId, instance] of [...instances.entries()]) {
    if (desired.has(kidId)) continue;
    await instance.end("immediate");
    instances.delete(kidId);
    lastPropsJson.delete(kidId);
    if (generation !== syncGeneration) return;
  }

  for (const [kidId, props] of desired) {
    const serialized = JSON.stringify(props);
    const existing = instances.get(kidId);

    if (!existing) {
      const started = FeedingActivity.start(props);
      instances.set(kidId, started);
      lastPropsJson.set(kidId, serialized);
    } else if (lastPropsJson.get(kidId) !== serialized) {
      await existing.update(props);
      lastPropsJson.set(kidId, serialized);
    }

    if (generation !== syncGeneration) return;
  }
}
