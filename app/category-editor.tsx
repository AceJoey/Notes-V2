import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  TextInput,
  Alert,
  Modal
} from 'react-native';
import { ArrowLeft, Plus, CreditCard as Edit3, Trash2, Palette, Check, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { StorageHelper } from '../utils/storage';
import { CategoryHelpers } from '../utils/categoryHelpers';
import { useTheme } from '../theme/ThemeContext';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  type: 'text' | 'checklist';
  items: { id: string; text: string; completed: boolean }[];
  createdAt: string;
  updatedAt: string;
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
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 60,
      paddingBottom: 20,
    },
    headerButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#222',
    },
    listContainer: {
      paddingHorizontal: 16,
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
    categoryInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    colorIndicator: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginRight: 16,
    },
    categoryName: {
      fontSize: 16,
      color: theme === 'dark' ? '#fff' : '#222',
      fontWeight: '500',
    },
    categoryActions: {
      flexDirection: 'row',
    },
    actionButton: {
      padding: 8,
      marginLeft: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff',
      borderRadius: 16,
      padding: 24,
      margin: 20,
      width: '90%',
      maxWidth: 400,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#222',
    },
    nameInput: {
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f3f4f6',
      borderRadius: 8,
      padding: 16,
      fontSize: 16,
      color: theme === 'dark' ? '#fff' : '#222',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#3b82f6',
    },
    colorSection: {
      marginBottom: 24,
    },
    colorSectionTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme === 'dark' ? '#fff' : '#222',
      marginBottom: 12,
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    colorOption: {
      width: 40,
      height: 40,
      borderRadius: 20,
      margin: 4,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedColorOption: {
      borderColor: '#3b82f6',
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    cancelButton: {
      flex: 1,
      padding: 16,
      borderRadius: 8,
      backgroundColor: theme === 'dark' ? '#3a3a3a' : '#e5e7eb',
      marginRight: 8,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: theme === 'dark' ? '#ccc' : '#666',
      fontSize: 16,
      fontWeight: '500',
    },
    saveButton: {
      flex: 1,
      padding: 16,
      borderRadius: 8,
      backgroundColor: '#3b82f6',
      marginLeft: 8,
      alignItems: 'center',
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '500',
    },
  });
}

export default function CategoryEditor() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('#3b82f6');
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const colorOptions = [
    '#f59e0b', '#10b981', '#6366f1', '#ef4444', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#14b8a6',
    '#f97316', '#06b6d4', '#8b5cf6', '#ef4444', '#10b981'
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const loadedCategories = await StorageHelper.getCategories();
      // Filter out the 'all' category as it's not editable
      setCategories((loadedCategories as Category[]).filter((cat: Category) => cat.id !== 'all'));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    try {
      const newCategory = {
        name: newCategoryName.trim(),
        color: selectedColor,
      };

      await StorageHelper.addCategory(newCategory);
      setNewCategoryName('');
      setSelectedColor('#3b82f6');
      setShowAddModal(false);
      loadCategories();
    } catch (error) {
      Alert.alert('Error', 'Failed to add category');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setSelectedColor(category.color);
    setShowAddModal(true);
  };

  const handleUpdateCategory = async () => {
    if (!newCategoryName.trim() || !editingCategory) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    try {
      const allCategories = await StorageHelper.getCategories();
      const updatedCategories = (allCategories as Category[]).map((cat: Category) =>
        editingCategory && cat.id === editingCategory.id
          ? { ...cat, name: newCategoryName.trim(), color: selectedColor }
          : cat
      );

      await StorageHelper.saveCategories(updatedCategories);
      setEditingCategory(null);
      setNewCategoryName('');
      setSelectedColor('#3b82f6');
      setShowAddModal(false);
      loadCategories();
    } catch (error) {
      Alert.alert('Error', 'Failed to update category');
    }
  };

  const handleDeleteCategory = (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? Notes in this category will be moved to "Other".`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Update all notes in this category to "other"
              const notes = await StorageHelper.getNotes();
              const updatedNotes = (notes as Note[]).map((note: Note) =>
                note.categoryId === category.id
                  ? { ...note, categoryId: 'other' }
                  : note
              );
              await StorageHelper.saveNotes(updatedNotes);

              // Remove the category
              const allCategories = await StorageHelper.getCategories();
              const filteredCategories = (allCategories as Category[]).filter((cat: Category) => cat.id !== category.id);
              await StorageHelper.saveCategories(filteredCategories);

              loadCategories();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete category');
            }
          }
        }
      ]
    );
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setEditingCategory(null);
    setNewCategoryName('');
    setSelectedColor('#3b82f6');
  };

  const renderCategoryItem = ({ item }: { item: Category }): React.ReactElement => (
    <View style={styles.categoryItem}>
      <View style={styles.categoryInfo}>
        <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
        <Text style={styles.categoryName}>{item.name}</Text>
      </View>
      
      <View style={styles.categoryActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditCategory(item)}
          activeOpacity={0.7}
        >
          <Edit3 size={20} color="#3b82f6" />
        </TouchableOpacity>
        
        {!['personal', 'work', 'other'].includes(item.id) && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteCategory(item)}
            activeOpacity={0.7}
          >
            <Trash2 size={20} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderColorOption = (color: string): React.ReactElement => (
    <TouchableOpacity
      key={color}
      style={[
        styles.colorOption,
        { backgroundColor: color },
        selectedColor === color && styles.selectedColorOption
      ]}
      onPress={() => setSelectedColor(color)}
      activeOpacity={0.7}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Categories</Text>
        
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.7}
        >
          <Plus size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item: Category) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </Text>
              <TouchableOpacity onPress={handleModalClose}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.nameInput}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Category name"
              placeholderTextColor="#666"
              autoFocus
            />

            <View style={styles.colorSection}>
              <Text style={styles.colorSectionTitle}>Choose Color</Text>
              <View style={styles.colorGrid}>
                {colorOptions.map(renderColorOption)}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleModalClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={editingCategory ? handleUpdateCategory : handleAddCategory}
                activeOpacity={0.7}
              >
                <Text style={styles.saveButtonText}>
                  {editingCategory ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}