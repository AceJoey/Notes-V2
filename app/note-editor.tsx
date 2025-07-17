import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { ArrowLeft, Check, MoveVertical as MoreVertical, FileText, SquareCheck as CheckSquare, Plus, Trash2, Tag, ChevronDown } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StorageHelper } from '../utils/storage';
import { CategoryHelpers } from '../utils/categoryHelpers';
import ChecklistItem from '../components/ChecklistItem';
import { useTheme } from '../theme/ThemeContext';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface Note {
  title: string;
  content: string;
  categoryId: string;
  type: 'text' | 'checklist';
  items: ChecklistItem[];
  id?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
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
    },
    headerButton: {
      padding: 8,
    },
    headerLeft: {
      flex: 1,
      marginLeft: 16,
    },
    categorySelector: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f3f4f6',
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    categoryDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 8,
    },
    categoryText: {
      fontSize: 14,
      color: theme === 'dark' ? '#fff' : '#222',
      marginRight: 4,
    },
    headerRight: {
      flexDirection: 'row',
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    section: {
      marginBottom: 24,
    },
    titleInput: {
      fontSize: 24,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#222',
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f3f4f6',
      borderRadius: 12,
      padding: 16,
      minHeight: 60,
      textAlignVertical: 'top',
    },
    controlButton: {
      padding: 8,
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f3f4f6',
      borderRadius: 8,
      marginLeft: 8,
    },
    activeControl: {
      backgroundColor: '#3b82f6',
    },
    contentInput: {
      fontSize: 16,
      color: theme === 'dark' ? '#fff' : '#222',
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f3f4f6',
      borderRadius: 12,
      padding: 16,
      minHeight: 300,
      textAlignVertical: 'top',
    },
    checklistContainer: {
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f3f4f6',
      borderRadius: 12,
      padding: 16,
      minHeight: 200,
    },
    addItemButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
      marginTop: 8,
    },
    addItemText: {
      fontSize: 16,
      color: '#3b82f6',
      marginLeft: 8,
    },
    saveFab: {
      position: 'absolute',
      right: 16,
      bottom: 16,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#3b82f6',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      zIndex: 1000,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryPicker: {
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff',
      borderRadius: 16,
      padding: 20,
      margin: 20,
      minWidth: 250,
      maxHeight: 400,
    },
    pickerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#222',
      marginBottom: 16,
    },
    categoryOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 4,
      backgroundColor: theme === 'dark' ? '#232323' : '#f3f4f6',
    },
    selectedCategoryOption: {
      backgroundColor: '#3b82f6' + '20',
    },
    categoryOptionText: {
      fontSize: 16,
      color: theme === 'dark' ? '#fff' : '#222',
      flex: 1,
      marginLeft: 8,
    },
  });
}

export default function NoteEditor() {
  const router = useRouter();
  const { noteId } = useLocalSearchParams();
  const [note, setNote] = useState<Note>({
    title: '',
    content: '',
    categoryId: 'personal',
    type: 'text',
    items: []
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(!noteId);
  const [showCategoryPicker, setShowCategoryPicker] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const loadedCategories = await StorageHelper.getCategories();
      setCategories(loadedCategories as Category[]);

      if (noteId) {
        const notes = await StorageHelper.getNotes();
        const existingNote = (notes as Note[]).find((n: Note) => n.id === noteId);
        if (existingNote) {
          setNote(existingNote);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSave = async () => {
    // Auto-generate title if empty
    let finalNote = { ...note };
    if (!finalNote.title.trim()) {
      if (finalNote.type === 'text' && finalNote.content.trim()) {
        const contentPreview = finalNote.content.trim().substring(0, 30);
        finalNote.title = contentPreview + (finalNote.content.length > 30 ? '...' : '');
      } else if (finalNote.type === 'checklist' && finalNote.items.length > 0) {
        const firstItem = finalNote.items[0].text.trim();
        finalNote.title = firstItem.substring(0, 30) + (firstItem.length > 30 ? '...' : '');
      } else {
        Alert.alert('Error', 'Please add some content to save the note');
        return;
      }
    }

    if (finalNote.type === 'text' && !finalNote.content.trim()) {
      Alert.alert('Error', 'Please add some content to save the note');
      return;
    }

    if (finalNote.type === 'checklist' && finalNote.items.length === 0) {
      Alert.alert('Error', 'Please add at least one item to save the checklist');
      return;
    }

    try {
      if (noteId) {
        await StorageHelper.updateNote(noteId, finalNote);
      } else {
        await StorageHelper.addNote(finalNote);
      }
      setHasUnsavedChanges(false);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save note');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageHelper.deleteNote(noteId);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete note');
            }
          }
        }
      ]
    );
  };

  const handleTypeToggle = () => {
    if (note.type === 'text') {
      setNote((prev: Note) => ({
        ...prev,
        type: 'checklist',
        items: prev.content ? [{ id: Date.now().toString(), text: prev.content, completed: false }] : []
      }));
    } else {
      const content = note.items.map((item: ChecklistItem) => item.text).join('\n');
      setNote((prev: Note) => ({
        ...prev,
        type: 'text',
        content
      }));
    }
  };

  const handleChecklistToggle = (itemId: string) => {
    setNote((prev: Note) => ({
      ...prev,
      items: prev.items.map((item: ChecklistItem) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    }));
  };

  const handleChecklistUpdate = (itemId: string, newText: string) => {
    setNote((prev: Note) => ({
      ...prev,
      items: prev.items.map((item: ChecklistItem) =>
        item.id === itemId ? { ...item, text: newText } : item
      )
    }));
  };

  const handleChecklistDelete = (itemId: string) => {
    setNote((prev: Note) => ({
      ...prev,
      items: prev.items.filter((item: ChecklistItem) => item.id !== itemId)
    }));
  };

  const handleAddChecklistItem = () => {
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: '',
      completed: false
    };
    setNote((prev: Note) => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const handleCategorySelect = (categoryId: string) => {
    setNote((prev: Note) => ({ ...prev, categoryId }));
    setShowCategoryPicker(false);
    setHasUnsavedChanges(true);
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'Do you want to save your changes before leaving?',
        [
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save', onPress: handleSave }
        ]
      );
    } else {
      router.back();
    }
  };

  const handleContentChange = (field: keyof Note, value: string) => {
    setNote((prev: Note) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const selectedCategory = categories.find((cat: Category) => cat.id === note.categoryId);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={theme === 'dark' ? '#fff' : '#222'} />
        </TouchableOpacity>
        
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.categorySelector}
            onPress={() => setShowCategoryPicker(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.categoryDot, { backgroundColor: selectedCategory?.color || '#666' }]} />
            <Text style={styles.categoryText}>{selectedCategory?.name || 'Category'}</Text>
            <ChevronDown size={16} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.controlButton, note.type === 'checklist' && styles.activeControl]}
            onPress={handleTypeToggle}
            activeOpacity={0.7}
          >
            {note.type === 'checklist' ? (
              <CheckSquare size={20} color="#3b82f6" />
            ) : (
              <FileText size={20} color="#666" />
            )}
          </TouchableOpacity>

          {noteId && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Trash2 size={24} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <TextInput
            style={styles.titleInput}
            value={note.title}
            onChangeText={(text) => handleContentChange('title', text)}
            placeholder="Note title..."
            placeholderTextColor="#666"
            multiline
          />
        </View>

        <View style={styles.section}>
          {note.type === 'text' ? (
            <TextInput
              style={styles.contentInput}
              value={note.content}
              onChangeText={(text) => handleContentChange('content', text)}
              placeholder="Start writing..."
              placeholderTextColor="#666"
              multiline
              textAlignVertical="top"
            />
          ) : (
            <View style={styles.checklistContainer}>
              {note.items.map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  onToggle={handleChecklistToggle}
                  onUpdate={handleChecklistUpdate}
                  onDelete={handleChecklistDelete}
                  editable={true}
                />
              ))}
              
              <TouchableOpacity
                style={styles.addItemButton}
                onPress={handleAddChecklistItem}
                activeOpacity={0.7}
              >
                <Plus size={20} color="#3b82f6" />
                <Text style={styles.addItemText}>Add item</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.saveFab}
        onPress={handleSave}
        activeOpacity={0.8}
      >
        <Check size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryPicker(false)}
        >
          <View style={styles.categoryPicker}>
            <Text style={styles.pickerTitle}>Select Category</Text>
            {categories.filter(cat => cat.id !== 'all').map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryOption,
                  note.categoryId === category.id && styles.selectedCategoryOption
                ]}
                onPress={() => handleCategorySelect(category.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                <Text style={styles.categoryOptionText}>{category.name}</Text>
                {note.categoryId === category.id && <Check size={16} color="#3b82f6" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}