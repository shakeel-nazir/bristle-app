import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const COLORS = ['#E8734A', '#F2A15B', '#D65B8A', '#3F8557', '#4A7FE8', '#F2C94C'];
const PARTICLE_COUNT = 18;

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export default function Confetti({ trigger }) {
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }).map(() => ({
      progress: new Animated.Value(0),
      angle: randomBetween(0, Math.PI * 2),
      distance: randomBetween(70, 150),
      size: randomBetween(6, 11),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: randomBetween(-360, 360),
      delay: randomBetween(0, 120),
    })),
  ).current;

  useEffect(() => {
    if (!trigger) return;
    const animations = particles.map((p) =>
      Animated.timing(p.progress, {
        toValue: 1,
        duration: 900,
        delay: p.delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    Animated.stagger(10, animations).start();
  }, [trigger, particles]);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((p, i) => {
        const translateX = p.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(p.angle) * p.distance],
        });
        const translateY = p.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(p.angle) * p.distance - 20],
        });
        const opacity = p.progress.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [1, 1, 0],
        });
        const rotate = p.progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.rotation}deg`],
        });
        const scale = p.progress.interpolate({
          inputRange: [0, 0.2, 1],
          outputRange: [0, 1, 0.8],
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: p.size / 3,
                opacity,
                transform: [{ translateX }, { translateY }, { rotate }, { scale }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
  },
});
