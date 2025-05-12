import React from "react";
import { Text, StyleSheet } from "react-native";

interface FormLabelProps {
  children: React.ReactNode;
  required?: boolean;
}

const FormLabel: React.FC<FormLabelProps> = ({ children, required }) => (
  <Text style={styles.label}>
    {children}
    {required && <Text style={styles.required}> *</Text>}
  </Text>
);

const styles = StyleSheet.create({
  label: {
    marginBottom: 5,
    fontWeight: "bold",
    color: "#1d79b9",
    fontSize: 16,
  },
  required: {
    color: "#eb8a53",
  },
});

export default FormLabel;