import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { panelShadow } from "../shadow";
import { colors, fonts, radius } from "../theme";
import type { BottleFeed } from "../types";
import { BottleLogList } from "./BottleLogList";

type BottleLogsScreenProps = {
  feeds: BottleFeed[];
  onBack: () => void;
  onDeleteFeed: (id: string) => void;
};

export function BottleLogsScreen({
  feeds,
  onBack,
  onDeleteFeed,
}: BottleLogsScreenProps) {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Bottle log</Text>
        <Text style={styles.subtitle}>
          {feeds.length === 0
            ? "No feeds yet"
            : feeds.length === 1
              ? "1 feed"
              : `${feeds.length} feeds`}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.panel}>
          <BottleLogList feeds={feeds} onDelete={onDeleteFeed} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 17.6,
    paddingTop: 6.4,
  },
  header: {
    paddingHorizontal: 2.4,
    paddingBottom: 18,
  },
  backBtn: {
    alignSelf: "flex-start",
    marginBottom: 12,
    paddingVertical: 4,
  },
  backText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.brand,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 36,
    color: colors.brand,
    letterSpacing: -1,
    lineHeight: 40,
  },
  subtitle: {
    marginTop: 6,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.brandMuted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.panel,
    paddingHorizontal: 17.6,
    paddingTop: 8,
    paddingBottom: 12,
    ...panelShadow,
  },
  pressed: {
    opacity: 0.75,
  },
});
