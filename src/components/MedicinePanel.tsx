import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { panelShadow } from "../shadow";
import { colors, fonts, radius } from "../theme";
import type { Medicine } from "../types";
import { AddMedicineSheet } from "./AddMedicineSheet";
import { MedicineCard } from "./MedicineCard";

type MedicinePanelProps = {
  title: string;
  medicines: Medicine[];
  onTake: (id: string) => void;
  onAdd: (name: string, intervalHours: number) => void;
  onRemove: (id: string) => void;
};

export function MedicinePanel({
  title,
  medicines,
  onTake,
  onAdd,
  onRemove,
}: MedicinePanelProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const list = Array.isArray(medicines) ? medicines.filter(Boolean) : [];

  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>{title}</Text>

      {list.length === 0 ? (
        <Text style={styles.empty}>No medicines yet. Add one to get started.</Text>
      ) : (
        list.map((medicine, index) => (
          <MedicineCard
            key={medicine.id}
            medicine={medicine}
            onTake={onTake}
            onRemove={onRemove}
            isFirst={index === 0}
          />
        ))
      )}

      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
        onPress={() => setSheetOpen(true)}
      >
        <Text style={styles.addBtnText}>Add medicine</Text>
      </Pressable>

      <AddMedicineSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAdd={onAdd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.panel,
    paddingHorizontal: 17.6,
    paddingTop: 18.4,
    paddingBottom: 20,
    marginBottom: 16,
    ...panelShadow,
  },
  heading: {
    marginBottom: 13.6,
    fontFamily: fonts.display,
    fontSize: 21.6,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  empty: {
    marginBottom: 16,
    fontFamily: fonts.body,
    fontSize: 15.2,
    color: colors.inkMuted,
  },
  addBtn: {
    marginTop: 8,
    minHeight: 52,
    borderRadius: radius.control,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
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
