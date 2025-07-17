import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
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
  });
}

export default function CategoryTabs({ categories, selectedCategory, onCategorySelect, onEditPress }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const scrollViewRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  
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

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    setScrollPosition(offsetX);
    
    // Reset scroll position when reaching edges for infinite effect
    if (totalOriginalWidth > 0) {
      if (offsetX <= 0) {
        // Scrolled to beginning, jump to middle set
        scrollViewRef.current?.scrollTo({ x: totalOriginalWidth, animated: false });
      } else if (offsetX >= totalOriginalWidth * 2) {
        // Scrolled to end, jump back to middle set
        scrollViewRef.current?.scrollTo({ x: totalOriginalWidth, animated: false });
      }
    }
  };

  const handleCategoryPress = (category) => {
    onCategorySelect(category.id);
  };

  const handleContentLayout = (event) => {
    setContentWidth(event.nativeEvent.layout.width);
  };

  const handleContainerLayout = (event) => {
    setContainerWidth(event.nativeEvent.layout.width);
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

      {/* Infinite scrollable categories */}
      <View style={styles.scrollContainer} onLayout={handleContainerLayout}>
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
  );
}