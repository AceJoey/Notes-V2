import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TextInput, 
  TouchableOpacity, 
  FlatList,
  Alert
} from 'react-native';
import { X, Search, FileText, CheckSquare } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { CategoryHelpers } from '../utils/categoryHelpers';

function getStyles(theme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'flex-start',
      paddingTop: 60,
    },
    modal: {
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
      margin: 16,
      borderRadius: 16,
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme === 'dark' ? '#333' : '#e5e7eb',
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme === 'dark' ? '#fff' : '#222',
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f3f4f6',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 12,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      flex: 1,
    },
    resultItem: {
      flexDirection: 'row',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme === 'dark' ? '#333' : '#e5e7eb',
    },
    resultIcon: {
      marginRight: 12,
      marginTop: 2,
    },
    resultContent: {
      flex: 1,
    },
    resultTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#222',
      marginBottom: 4,
    },
    resultPreview: {
      fontSize: 14,
      color: theme === 'dark' ? '#ccc' : '#666',
      marginBottom: 4,
    },
    resultCategory: {
      fontSize: 12,
      color: '#3b82f6',
    },
    noResults: {
      padding: 32,
      alignItems: 'center',
    },
    noResultsText: {
      fontSize: 16,
      color: theme === 'dark' ? '#666' : '#888',
      textAlign: 'center',
      marginBottom: 8,
    },
    suggestionText: {
      fontSize: 14,
      color: '#3b82f6',
      textAlign: 'center',
    },
    highlightText: {
      backgroundColor: '#3b82f6',
      color: '#fff',
      paddingHorizontal: 2,
    },
  });
}

export default function SearchModal({ 
  visible, 
  onClose, 
  notes, 
  categories, 
  selectedCategory,
  onNotePress,
  onSuggestAllCategory 
}) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery.trim());
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, notes, selectedCategory]);

  const performSearch = (query) => {
    const lowercaseQuery = query.toLowerCase();
    
    // Filter notes by selected category first
    const categoryFilteredNotes = selectedCategory === 'all' 
      ? notes 
      : notes.filter(note => note.categoryId === selectedCategory);
    
    // Search within filtered notes
    const results = categoryFilteredNotes.filter(note => {
      // Search in title
      if (note.title.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }
      
      // Search in content (for text notes)
      if (note.type === 'text' && note.content.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }
      
      // Search in checklist items
      if (note.type === 'checklist') {
        return note.items.some(item => 
          item.text.toLowerCase().includes(lowercaseQuery)
        );
      }
      
      return false;
    });

    setSearchResults(results);
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <Text key={index} style={styles.highlightText}>{part}</Text>
      ) : part
    );
  };

  const getPreview = (note, query) => {
    if (note.type === 'checklist') {
      const matchingItem = note.items.find(item => 
        item.text.toLowerCase().includes(query.toLowerCase())
      );
      return matchingItem ? matchingItem.text : note.items[0]?.text || '';
    }
    
    // For text notes, show context around the match
    const content = note.content;
    const queryIndex = content.toLowerCase().indexOf(query.toLowerCase());
    
    if (queryIndex !== -1) {
      const start = Math.max(0, queryIndex - 30);
      const end = Math.min(content.length, queryIndex + query.length + 30);
      const preview = content.substring(start, end);
      return (start > 0 ? '...' : '') + preview + (end < content.length ? '...' : '');
    }
    
    return content.substring(0, 80) + (content.length > 80 ? '...' : '');
  };

  const handleSuggestAllCategory = () => {
    onSuggestAllCategory();
    onClose();
  };

  const renderSearchResult = ({ item }) => {
    const categoryName = CategoryHelpers.getCategoryName(item.categoryId, categories);
    const preview = getPreview(item, searchQuery);
    
    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => {
          onNotePress(item);
          onClose();
        }}
        activeOpacity={0.7}
      >
        <View style={styles.resultIcon}>
          {item.type === 'checklist' ? (
            <CheckSquare size={20} color="#666" />
          ) : (
            <FileText size={20} color="#666" />
          )}
        </View>
        
        <View style={styles.resultContent}>
          <Text style={styles.resultTitle}>
            {highlightText(item.title, searchQuery)}
          </Text>
          <Text style={styles.resultPreview} numberOfLines={2}>
            {highlightText(preview, searchQuery)}
          </Text>
          <Text style={styles.resultCategory}>{categoryName}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderNoResults = () => {
    const categoryName = CategoryHelpers.getCategoryName(selectedCategory, categories);
    const hasResultsInOtherCategories = selectedCategory !== 'all' && 
      notes.some(note => 
        note.categoryId !== selectedCategory && 
        (note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
         note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
         (note.type === 'checklist' && note.items.some(item => 
           item.text.toLowerCase().includes(searchQuery.toLowerCase())
         )))
      );

    return (
      <View style={styles.noResults}>
        <Text style={styles.noResultsText}>
          {searchQuery ? 
            `No results found for "${searchQuery}" in ${categoryName}` :
            'Start typing to search...'
          }
        </Text>
        {hasResultsInOtherCategories && (
          <TouchableOpacity onPress={handleSuggestAllCategory}>
            <Text style={styles.suggestionText}>
              Search in all categories instead?
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Search size={20} color="#666" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={`Search in ${CategoryHelpers.getCategoryName(selectedCategory, categories)}...`}
              placeholderTextColor="#666"
              autoFocus
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={renderNoResults}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}