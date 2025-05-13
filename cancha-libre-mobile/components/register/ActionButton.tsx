import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ActionButtonProps {
  onPress: () => void;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconPosition?: "left" | "right";
  iconColor?: string;
  iconSize?: number;
}

export default function ActionButton({
  onPress,
  title,
  loading = false,
  disabled = false,
  style,
  textStyle,
  iconName,
  iconPosition = "right",
  iconColor = "white",
  iconSize = 20,
}: ActionButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <>
          {iconName && iconPosition === "left" && (
            <Ionicons name={iconName} size={iconSize} color={iconColor} style={styles.iconLeft} />
          )}
          <Text style={[styles.buttonText, textStyle]}>{title}</Text>
          {iconName && iconPosition === "right" && (
            <Ionicons name={iconName} size={iconSize} color={iconColor} />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
    backgroundColor: "#2f95dc",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
    marginHorizontal: 8,
  },
  iconLeft: {
    marginRight: 8,
  },
});