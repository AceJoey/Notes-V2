import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  Alert,
  Modal
} from 'react-native';
import { Search, SlidersHorizontal, MoveHorizontal as MoreHorizontal, Plus, CreditCard as Edit3, Trash2, Menu as MenuIcon, FileText, Calendar, List } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { StorageHelper } from '../../utils/storage';
import { CategoryHelpers } from '../../utils/categoryHelpers';
import NoteCard from '../../components/NoteCard';
import CategoryTabs from '../../components/CategoryTabs';
import VaultPromptModal from '../../components/VaultPromptModal';
import SearchModal from '../../components/SearchModal';
import SortModal from '../../components/SortModal';
import { useTheme } from '../../theme/ThemeContext';
import { useFocusEffect } from 'expo-router';
import { Tabs } from 'expo-router';

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
    emptyContainer: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 60,
      paddingBottom: 20,
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
    },
    appTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: theme === 'dark' ? '#fff' : '#222',
    },
    headerActions: {
      flexDirection: 'row',
    },
    headerButton: {
      padding: 8,
      marginLeft: 8,
    },
    notesHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    notesTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#222',
    },
    notesCount: {
      fontSize: 14,
      color: theme === 'dark' ? '#666' : '#888',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#222',
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 16,
      color: theme === 'dark' ? '#666' : '#888',
      textAlign: 'center',
      lineHeight: 24,
    },
    fab: {
      position: 'absolute',
      left: '50%',
      transform: [{ translateX: -36 }],
      bottom: 32,
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: '#3b82f6',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    viewAllButton: {
      backgroundColor: '#3b82f6',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
      marginTop: 16,
    },
    viewAllButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '500',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    noteOptionsModal: {
      backgroundColor: '#2a2a2a',
      borderRadius: 12,
      padding: 8,
      margin: 20,
      minWidth: 200,
    },
    noteOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 8,
    },
    noteOptionText: {
      fontSize: 16,
      color: '#fff',
      marginLeft: 12,
    },
    deleteText: {
      color: '#ef4444',
    },
  });
}

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [vaultModalVisible, setVaultModalVisible] = useState<boolean>(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteOptionsVisible, setNoteOptionsVisible] = useState<boolean>(false);
  const [pullStartTime, setPullStartTime] = useState<number | null>(null);
  const [searchModalVisible, setSearchModalVisible] = useState<boolean>(false);
  const [sortModalVisible, setSortModalVisible] = useState<boolean>(false);
  const [currentSort, setCurrentSort] = useState<string>('created-desc');

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [loadedNotes, loadedCategories] = await Promise.all([
        StorageHelper.getNotes(),
        StorageHelper.getCategories()
      ]);
      setNotes(loadedNotes);
      setCategories(loadedCategories);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, []);

  const handlePullStart = () => {
    setPullStartTime(Date.now());
  };

  const handlePullEnd = () => {
    if (pullStartTime) {
      const pullDuration = Date.now() - pullStartTime;
      if (pullDuration >= 2000) {
        setVaultModalVisible(true);
      }
      setPullStartTime(null);
    }
  };

  const sortNotes = (notes: Note[], sortType: string): Note[] => {
    const sortedNotes = [...notes];
    
    switch (sortType) {
      case 'title-asc':
        return sortedNotes.sort((a, b) => a.title.localeCompare(b.title));
      case 'title-desc':
        return sortedNotes.sort((a, b) => b.title.localeCompare(a.title));
      case 'created-asc':
        return sortedNotes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'created-desc':
        return sortedNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'updated-asc':
        return sortedNotes.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
      case 'updated-desc':
        return sortedNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      default:
        return sortedNotes;
    }
  };

  const filteredAndSortedNotes: Note[] = sortNotes(
    CategoryHelpers.filterNotesByCategory(notes, selectedCategory).filter((n: Note) => n.type === 'text'),
    currentSort
  );

  const handleNotePress = (note: Note) => {
    router.push({
      pathname: '/note-editor',
      params: { noteId: note.id }
    });
  };

  const handleNoteLongPress = (note: Note) => {
    setSelectedNote(note);
    setNoteOptionsVisible(true);
  };

  const handleDeleteNote = async () => {
    if (selectedNote) {
      Alert.alert(
        'Delete Note',
        'Are you sure you want to delete this note?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await StorageHelper.deleteNote(selectedNote.id);
              setNoteOptionsVisible(false);
              setSelectedNote(null);
              loadData();
            }
          }
        ]
      );
    }
  };

  const handleEditNote = () => {
    setNoteOptionsVisible(false);
    handleNotePress(selectedNote!);
  };

  const handleCreateNote = () => {
    router.push('/note-editor');
  };

  const handleViewAllNotes = () => {
    setSelectedCategory('all');
  };

  const handleCategoryEdit = () => {
    router.push('/category-editor');
  };

  const handleSearchPress = () => {
    setSearchModalVisible(true);
  };

  const handleSortPress = () => {
    setSortModalVisible(true);
  };

  const handleSuggestAllCategory = () => {
    setSelectedCategory('all');
  };
  const renderNote = ({ item }: { item: Note }): React.ReactElement => (
    <NoteCard
      note={item}
      categories={categories}
      onPress={() => handleNotePress(item)}
      onLongPress={() => handleNoteLongPress(item)}
    />
  );

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <Text style={styles.appTitle}>Notes V</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleSearchPress}>
            <Search size={24} color={theme === 'dark' ? '#fff' : '#222'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleSortPress}>
            <SlidersHorizontal size={24} color={theme === 'dark' ? '#fff' : '#222'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/menu')}>
            <MenuIcon size={24} color={theme === 'dark' ? '#fff' : '#222'} />
          </TouchableOpacity>
        </View>
      </View>

      <CategoryTabs
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        onEditPress={handleCategoryEdit}
      />

      <View style={styles.notesHeader}>
        <Text style={styles.notesTitle}>Notes</Text>
        <Text style={styles.notesCount}>
          {filteredAndSortedNotes.length} {filteredAndSortedNotes.length === 1 ? 'note' : 'notes'}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>
        {selectedCategory === 'all' ? 'No notes yet' : `No ${CategoryHelpers.getCategoryName(selectedCategory, categories)} notes`}
      </Text>
      <Text style={styles.emptySubtitle}>
        {selectedCategory === 'all' 
          ? 'Tap the + button to create your first note'
          : 'Create a note or view all notes'
        }
      </Text>
      {selectedCategory !== 'all' && (
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={handleViewAllNotes}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllButtonText}>View All Notes</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredAndSortedNotes}
        renderItem={renderNote}
        keyExtractor={(item: Note) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={['#3b82f6']}
            progressBackgroundColor="#2a2a2a"
            onTouchStart={handlePullStart}
            onTouchEnd={handlePullEnd}
          />
        }
        contentContainerStyle={filteredAndSortedNotes.length === 0 ? styles.emptyContainer : null}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateNote}
        activeOpacity={0.8}
      >
        <Plus size={28} color="#fff" />
      </TouchableOpacity>

      <VaultPromptModal
        visible={vaultModalVisible}
        onClose={() => setVaultModalVisible(false)}
      />

      <Modal
        visible={noteOptionsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNoteOptionsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setNoteOptionsVisible(false)}
        >
          <View style={styles.noteOptionsModal}>
            <TouchableOpacity
              style={styles.noteOption}
              onPress={handleEditNote}
              activeOpacity={0.7}
            >
              <Edit3 size={20} color="#3b82f6" />
              <Text style={styles.noteOptionText}>Edit Note</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.noteOption}
              onPress={handleDeleteNote}
              activeOpacity={0.7}
            >
              <Trash2 size={20} color="#ef4444" />
              <Text style={[styles.noteOptionText, styles.deleteText]}>Delete Note</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <SearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        notes={notes}
        categories={categories}
        selectedCategory={selectedCategory}
        onNotePress={handleNotePress}
        onSuggestAllCategory={handleSuggestAllCategory}
      />

      <SortModal
        visible={sortModalVisible}
        onClose={() => setSortModalVisible(false)}
        currentSort={currentSort}
        onSortChange={setCurrentSort}
      />
    </View>
  );
}