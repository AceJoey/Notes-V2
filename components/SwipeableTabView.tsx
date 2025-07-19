import React, { useState } from 'react';
import { View, Dimensions, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SwipeableTabViewProps {
  children: React.ReactNode[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export default function SwipeableTabView({ children, currentIndex, onIndexChange }: SwipeableTabViewProps) {
  const [scrollViewRef, setScrollViewRef] = useState<ScrollView | null>(null);

  React.useEffect(() => {
    if (scrollViewRef) {
      scrollViewRef.scrollTo({ x: currentIndex * SCREEN_WIDTH, animated: true });
    }
  }, [currentIndex, scrollViewRef]);

  const handleMomentumScrollEnd = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    const newIndex = Math.round(contentOffset.x / SCREEN_WIDTH);
    if (newIndex !== currentIndex) {
      onIndexChange(newIndex);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={setScrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.scrollView}
      >
        {children.map((child, index) => (
          <View key={index} style={styles.page}>
            {child}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
});