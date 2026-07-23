import { Fraunces_600SemiBold } from "@expo-google-fonts/fraunces";
import {
  SourceSans3_400Regular,
  SourceSans3_500Medium,
  SourceSans3_600SemiBold,
} from "@expo-google-fonts/source-sans-3";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { FeedLogsScreen } from "./src/components/FeedLogsScreen";
import { FeedPanel } from "./src/components/FeedPanel";
import { IntervalSettings } from "./src/components/IntervalSettings";
import { MedicinePanel } from "./src/components/MedicinePanel";
import { useAppState, type UseAppStateResult } from "./src/hooks/useAppState";
import { colors, fonts } from "./src/theme";

type Screen = "home" | "feedLogs";

function HomeScreen({
  app,
  onSeeMoreFeeds,
}: {
  app: UseAppStateResult;
  onSeeMoreFeeds: () => void;
}) {
  const {
    state,
    timerLabel,
    toggleSession,
    toggleSide,
    takeMed,
    addMed,
    removeMed,
    intervalDown,
    intervalUp,
  } = app;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.brand}>
        <Text style={styles.brandTitle}>Nest</Text>
        <Text style={styles.brandTagline}>
          Feeding & medicine, for the long nights.
        </Text>
      </View>

      <FeedPanel
        state={state}
        timerLabel={timerLabel}
        onToggleSession={toggleSession}
        onToggleSide={toggleSide}
        onSeeMoreFeeds={onSeeMoreFeeds}
      />

      <MedicinePanel
        medicines={state.medicines}
        onTake={takeMed}
        onAdd={addMed}
        onRemove={removeMed}
      />

      <IntervalSettings
        intervalHours={state.feedIntervalHours}
        onDown={intervalDown}
        onUp={intervalUp}
      />
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
      />
    );
  }

  return (
    <HomeScreen app={app} onSeeMoreFeeds={() => setScreen("feedLogs")} />
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
  brand: {
    paddingHorizontal: 2.4,
    paddingBottom: 22.4,
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
});
