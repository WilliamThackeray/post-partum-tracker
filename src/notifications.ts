import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { nextFeedAt } from "./feed";
import { nextDueAt } from "./medicine";
import type { AppState } from "./types";

const FEED_CHANNEL = "feed-alerts";
const MEDICINE_CHANNEL = "medicine-alerts";

/** Ignore stale syncs when state changes quickly. */
let syncGeneration = 0;

function supported(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

if (supported()) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(FEED_CHANNEL, {
    name: "Feeding alerts",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 120, 250],
  });
  await Notifications.setNotificationChannelAsync(MEDICINE_CHANNEL, {
    name: "Medicine alerts",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 120, 250],
  });
}

/** Request permission if needed. Returns whether alerts can be scheduled. */
export async function ensureNotificationPermissions(): Promise<boolean> {
  if (!supported()) return false;

  await ensureAndroidChannels();

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  return status === "granted";
}

async function scheduleAt(
  date: Date,
  content: Notifications.NotificationContentInput,
): Promise<void> {
  const delayMs = date.getTime() - Date.now();
  // Only schedule future due times; overdue items stay visible in-app.
  if (delayMs < 1000) return;

  await Notifications.scheduleNotificationAsync({
    content,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
}

/**
 * Cancel and reschedule local alerts from current app state.
 * No-ops on web / when permission is missing.
 */
export async function syncAlertsFromState(state: AppState): Promise<void> {
  if (!supported()) return;

  const generation = ++syncGeneration;
  const settings = state.notificationSettings;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (generation !== syncGeneration) return;

    if (!settings.feed && !settings.medicine) return;

    const allowed = await ensureNotificationPermissions();
    if (generation !== syncGeneration) return;
    if (!allowed) return;

    if (settings.feed) {
      for (const kid of state.kids) {
        const next = nextFeedAt(kid);
        if (!next) continue;
        await scheduleAt(next, {
          title: `Time to feed ${kid.name}`,
          body: "Feeding interval is up.",
          sound: true,
          ...(Platform.OS === "android" ? { channelId: FEED_CHANNEL } : {}),
        });
        if (generation !== syncGeneration) return;
      }
    }

    if (settings.medicine) {
      for (const med of state.motherMedicines) {
        if (!med.lastTakenAt) continue;
        await scheduleAt(nextDueAt(med.lastTakenAt, med.intervalHours), {
          title: `Time for ${med.name}`,
          body: "Mom's medicine is due.",
          sound: true,
          ...(Platform.OS === "android" ? { channelId: MEDICINE_CHANNEL } : {}),
        });
        if (generation !== syncGeneration) return;
      }

      for (const kid of state.kids) {
        for (const med of kid.babyMedicines) {
          if (!med.lastTakenAt) continue;
          await scheduleAt(nextDueAt(med.lastTakenAt, med.intervalHours), {
            title: `Time for ${med.name}`,
            body: `${kid.name}'s medicine is due.`,
            sound: true,
            ...(Platform.OS === "android"
              ? { channelId: MEDICINE_CHANNEL }
              : {}),
          });
          if (generation !== syncGeneration) return;
        }
      }
    }
  } catch {
    // Scheduling can fail on simulators / restricted environments — ignore.
  }
}
