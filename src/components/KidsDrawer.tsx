import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
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
import type { KidState } from "../types";

type KidsDrawerProps = {
  visible: boolean;
  kids: KidState[];
  activeKidId: string;
  onClose: () => void;
  onSelectKid: (id: string) => void;
  onRequestAddKid: () => void;
  onRemoveKid: (id: string) => void;
};

export function KidsDrawer({
  visible,
  kids,
  activeKidId,
  onClose,
  onSelectKid,
  onRequestAddKid,
  onRemoveKid,
}: KidsDrawerProps) {
  const insets = useSafeAreaInsets();
  const canDelete = kids.length > 1;

  const confirmRemove = (kid: KidState) => {
    if (!canDelete) return;
    Alert.alert(
      "Delete kid?",
      `Remove ${kid.name} and all of their feed, medicine, and diaper history? This can’t be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onRemoveKid(kid.id),
        },
      ],
    );
  };

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
          accessibilityLabel="Close kids menu"
        />
        <View
          style={[
            styles.drawer,
            {
              paddingTop: Math.max(insets.top, 16) + 8,
              paddingBottom: Math.max(insets.bottom, 16) + 8,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Kids</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && styles.pressed,
              ]}
              hitSlop={8}
            >
              <Ionicons name="close" size={22} color={colors.inkMuted} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          >
            {kids.map((kid) => {
              const active = kid.id === activeKidId;
              return (
                <View key={kid.id} style={styles.row}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={
                      active ? `${kid.name}, selected` : `View ${kid.name}`
                    }
                    onPress={() => {
                      onSelectKid(kid.id);
                      onClose();
                    }}
                    style={({ pressed }) => [
                      styles.kidBtn,
                      active && styles.kidBtnActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[styles.kidName, active && styles.kidNameActive]}
                      numberOfLines={1}
                    >
                      {kid.name}
                    </Text>
                    {active ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={colors.accent}
                      />
                    ) : null}
                  </Pressable>
                  {canDelete ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${kid.name}`}
                      onPress={() => confirmRemove(kid)}
                      style={({ pressed }) => [
                        styles.deleteBtn,
                        pressed && styles.pressed,
                      ]}
                      hitSlop={6}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={colors.warn}
                      />
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add kid"
            onPress={onRequestAddKid}
            style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
          >
            <Ionicons name="add" size={22} color={colors.white} />
            <Text style={styles.addBtnText}>Add kid</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(20, 36, 31, 0.45)",
  },
  drawer: {
    width: "78%",
    maxWidth: 320,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    zIndex: 1,
    ...Platform.select({
      web: {
        boxShadow: "8px 0 32px rgba(20, 36, 31, 0.18)",
      },
      default: {
        shadowColor: colors.ink,
        shadowOffset: { width: 8, height: 0 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 12,
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.6,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.medStatBg,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 8,
    paddingBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  kidBtn: {
    flex: 1,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: radius.control,
    backgroundColor: colors.medStatBg,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  kidBtnActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  kidName: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 17,
    color: colors.ink,
  },
  kidNameActive: {
    fontFamily: fonts.bodySemiBold,
    color: colors.accentDeep,
  },
  deleteBtn: {
    width: 44,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.control,
  },
  addBtn: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: radius.control,
    backgroundColor: colors.accent,
    marginTop: 4,
  },
  addBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16.8,
    color: colors.white,
  },
  pressed: {
    opacity: 0.78,
  },
});
