// components/OrangeCirclesFooter.js
import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";

const OrangeCirclesFooter = () => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 2000 });
    scale.value = withTiming(1, { 
      duration: 1200, 
      easing: Easing.elastic(1.2) 
    });
  }, []);
  
  const animatedCircleStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  
  return (
    <View style={styles.footerContainer}>
      {/* Círculo superior central */}
      <Animated.View 
        style={[
          styles.circle, 
          styles.darkOrange, 
          animatedCircleStyle, 
          { 
            top: 25, 
            alignSelf: 'center', 
            width: 30, 
            height: 30 
          }
        ]} 
      />
      
      {/* Círculos del lado izquierdo */}
      <Animated.View style={[styles.circle, styles.mediumOrange, animatedCircleStyle, { left: '2%', bottom: -130, width: 170, height: 170 }]} />
      <Animated.View style={[styles.circle, styles.darkOrange, animatedCircleStyle, { left: '15%', bottom: -55, width: 120, height: 120 }]} />
      <Animated.View style={[styles.circle, styles.lightOrange, animatedCircleStyle, { left: '22%', bottom: -95, width: 130, height: 130 }]} />

      {/* Círculos del lado derecho */}
      <Animated.View style={[styles.circle, styles.lightOrange, animatedCircleStyle, { right: '22%', bottom: -95, width: 130, height: 130 }]} />
      <Animated.View style={[styles.circle, styles.darkOrange, animatedCircleStyle, { right: '10%', bottom: -55, width: 120, height: 120 }]} />
      <Animated.View style={[styles.circle, styles.mediumOrange, animatedCircleStyle, { right: '-2%', bottom: -100, width: 130, height: 130 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 0,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
  },
  lightOrange: {
    backgroundColor: '#fea26d',
  },
  mediumOrange: {
    backgroundColor: '#e99768',
  },
  darkOrange: {
    backgroundColor: '#eb8a53',
  },
});

export default OrangeCirclesFooter;