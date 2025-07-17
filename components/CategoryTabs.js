import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';

function getStyles(theme) {
  return StyleSheet.create({
    container: {
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f3f4f6',
    },
    tabsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
    },
    fixedButton: {
      marginHorizontal: 8,
      zIndex: 2,
    },
    scrollContainer: {
      flex: 1,
      position: 'relative',
    },
    scrollContent: {
      paddingHorizontal: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    tab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      minWidth: 80,
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
      color: '#fff',
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
    pointerContainer: {
      position: 'absolute',
      top: -8,
      left: '50%',
      transform: [{ translateX: -6 }],
      zIndex: 10,
    },
    pointer: {
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderBottomWidth: 8,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: '#3b82f6',
    },
  });
}

export default function CategoryTabs({ categories, selectedCategory, onCategorySelect, onEditPress }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const scrollViewRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);
  
  const allCategory = categories.find(cat => cat.id === 'all');
  const otherCategories = categories.filter(cat => cat.id !== 'all');
  
  // Create infinite scroll by tripling the categories
  const infiniteCategories = [...otherCategories, ...otherCategories, ...otherCategories];
  const categoryWidth = 96; // Width + margin
  const totalOriginalWidth = otherCategories.length * categoryWidth;

  useEffect(() => {
    // Set initial scroll position to center (middle set of categories)
    if (scrollViewRef.current && totalOriginalWidth > 0) {
      const centerOffset = totalOriginalWidth;
      scrollViewRef.current.scrollTo({ x: centerOffset, animated: false });
      setScrollPosition(centerOffset);
    }
  }, [totalOriginalWidth, otherCategories.length]);

  const triggerHapticFeedback = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    setScrollPosition(offsetX);
    setIsScrolling(true);
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Set timeout to detect when scrolling stops
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      snapToNearestCategory(offsetX);
    }, 150);
    
    // Reset scroll position when reaching edges for infinite effect
    if (totalOriginalWidth > 0) {
      if (offsetX <= 0) {
        scrollViewRef.current?.scrollTo({ x: totalOriginalWidth, animated: false });
      } else if (offsetX >= totalOriginalWidth * 2) {
        scrollViewRef.current?.scrollTo({ x: totalOriginalWidth, animated: false });
      }
    }
  };

  const snapToNearestCategory = (currentOffset) => {
    if (totalOriginalWidth === 0) return;
    
    // Calculate which category should be centered
    const categoryIndex = Math.round(currentOffset / categoryWidth);
    const targetOffset = categoryIndex * categoryWidth;
    
    // Snap to the calculated position
    scrollViewRef.current?.scrollTo({ x: targetOffset, animated: true });
    
    // Trigger haptic feedback
    triggerHapticFeedback();
    
    // Determine which category is now centered and select it
    const normalizedIndex = categoryIndex % otherCategories.length;
    const centeredCategory = otherCategories[normalizedIndex];
    if (centeredCategory && selectedCategory !== centeredCategory.id) {
      onCategorySelect(centeredCategory.id);
    }
  };

  const handleCategoryPress = (category) => {
    // Find the category's position and scroll to it
    const categoryIndex = otherCategories.findIndex(cat => cat.id === category.id);
    if (categoryIndex !== -1) {
      const targetOffset = totalOriginalWidth + (categoryIndex * categoryWidth);
      scrollViewRef.current?.scrollTo({ x: targetOffset, animated: true });
      triggerHapticFeedback();
    }
    onCategorySelect(category.id);
  };

  const handleMomentumScrollEnd = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    snapToNearestCategory(offsetX);
  };

  // Platform-specific ScrollView props
  const getScrollViewProps = () => {
    const baseProps = {
      ref: scrollViewRef,
      horizontal: true,
      showsHorizontalScrollIndicator: false,
      contentContainerStyle: styles.scrollContent,
      onScroll: handleScroll,
      onMomentumScrollEnd: handleMomentumScrollEnd,
      scrollEventThrottle: 16,
      keyboardShouldPersistTaps: "handled",
      overScrollMode: "never",
      bounces: false,
      snapToInterval: categoryWidth,
      snapToAlignment: 'center',
      decelerationRate: 'fast',
    };

    return baseProps;
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabsRow}>
        {/* Fixed All button */}
        <TouchableOpacity
          style={[styles.allTab, styles.fixedButton, selectedCategory === 'all' && styles.selectedTab]}
          onPress={() => onCategorySelect('all')}
          activeOpacity={0.7}
        >
          <Text style={styles.allTabText}>All</Text>
        </TouchableOpacity>

        {/* Infinite scrollable categories with pointer */}
        <View style={styles.scrollContainer}>
          {/* Selection pointer */}
          {selectedCategory !== 'all' && (
            <View style={styles.pointerContainer}>
              <View style={styles.pointer} />
            </View>
          )}
          
          <ScrollView {...getScrollViewProps()}>
            {infiniteCategories.map((category, index) => (
              <TouchableOpacity
                key={`cat-${index}-${category.id}`}
                style={[
                  styles.tab,
                  { backgroundColor: category.color },
                  selectedCategory === category.id && styles.selectedTab
                ]}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.tabText,
                  selectedCategory === category.id && styles.selectedTabText
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
    </View>
  );
}