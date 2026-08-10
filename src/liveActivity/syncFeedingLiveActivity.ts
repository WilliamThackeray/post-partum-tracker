import { requireOptionalNativeModule } from "expo-modules-core";
import { Platform } from "react-native";
import type { AppState } from "../types";

/**
 * Mirror active feeding sessions onto an iOS Live Activity (lock screen /
 * Dynamic Island). No-ops on non-iOS and when the native module is missing
 * (e.g. Expo Go).
 */
export async function syncFeedingLiveActivity(state: AppState): Promise<void> {
  if (Platform.OS !== "ios") return;
  // Avoid importing expo-widgets at all unless the native module exists.
  // requireNativeModule("ExpoWidgets") throws in Expo Go and surfaces as a redbox
  // even when wrapped in try/catch around a dynamic import.
  if (!requireOptionalNativeModule("ExpoWidgets")) return;

  try {
    const { syncFeedingLiveActivityImpl } = await import(
      "./syncFeedingLiveActivityImpl"
    );
    await syncFeedingLiveActivityImpl(state);
  } catch {
    // ActivityKit unavailable or start/update failed — never break feed logging.
  }
}
