import { Platform, type ViewStyle } from "react-native";
import { colors } from "./theme";

export const panelShadow: ViewStyle =
  Platform.OS === "web"
    ? ({
        boxShadow: "0 12px 40px rgba(20, 36, 31, 0.12)",
      } as ViewStyle)
    : {
        shadowColor: colors.ink,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 4,
      };
