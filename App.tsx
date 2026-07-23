import { Fraunces_600SemiBold } from "@expo-google-fonts/fraunces";
import {
  SourceSans3_400Regular,
  SourceSans3_500Medium,
  SourceSans3_600SemiBold,
} from "@expo-google-fonts/source-sans-3";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { DiaperLogsScreen } from "./src/components/DiaperLogsScreen";
import { DiaperPanel } from "./src/components/DiaperPanel";
import { FeedLogsScreen } from "./src/components/FeedLogsScreen";
import { FeedPanel } from "./src/components/FeedPanel";
import { IntervalSettings } from "./src/components/IntervalSettings";
import { MedicinePanel } from "./src/components/MedicinePanel";
import { SettingsScreen } from "./src/components/SettingsScreen";
import { useAppState, type UseAppStateResult } from "./src/hooks/useAppState";
import { colors, fonts } from "./src/theme";

type Screen = "home" | "feedLogs" | "diaperLogs" | "settings";

function HomeScreen({
  app,
  onSeeMoreFeeds,
  onSeeMoreDiapers,
  onOpenSettings,
}: {
  app: UseAppStateResult;
  onSeeMoreFeeds: () => void;
  onSeeMoreDiapers: () => void;
  onOpenSettings: () => void;
}) {
  const {
    state,
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
  } = app;
  const { visiblePanels } = state;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.brandRow}>
        <View style={styles.brand}>
          <Text style={styles.brandTitle}>Nest</Text>
          <Text style={styles.brandTagline}>
            Feeding & medicine, for the long nights.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          onPress={onOpenSettings}
          style={({ pressed }) => [
            styles.settingsBtn,
            pressed && styles.settingsBtnPressed,
          ]}
          hitSlop={8}
        >
          <Ionicons name="settings-outline" size={22} color={colors.brand} />
        </Pressable>
      </View>

      {visiblePanels.feed ? (
        <FeedPanel
          state={state}
          timerLabel={timerLabel}
          onToggleSession={toggleSession}
          onToggleSide={toggleSide}
          onDeleteFeed={deleteLoggedFeed}
          onSeeMoreFeeds={onSeeMoreFeeds}
        />
      ) : null}

      {visiblePanels.motherMedicine ? (
        <MedicinePanel
          title="Mom's medicine"
          medicines={state.motherMedicines}
          onTake={(id) => takeMed("mother", id)}
          onAdd={(name, hours) => addMed("mother", name, hours)}
          onRemove={(id) => removeMed("mother", id)}
        />
      ) : null}

      {visiblePanels.babyMedicine ? (
        <MedicinePanel
          title="Baby's medicine"
          medicines={state.babyMedicines}
          onTake={(id) => takeMed("baby", id)}
          onAdd={(name, hours) => addMed("baby", name, hours)}
          onRemove={(id) => removeMed("baby", id)}
        />
      ) : null}

      {visiblePanels.diaper ? (
        <DiaperPanel
          diapers={state.diapers}
          onLog={logDiaperChange}
          onDelete={deleteLoggedDiaper}
          onSeeMoreDiapers={onSeeMoreDiapers}
        />
      ) : null}

      {visiblePanels.interval ? (
        <IntervalSettings
          intervalHours={state.feedIntervalHours}
          onDown={intervalDown}
          onUp={intervalUp}
        />
      ) : null}
    </ScrollView>
  );
}

function AppContent() {
  const [screen, setScreen] = useState<Screen>("home");
  const app = useAppState();

  if (!app.ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  if (screen === "feedLogs") {
    return (
      <FeedLogsScreen
        feeds={app.state.feeds}
        onBack={() => setScreen("home")}
        onDeleteFeed={app.deleteLoggedFeed}
      />
    );
  }

  if (screen === "diaperLogs") {
    return (
      <DiaperLogsScreen
        diapers={app.state.diapers}
        onBack={() => setScreen("home")}
        onDeleteDiaper={app.deleteLoggedDiaper}
      />
    );
  }

  if (screen === "settings") {
    return (
      <SettingsScreen
        visiblePanels={app.state.visiblePanels}
        onBack={() => setScreen("home")}
        onSetPanelVisible={app.setPanelVisible}
      />
    );
  }

  return (
    <HomeScreen
      app={app}
      onSeeMoreFeeds={() => setScreen("feedLogs")}
      onSeeMoreDiapers={() => setScreen("diaperLogs")}
      onOpenSettings={() => setScreen("settings")}
    />
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    SourceSans3_400Regular,
    SourceSans3_500Medium,
    SourceSans3_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={[styles.root, styles.loading]}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <LinearGradient
          colors={[colors.bgTop, colors.bgMid, colors.bgBottom]}
          locations={[0, 0.28, 0.72]}
          style={styles.root}
        >
          <StatusBar style="light" />
          <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
            <View style={styles.shell}>
              <AppContent />
            </View>
          </SafeAreaView>
        </LinearGradient>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  shell: {
    flex: 1,
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgTop,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 17.6,
    paddingTop: 6.4,
    paddingBottom: 28,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 22.4,
  },
  brand: {
    flex: 1,
    paddingHorizontal: 2.4,
  },
  brandTitle: {
    fontFamily: fonts.display,
    fontSize: Platform.OS === "web" ? 48 : 44,
    color: colors.brand,
    letterSpacing: -1.2,
    lineHeight: Platform.OS === "web" ? 52 : 48,
  },
  brandTagline: {
    marginTop: 7.2,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.brandMuted,
  },
  settingsBtn: {
    marginTop: 8,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(242, 247, 244, 0.12)",
  },
  settingsBtnPressed: {
    opacity: 0.7,
  },
});
