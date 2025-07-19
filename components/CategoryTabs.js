import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme, PRIMARY_COLOR } from '../theme/ThemeContext';

function getStyles(theme) {
  return StyleSheet.create({
    container: {
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f3f4f6',
      position: 'relative',
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
      elevation: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    },
    selectedTab: {
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      transform: [{ translateY: -2 }, { scale: 1.05 }],
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
      backgroundColor: PRIMARY_COLOR,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
      minWidth: 0,
      elevation: 0,
      marginLeft: 8,
    },
    editTabText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
      letterSpacing: 1,
    },
    allTab: {
      backgroundColor: PRIMARY_COLOR,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
      minWidth: 0,
      elevation: 0,
      marginRight: 8,
    },
    allTabText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
      letterSpacing: 1,
    },
    fadeLeft: {
      position: 'absolute',
      left: 0,
      // Cover more vertical space to fully cover bubbles
      top: '-10%',
      height: '120%',
      bottom: undefined,
      // Set fade effect width to 20px
      width: 20,
      zIndex: 3,
      pointerEvents: 'none',
      marginLeft: -16, // Overlap under the 'All' block
    },
    fadeRight: {
      position: 'absolute',
      right: 0,
      // Cover more vertical space to fully cover bubbles
      top: '-10%',
      height: '120%',
      bottom: undefined,
      // Set fade effect width to 20px
      width: 20,
      zIndex: 3,
      pointerEvents: 'none',
      marginRight: -16, // Overlap under the 'Edit' block
    },
    edgeButton: {
      backgroundColor: PRIMARY_COLOR,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
      minWidth: 60,
      width: 60,
      elevation: 0,
      marginHorizontal: 0,
    },
  });
}

export default function CategoryTabs({ categories, selectedCategory, onCategorySelect, onEditPress }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const scrollViewRef = useRef(null);
  const [showFades, setShowFades] = useState({ left: false, right: false });
  
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
    }
  }, [totalOriginalWidth, otherCategories.length]);

  const triggerHapticFeedback = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const contentWidth = event.nativeEvent.contentSize.width;
    const scrollViewWidth = event.nativeEvent.layoutMeasurement.width;
    
    // Update fade visibility
    setShowFades({
      left: offsetX > 10,
      right: offsetX < contentWidth - scrollViewWidth - 10
    });
    
    // Reset scroll position when reaching edges for infinite effect
    if (totalOriginalWidth > 0) {
      if (offsetX <= 0) {
        scrollViewRef.current?.scrollTo({ x: totalOriginalWidth, animated: false });
      } else if (offsetX >= totalOriginalWidth * 2) {
        scrollViewRef.current?.scrollTo({ x: totalOriginalWidth, animated: false });
      }
    }
  };

  const handleCategoryPress = (category) => {
    triggerHapticFeedback();
    onCategorySelect(category.id);
  };

  const handleAllPress = () => {
    triggerHapticFeedback();
    onCategorySelect('all');
  };

  // Maximum aggression: almost fully solid, sharp drop to transparent
  const fadeColors = theme === 'dark'
    ? ['rgba(26, 26, 26, 1)', 'rgba(26, 26, 26, 1)', 'rgba(26, 26, 26, 0.7)', 'rgba(26, 26, 26, 0)']
    : ['rgba(243, 244, 246, 1)', 'rgba(243, 244, 246, 1)', 'rgba(243, 244, 246, 0.7)', 'rgba(243, 244, 246, 0)'];

  return (
    <View style={styles.container}>
      <View style={styles.tabsRow}>
        {/* Fixed All button */}
        <TouchableOpacity
          style={styles.edgeButton}
          onPress={handleAllPress}
          activeOpacity={0.7}
        >
          <Text style={styles.allTabText}>All</Text>
        </TouchableOpacity>

        {/* Infinite scrollable categories with fade effects */}
        <View style={styles.scrollContainer}>
          {/* Left fade */}
          {showFades.left && (
            <LinearGradient
              colors={fadeColors}
              locations={[0, 0.7, 0.85, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.fadeLeft}
            />
          )}
          
          {/* Right fade */}
          {showFades.right && (
            <LinearGradient
              colors={fadeColors}
              locations={[0, 0.7, 0.85, 1]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 0 }}
              style={styles.fadeRight}
            />
          )}
          
          <ScrollView
            ref={scrollViewRef}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
            overScrollMode="never"
            bounces={false}
            decelerationRate="normal"
          >
            {infiniteCategories.map((category, index) => (
              <TouchableOpacity
                key={`cat-${index}-${category.id}`}
                style={[
                  styles.tab,
                  { backgroundColor: category.color },
                  selectedCategory === category.id && selectedCategory !== 'all' && styles.selectedTab
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
          style={styles.edgeButton}
          onPress={onEditPress}
          activeOpacity={0.7}
        >
          <Text style={styles.editTabText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}