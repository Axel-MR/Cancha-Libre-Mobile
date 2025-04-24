// components/LogoTitle.tsx
import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";

interface LogoTitleProps {
  title: string; // Define que title es de tipo string
}

const LogoTitle: React.FC<LogoTitleProps> = ({ title }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-50);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 800 });
    translateY.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.exp),
    });
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.logoContainer, logoStyle]}>
      <Image
        source={require("../assets/images/CanchaLibre_logo.png")}
        style={styles.logo}
      />
      <Text style={styles.titleText}>{title}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 200,
    height: 100,
    resizeMode: "contain",
  },
  titleText: {
    color: "#1d79b9",
    fontWeight: "bold",
    fontSize: 24,
    marginTop: 10,
  },
});

export default LogoTitle;