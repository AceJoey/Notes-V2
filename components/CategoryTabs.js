import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

function getStyles(theme) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f3f4f6',
    },
    fixedButton: {
      marginHorizontal: 8,
      zIndex: 2,
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 0,
      flexDirection: 'row',
      alignItems: 'center',
    },
    tab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      minWidth: 60,
      alignItems: 'center',
    },
    selectedTab: {
      transform: [{ scale: 1.05 }],
      borderWidth: 2,
      borderColor: '#3b82f6',
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme === 'dark' ? '#fff' : '#222',
    },
    selectedTabText: {
      fontWeight: '600',
    },
    editTab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme === 'dark' ? '#3a3a3a' : '#e5e7eb',
      alignItems: 'center',
    },
    editTabText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#3b82f6',
    },
    allTab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: '#3b82f6',
      alignItems: 'center',
      marginRight: 8,
    },
    allTabText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
    },
  });
}

export default function CategoryTabs({ categories, selectedCategory, onCategorySelect, onEditPress }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const scrollViewRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [beltWidth, setBeltWidth] = useState(0);
  
  const allCategory = categories.find(cat => cat.id === 'all');
  const otherCategories = categories.filter(cat => cat.id !== 'all');
  
  // Remove infinite scroll: only use otherCategories
  const visibleCategories = otherCategories;
  const categoryWidth = 80; // Approximate width of each category bubble
  const totalCategories = visibleCategories.length;
  // No centerOffset needed

  useEffect(() => {
    // Set initial scroll position to center
    if (scrollViewRef.current && contentWidth > 0) {
      // No centerOffset needed
    }
  }, [contentWidth]);

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    setScrollPosition(offsetX);
    
    // Reset scroll position when reaching edges for infinite effect
    // Only apply infinite scroll logic on mobile platforms
    // No infinite scroll logic needed
  };

  // Handle press on the belt
  const handleBeltPress = (event) => {
    // Get tap position relative to the belt
    const tapX = event.nativeEvent.locationX;
    // Calculate which bubble is at that position
    // Account for current scroll offset
    const index = Math.floor((scrollPosition + tapX) / categoryWidth);
    const safeIndex = Math.max(0, Math.min(index, visibleCategories.length - 1));
    const category = visibleCategories[safeIndex];
    if (category && category.id) {
      onCategorySelect(category.id);
    }
  };

  const handleContentLayout = (event) => {
    setContentWidth(event.nativeEvent.layout.width);
  };

  // Platform-specific ScrollView props
  const getScrollViewProps = () => {
    const baseProps = {
      ref: scrollViewRef,
      horizontal: true,
      showsHorizontalScrollIndicator: false,
      contentContainerStyle: styles.scrollContent,
      onScroll: handleScroll,
      scrollEventThrottle: 16,
      onLayout: handleContentLayout,
      keyboardShouldPersistTaps: "handled",
      overScrollMode: "never",
      bounces: false,
    };

    // Add platform-specific props
    if (Platform.OS === 'web') {
      return {
        ...baseProps,
        decelerationRate: "normal",
      };
    } else {
      return {
        ...baseProps,
        decelerationRate: "fast",
        snapToInterval: categoryWidth + 8,
        snapToAlignment: "center",
      };
    }
  };

  return (
    <View style={styles.container}>
      {/* Fixed All button */}
      <TouchableOpacity
        style={[styles.allTab, styles.fixedButton, selectedCategory === 'all' && styles.selectedTab]}
        onPress={() => onCategorySelect('all')}
        activeOpacity={0.7}
      >
        <Text style={styles.allTabText}>All</Text>
      </TouchableOpacity>

      {/* Infinite scrollable categories as a pressable belt */}
      <View style={styles.scrollContainer} onLayout={e => setBeltWidth(e.nativeEvent.layout.width)}>
        <Pressable style={{ flex: 1 }} onPress={handleBeltPress}>
          <ScrollView {...getScrollViewProps()} pointerEvents="none">
            {visibleCategories.map((category, index) => (
              <View
                key={`cat-${index}-${category.name}`}
                style={[
                  styles.tab,
                  { backgroundColor: category.color },
                  selectedCategory === category.id && styles.selectedTab
                ]}
              >
                <Text style={[
                  styles.tabText,
                  selectedCategory === category.id && styles.selectedTabText
                ]}>
                  {category.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </View>

      {/* Fixed Edit button */}
      <TouchableOpacity
        style={[styles.editTab, styles.fixedButton]}
        onPress={onEditPress}
        activeOpacity={0.7}
      >
        <Text style={styles.editTabText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );
}