import React from "react";
import { TextInput, StyleSheet, KeyboardTypeOptions } from "react-native";

interface FormInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  maxLength?: number;
}

export default function FormInput({
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "none",
  maxLength,
}: FormInputProps) {
  return (
    <TextInput
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      style={styles.input}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      maxLength={maxLength}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 50,
    borderColor: "#e0e0e0",
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: "#fff",
  },
});