import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radius } from "../theme";

type AddKidSheetProps = {
  visible: boolean;
  title?: string;
  submitLabel?: string;
  initialName?: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
};

export function AddKidSheet({
  visible,
  title = "Add kid",
  submitLabel = "Save kid",
  initialName = "",
  onClose,
  onSubmit,
}: AddKidSheetProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const canSubmit = Boolean(name.trim());

  useEffect(() => {
    if (!visible) return;
    setName(initialName);
  }, [visible, initialName]);

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(name.trim());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) + 8 },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.cancelBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={submit}
            accessibilityLabel="Kid name"
            autoFocus={Platform.OS !== "web"}
            autoCapitalize="words"
          />

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.addBtn,
              !canSubmit && styles.addBtnDisabled,
              pressed && canSubmit && styles.pressed,
            ]}
            onPress={submit}
            disabled={!canSubmit}
          >
            <Text style={styles.addBtnText}>{submitLabel}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(20, 36, 31, 0.45)",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 10,
    gap: 12,
    maxWidth: 440,
    width: "100%",
    alignSelf: "center",
    ...Platform.select({
      web: {
        boxShadow: "0 -8px 32px rgba(20, 36, 31, 0.18)",
      },
      default: {
        shadowColor: colors.ink,
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 12,
      },
    }),
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.inkMuted,
  },
  input: {
    minHeight: 52,
    borderRadius: radius.control,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.medStatBg,
    paddingHorizontal: 14,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  addBtn: {
    minHeight: 52,
    borderRadius: radius.control,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  addBtnDisabled: {
    opacity: 0.38,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  addBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16.8,
    color: colors.white,
  },
});
