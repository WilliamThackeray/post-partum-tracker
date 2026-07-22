import { Fraunces_600SemiBold } from "@expo-google-fonts/fraunces";
import {
  SourceSans3_400Regular,
  SourceSans3_500Medium,
  SourceSans3_600SemiBold,
} from "@expo-google-fonts/source-sans-3";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { FeedPanel } from "./src/components/FeedPanel";
import { IntervalSettings } from "./src/components/IntervalSettings";
import { MedicineCard } from "./src/components/MedicineCard";
import { useAppState } from "./src/hooks/useAppState";
import { panelShadow } from "./src/shadow";
import { colors, fonts } from "./src/theme";
import type { MedicineKey } from "./src/types";

const MEDICINE_KEYS: MedicineKey[] = ["ibuprofen", "tylenol"];

function AppContent() {
  const {
    ready,
    state,
    selectedSide,
    timerLabel,
    selectSide,
    markSchedule,
    startTimer,
    endTimer,
    takeMed,
    intervalDown,
    intervalUp,
  } = useAppState();

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

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
        selectedSide={selectedSide}
        timerLabel={timerLabel}
        onSelectSide={selectSide}
        onMarkSchedule={markSchedule}
        onStartTimer={startTimer}
        onEndTimer={endTimer}
      />

      <View style={styles.panel}>
        <Text style={styles.panelHeading}>Medicine</Text>
        {MEDICINE_KEYS.map((key, index) => (
          <MedicineCard
            key={key}
            medicineKey={key}
            medicine={state.medicines[key]}
            onTake={takeMed}
            isFirst={index === 0}
          />
        ))}
      </View>

      <IntervalSettings
        intervalHours={state.feedIntervalHours}
        onDown={intervalDown}
        onUp={intervalUp}
      />
    </ScrollView>
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
  panel: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: 17.6,
    paddingTop: 18.4,
    paddingBottom: 20,
    marginBottom: 16,
    ...panelShadow,
  },
  panelHeading: {
    marginBottom: 13.6,
    fontFamily: fonts.display,
    fontSize: 21.6,
    color: colors.ink,
    letterSpacing: -0.4,
  },
});
