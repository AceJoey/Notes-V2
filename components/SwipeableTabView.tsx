import React, { useRef, useState } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SwipeableTabViewProps {
  children: React.ReactNode[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export default function SwipeableTabView({ children, currentIndex, onIndexChange }: SwipeableTabViewProps) {
  const translateX = useSharedValue(-currentIndex * SCREEN_WIDTH);
  const [activeIndex, setActiveIndex] = useState(currentIndex);

  React.useEffect(() => {
    translateX.value = withSpring(-currentIndex * SCREEN_WIDTH);
    setActiveIndex(currentIndex);
  }, [currentIndex]);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
    },
    onEnd: (event) => {
      const shouldMoveToNext = event.translationX < -SCREEN_WIDTH / 3 && activeIndex < children.length - 1;
      const shouldMoveToPrev = event.translationX > SCREEN_WIDTH / 3 && activeIndex > 0;

      if (shouldMoveToNext) {
        const newIndex = Math.min(activeIndex + 1, children.length - 1);
        translateX.value = withSpring(-newIndex * SCREEN_WIDTH);
        runOnJS(onIndexChange)(newIndex);
      } else if (shouldMoveToPrev) {
        const newIndex = Math.max(activeIndex - 1, 0);
        translateX.value = withSpring(-newIndex * SCREEN_WIDTH);
        runOnJS(onIndexChange)(newIndex);
      } else {
        translateX.value = withSpring(-activeIndex * SCREEN_WIDTH);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View style={styles.container}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.contentContainer, animatedStyle]}>
          {children.map((child, index) => (
            <View key={index} style={styles.page}>
              {child}
            </View>
          ))}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  contentContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
});