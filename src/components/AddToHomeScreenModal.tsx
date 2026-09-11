import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radius } from "../theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type AddToHomeScreenModalProps = {
  visible: boolean;
  onClose: () => void;
};

function installPlatform(): "ios" | "android" {
  if (Platform.OS === "android") return "android";
  if (Platform.OS === "ios") return "ios";
  if (typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent)) {
    return "android";
  }
  return "ios";
}

function IconChip({ name }: { name: IoniconName }) {
  return (
    <View style={styles.iconChip} accessibilityElementsHidden>
      <Ionicons name={name} size={16} color={colors.ink} />
    </View>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepNum}>{n}.</Text>
      <View style={styles.stepBody}>{children}</View>
    </View>
  );
}

function StepText({ children }: { children: ReactNode }) {
  return <Text style={styles.stepText}>{children}</Text>;
}

function StepEmph({ children }: { children: ReactNode }) {
  return <Text style={styles.stepEmph}>{children}</Text>;
}

function IosSteps() {
  return (
    <>
      <Step n={1}>
        <StepText>Tap </StepText>
        <IconChip name="share-outline" />
        <StepText> on the navigation bar</StepText>
      </Step>
      <Step n={2}>
        <StepText>Tap </StepText>
        <IconChip name="chevron-down-circle-outline" />
        <StepEmph> View More</StepEmph>
      </Step>
      <Step n={3}>
        <StepText>Scroll down and tap </StepText>
        <IconChip name="add-outline" />
        <StepEmph> Add to Home Screen</StepEmph>
      </Step>
      <Step n={4}>
        <StepText>Name the app and tap </StepText>
        <StepEmph>Add</StepEmph>
      </Step>
    </>
  );
}

function AndroidSteps() {
  return (
    <>
      <Step n={1}>
        <StepText>Tap </StepText>
        <IconChip name="ellipsis-vertical" />
        <StepText> in the browser menu</StepText>
      </Step>
      <Step n={2}>
        <StepText>Tap </StepText>
        <IconChip name="add-outline" />
        <StepEmph> Add to Home screen</StepEmph>
      </Step>
      <Step n={3}>
        <StepText>Name the app and tap </StepText>
        <StepEmph>Add</StepEmph>
      </Step>
    </>
  );
}

export function AddToHomeScreenModal({
  visible,
  onClose,
}: AddToHomeScreenModalProps) {
  const insets = useSafeAreaInsets();
  const platform = installPlatform();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        />
        <View
          style={[
            styles.card,
            {
              marginTop: Math.max(insets.top, 16),
              marginBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [
              styles.closeBtn,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="close" size={22} color={colors.inkMuted} />
          </Pressable>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.title}>Add Nest to Your Home Screen</Text>

            <View style={styles.appCard}>
              <Image
                source={require("../../assets/icon.png")}
                style={styles.appIcon}
                accessibilityIgnoresInvertColors
              />
              <View style={styles.appText}>
                <Text style={styles.appName}>Nest</Text>
                <Text style={styles.appTagline}>
                  Feeds, meds, and diapers in one place
                </Text>
              </View>
            </View>

            <View style={styles.steps}>
              {platform === "android" ? <AndroidSteps /> : <IosSteps />}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Got it"
              onPress={onClose}
              style={({ pressed }) => [
                styles.doneBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.doneBtnText}>Got it</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(20, 36, 31, 0.45)",
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 18,
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
    maxHeight: "92%",
    ...Platform.select({
      web: {
        boxShadow: "0 16px 48px rgba(20, 36, 31, 0.22)",
      },
      default: {
        shadowColor: colors.ink,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 16,
      },
    }),
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 1,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.6,
    lineHeight: 34,
    textAlign: "center",
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  appCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.medStatBg,
    borderRadius: radius.panel,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 22,
  },
  appIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  appText: {
    flex: 1,
  },
  appName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 17,
    color: colors.ink,
  },
  appTagline: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
    lineHeight: 18,
  },
  steps: {
    gap: 16,
    paddingHorizontal: 4,
    marginBottom: 22,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  stepNum: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 17,
    color: colors.ink,
    lineHeight: 26,
    minWidth: 20,
  },
  stepBody: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  stepText: {
    fontFamily: fonts.body,
    fontSize: 17,
    color: colors.ink,
    lineHeight: 26,
  },
  stepEmph: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 17,
    color: colors.ink,
    lineHeight: 26,
  },
  iconChip: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  doneBtn: {
    minHeight: 52,
    borderRadius: radius.control,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16.8,
    color: colors.white,
  },
  pressed: {
    opacity: 0.75,
  },
});
