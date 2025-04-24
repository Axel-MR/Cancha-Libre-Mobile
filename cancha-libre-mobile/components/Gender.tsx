import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";

const Gender = ({ onGenderSelected }: { onGenderSelected: (gender: string) => void }) => {
  const [selectedGender, setSelectedGender] = useState<string>("");

  const handleGenderChange = (gender: string) => {
    setSelectedGender(gender);
    onGenderSelected(gender); // Envía el valor seleccionado al componente padre
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Género:</Text>
      <Picker
        selectedValue={selectedGender}
        onValueChange={handleGenderChange}
        style={styles.picker}
        dropdownIconColor="#1d79b9"
      >
        <Picker.Item label="Seleccione una opción" value="" />
        <Picker.Item label="Femenino" value="Femenino" />
        <Picker.Item label="Masculino" value="Masculino" />
        <Picker.Item label="Otro" value="Otro" />
      </Picker>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    color: "#1d79b9",
    marginBottom: 5,
    fontWeight: "bold",
  },
  picker: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
});

export default Gender;