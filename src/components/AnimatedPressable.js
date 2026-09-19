import React, { useRef } from 'react';
import { Animated, Pressable } from 'react-native';

export default function AnimatedPressable({
  style,
  children,
  onPress,
  onPressIn,
  onPressOut,
  scaleTo = 0.94,
  disabled,
  ...rest
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e) => {
    Animated.spring(scale, {
      toValue: scaleTo,
      speed: 50,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e) => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 20,
      bounciness: 10,
      useNativeDriver: true,
    }).start();
    onPressOut?.(e);
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      {...rest}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
