import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { ArrowLeft, Check, Tag } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { StorageHelper } from '../utils/storage';
import { useTheme, PRIMARY_COLOR } from '../theme/ThemeContext';

interface Category {
  id: string;
  name: string;
  color: string;
}

export default function DefaultCategoryScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('personal');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [loadedCategories, currentDefault] = await Promise.all([
        StorageHelper.getCategories(),
        StorageHelper.getDefaultCategory()
      ]);
      
      // Filter out the 'all' category since it's not a real category
      const filteredCategories = loadedCategories.filter((cat: Category) => cat.id !== 'all');
      setCategories(filteredCategories);
      setSelectedCategory(currentDefault);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleCategorySelect = async (categoryId: string) => {
    try {
      await StorageHelper.setDefaultCategory(categoryId);
      setSelectedCategory(categoryId);
      
      Alert.alert(
        'Default Category Updated',
        'Your default category has been updated successfully.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error setting default category:', error);
      Alert.alert('Error', 'Failed to update default category. Please try again.');
    }
  };

  const renderCategory = ({ item }: { item: Category }) => {
    const isSelected = item.id === selectedCategory;
    
    return (
      <TouchableOpacity
        style={[styles.categoryItem, isSelected && styles.selectedCategory]}
        onPress={() => handleCategorySelect(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.categoryLeft}>
          <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
          <Text style={[styles.categoryName, isSelected && styles.selectedCategoryText]}>
            {item.name}
          </Text>
        </View>
        
        {isSelected && (
          <Check size={20} color={PRIMARY_COLOR} />
        )}
      </TouchableOpacity>
    );
  };

  const styles = getStyles(theme);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/menu')}>
            <ArrowLeft size={28} color={theme === 'dark' ? '#fff' : '#222'} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Default Category</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/menu')}>
          <ArrowLeft size={28} color={theme === 'dark' ? '#fff' : '#222'} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Default Category</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.infoSection}>
          <Tag size={24} color={PRIMARY_COLOR} style={styles.infoIcon} />
          <Text style={styles.infoTitle}>Choose Default Category</Text>
          <Text style={styles.infoDescription}>
            When you create a new note or checklist from the "All categories" page, 
            it will be automatically saved to this category.
          </Text>
        </View>

        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Available Categories</Text>
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        <View style={styles.currentSelection}>
          <Text style={styles.currentSelectionTitle}>Current Default:</Text>
          <View style={styles.currentSelectionItem}>
            <View 
              style={[
                styles.currentSelectionDot, 
                { backgroundColor: categories.find(c => c.id === selectedCategory)?.color || '#666' }
              ]} 
            />
            <Text style={styles.currentSelectionText}>
              {categories.find(c => c.id === selectedCategory)?.name || 'Personal'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
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
      marginRight: 8,
    },
    headerContent: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#222',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: theme === 'dark' ? '#666' : '#888',
    },
    infoSection: {
      alignItems: 'center',
      marginBottom: 30,
      paddingHorizontal: 20,
    },
    infoIcon: {
      marginBottom: 12,
    },
    infoTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#222',
      marginBottom: 8,
      textAlign: 'center',
    },
    infoDescription: {
      fontSize: 14,
      color: theme === 'dark' ? '#ccc' : '#666',
      textAlign: 'center',
      lineHeight: 20,
    },
    categoriesSection: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#222',
      marginBottom: 16,
    },
    categoriesList: {
      paddingBottom: 20,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f3f4f6',
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
    },
    selectedCategory: {
      backgroundColor: PRIMARY_COLOR + '20',
      borderWidth: 2,
      borderColor: PRIMARY_COLOR,
    },
    categoryLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    categoryDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      marginRight: 12,
    },
    categoryName: {
      fontSize: 16,
      color: theme === 'dark' ? '#fff' : '#222',
      fontWeight: '500',
    },
    selectedCategoryText: {
      color: PRIMARY_COLOR,
      fontWeight: '600',
    },
    currentSelection: {
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f3f4f6',
      borderRadius: 12,
      padding: 16,
      marginTop: 20,
    },
    currentSelectionTitle: {
      fontSize: 14,
      color: theme === 'dark' ? '#666' : '#888',
      marginBottom: 8,
    },
    currentSelectionItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    currentSelectionDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 8,
    },
    currentSelectionText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#222',
    },
  });
} 