import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowLeft, FileText, Image, Video, Headphones } from 'lucide-react-native';
import { useTheme, PRIMARY_COLOR } from '../theme/ThemeContext';

interface VaultScreenProps {
  visible: boolean;
  onClose: () => void;
}

function getStyles(theme: string) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 60,
      paddingBottom: 20,
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
      borderBottomWidth: 1,
      borderBottomColor: theme === 'dark' ? '#333' : '#e5e7eb',
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme === 'dark' ? '#fff' : '#222',
      marginLeft: 16,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    categoryCard: {
      width: '48%',
      aspectRatio: 1,
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
      borderRadius: 16,
      padding: 24,
      marginBottom: 16,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    categoryIcon: {
      marginBottom: 16,
    },
    categoryTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#222',
      textAlign: 'center',
    },
    categorySubtitle: {
      fontSize: 14,
      color: theme === 'dark' ? '#666' : '#888',
      textAlign: 'center',
      marginTop: 4,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#222',
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 16,
      color: theme === 'dark' ? '#666' : '#888',
      textAlign: 'center',
      lineHeight: 24,
    },
  });
}

export default function VaultScreen({ visible, onClose }: VaultScreenProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const vaultCategories = [
    {
      id: 'notes',
      title: 'Notes',
      subtitle: 'Secure notes',
      icon: FileText,
      color: PRIMARY_COLOR,
      count: 0,
    },
    {
      id: 'images',
      title: 'Images',
      subtitle: 'Private photos',
      icon: Image,
      color: '#10b981',
      count: 0,
    },
    {
      id: 'videos',
      title: 'Videos',
      subtitle: 'Private videos',
      icon: Video,
      color: '#f59e0b',
      count: 0,
    },
    {
      id: 'audio',
      title: 'Audio',
      subtitle: 'Voice recordings',
      icon: Headphones,
      color: '#ef4444',
      count: 0,
    },
  ];

  const handleCategoryPress = (categoryId: string) => {
    // TODO: Implement category-specific screens
    console.log('Opening vault category:', categoryId);
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <ArrowLeft size={24} color={theme === 'dark' ? '#fff' : '#222'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secure Vault</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {vaultCategories.map((category) => {
            const Icon = category.icon;
            return (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category.id)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryIcon}>
                  <Icon size={48} color={category.color} />
                </View>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categorySubtitle}>
                  {category.count} items
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Your Secure Vault</Text>
          <Text style={styles.emptySubtitle}>
            Store your most sensitive files here. All content is encrypted and protected by your PIN.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}