import React, { useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useTheme, PRIMARY_COLOR } from '../theme/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PULL_THRESHOLD = 120;

interface VaultPullGestureProps {
  children: React.ReactNode;
  onVaultTrigger: () => void;
}

function getStyles(theme: string) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    pullIndicator: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 100,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
      zIndex: 10,
    },
    pullText: {
      fontSize: 16,
      fontWeight: '600',
      color: PRIMARY_COLOR,
      textAlign: 'center',
    },
    pullSubtext: {
      fontSize: 14,
      color: theme === 'dark' ? '#666' : '#888',
      textAlign: 'center',
      marginTop: 4,
    },
  });
}

export default function VaultPullGesture({ children, onVaultTrigger }: VaultPullGestureProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const translateY = useSharedValue(0);
  const pullDistance = useSharedValue(0);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      // Reset values
    },
    onActive: (event) => {
      if (event.translationY > 0) {
        pullDistance.value = event.translationY;
        translateY.value = Math.min(event.translationY * 0.5, PULL_THRESHOLD);
      }
    },
    onEnd: (event) => {
      if (pullDistance.value > PULL_THRESHOLD) {
        runOnJS(onVaultTrigger)();
      }
      
      translateY.value = withSpring(0);
      pullDistance.value = withSpring(0);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const indicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      pullDistance.value,
      [0, 50, PULL_THRESHOLD],
      [0, 0.7, 1],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      pullDistance.value,
      [0, PULL_THRESHOLD],
      [0.8, 1.1],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const getPullText = () => {
    return pullDistance.value > PULL_THRESHOLD ? 'Release to open vault' : 'Pull down to access vault';
  };

  return (
    <View style={styles.container}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.container, animatedStyle]}>
          <Animated.View style={[styles.pullIndicator, indicatorStyle]}>
            <Text style={styles.pullText}>
              {pullDistance.value > PULL_THRESHOLD ? 'Release to open vault' : 'Pull down to access vault'}
            </Text>
            <Text style={styles.pullSubtext}>
              Secure vault access
            </Text>
          </Animated.View>
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}