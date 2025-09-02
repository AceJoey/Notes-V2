import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeft, Check, FileText, List } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useTheme, PRIMARY_COLOR } from '../theme/ThemeContext';
import { StorageHelper } from '../utils/storage';
import SuccessPopup from '../components/SuccessPopup';

interface Note {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  type: 'text' | 'checklist';
  items: { id: string; text: string; completed: boolean }[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

function getStyles(theme: string) {
  const isDark = theme === 'dark';
  const backgroundColor = isDark ? '#000' : '#fff';
  const textColor = isDark ? '#fff' : '#000';
  const cardBackground = isDark ? '#1a1a1a' : '#f8f9fa';
  const borderColor = isDark ? '#333' : '#e5e7eb';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 60,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    headerButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: textColor,
    },
    headerAction: {
      padding: 8,
    },
    headerActionText: {
      color: PRIMARY_COLOR,
      fontSize: 16,
      fontWeight: '600',
    },
    content: {
      flex: 1,
      padding: 16,
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
      color: textColor,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: isDark ? '#ccc' : '#666',
      textAlign: 'center',
      lineHeight: 24,
    },
    noteCard: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: borderColor,
    },
    noteCardSelected: {
      borderColor: PRIMARY_COLOR,
      borderWidth: 2,
    },
    noteHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    noteTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: textColor,
      flex: 1,
    },
    noteType: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 8,
    },
    noteTypeIcon: {
      marginRight: 4,
    },
    noteContent: {
      fontSize: 14,
      color: isDark ? '#ccc' : '#666',
      marginBottom: 8,
      lineHeight: 20,
    },
    noteMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    noteDate: {
      fontSize: 12,
      color: isDark ? '#999' : '#888',
    },
    noteCategory: {
      fontSize: 12,
      color: PRIMARY_COLOR,
      fontWeight: '500',
    },
    selectionIndicator: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: PRIMARY_COLOR,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
}

export default function VaultNoteImportScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [loadedNotes, loadedCategories] = await Promise.all([
        StorageHelper.getNotes(),
        StorageHelper.getCategories()
      ]);
      
      // Filter out deleted notes
      const activeNotes = loadedNotes.filter((note: Note) => !note.deletedAt);
      setNotes(activeNotes);
      setCategories(loadedCategories);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleNoteToggle = (noteId: string) => {
    setSelectedNotes(prev => {
      if (prev.includes(noteId)) {
        return prev.filter(id => id !== noteId);
      } else {
        return [...prev, noteId];
      }
    });
  };

  const handleImportSelected = async () => {
    if (selectedNotes.length === 0) {
      Alert.alert('No Notes Selected', 'Please select at least one note to import to the vault.');
      return;
    }

    Alert.alert(
      'Import to Vault',
      `Are you sure you want to import ${selectedNotes.length} note${selectedNotes.length === 1 ? '' : 's'} to the vault? The original notes will be removed from your regular notes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('VaultNoteImport: Importing notes to vault:', selectedNotes);
              
              // Use the existing moveNotesToVault function
              const result = await StorageHelper.moveNotesToVault(selectedNotes);
              
              console.log('VaultNoteImport: Import successful:', result);
              
              setSuccessMessage(`Successfully imported ${result.movedCount} note${result.movedCount === 1 ? '' : 's'} to the vault.`);
              setShowSuccessPopup(true);
              
              // Navigate back to vault after a short delay
              setTimeout(() => {
                router.back();
              }, 1500);
            } catch (error) {
              console.error('VaultNoteImport: Error importing notes:', error);
              Alert.alert('Import Error', 'Failed to import notes to vault. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const renderNote = ({ item }: { item: Note }) => {
    const isSelected = selectedNotes.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.noteCard, isSelected && styles.noteCardSelected]}
        onPress={() => handleNoteToggle(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.noteHeader}>
          <Text style={styles.noteTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.noteType}>
            {item.type === 'checklist' ? (
              <List size={16} color={PRIMARY_COLOR} style={styles.noteTypeIcon} />
            ) : (
              <FileText size={16} color={PRIMARY_COLOR} style={styles.noteTypeIcon} />
            )}
          </View>
        </View>
        
        <Text style={styles.noteContent} numberOfLines={2}>
          {item.type === 'checklist' 
            ? `${item.items?.length || 0} items` 
            : item.content
          }
        </Text>
        
        <View style={styles.noteMeta}>
          <Text style={styles.noteDate}>
            {new Date(item.updatedAt).toLocaleDateString()}
          </Text>
          <Text style={styles.noteCategory}>
            {getCategoryName(item.categoryId)}
          </Text>
        </View>
        
        {isSelected && (
          <View style={styles.selectionIndicator}>
            <Check size={16} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={theme === 'dark' ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Import Notes</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme === 'dark' ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import Notes</Text>
        <TouchableOpacity 
          style={styles.headerAction} 
          onPress={handleImportSelected}
          disabled={selectedNotes.length === 0}
        >
          <Text style={[
            styles.headerActionText,
            selectedNotes.length === 0 && { opacity: 0.5 }
          ]}>
            Import ({selectedNotes.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {notes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Notes Available</Text>
            <Text style={styles.emptyText}>
              You don't have any notes to import to the vault. Create some notes first and then come back to import them.
            </Text>
          </View>
        ) : (
          <FlatList
            data={notes}
            keyExtractor={(item) => item.id}
            renderItem={renderNote}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
      <SuccessPopup
        visible={showSuccessPopup}
        message={successMessage}
        onClose={() => setShowSuccessPopup(false)}
      />
    </View>
  );
} 