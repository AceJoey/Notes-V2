import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Button } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Plus, FileText, SquareCheck as CheckSquare, Menu as MenuIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { StorageHelper } from '../../utils/storage';
import { CategoryHelpers } from '../../utils/categoryHelpers';
import { useTheme } from '../../theme/ThemeContext';

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

interface MarkedDate {
  marked?: boolean;
  customStyles?: any;
  highlight?: string;
  selected?: boolean;
  selectedColor?: string;
}

function getStyles(theme: string) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
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
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: theme === 'dark' ? '#fff' : '#222',
    },
    headerButton: {
      padding: 8,
      backgroundColor: theme === 'dark' ? '#232323' : '#e5e7eb',
      borderRadius: 8,
    },
    headerButtonText: {
      fontSize: 16,
      color: '#3b82f6',
      fontWeight: '600',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    calendar: {
      marginHorizontal: 16,
      borderRadius: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    notesSection: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#222',
      marginBottom: 12,
    },
    notesList: {
      flex: 1,
    },
    noteItem: {
      flexDirection: 'row',
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f0f0f0',
      borderRadius: 12,
      marginBottom: 12,
      overflow: 'hidden',
      alignItems: 'center',
    },
    noteColorStrip: {
      width: 4,
    },
    noteContent: {
      flex: 1,
      padding: 16,
    },
    noteHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    noteTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#222',
      flex: 1,
    },
    noteTypeIcon: {
      marginLeft: 8,
    },
    notePreview: {
      fontSize: 14,
      color: theme === 'dark' ? '#ccc' : '#666',
      lineHeight: 20,
      marginBottom: 8,
    },
    noteFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    noteCategory: {
      fontSize: 12,
      color: theme === 'dark' ? '#666' : '#888',
    },
    noteTime: {
      fontSize: 12,
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
    highlightTile: {
      backgroundColor: '#3b82f6',
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginTop: 2,
      alignSelf: 'center',
    },
    highlightTileText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '600',
    },
    weekToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      alignSelf: 'flex-end',
      marginRight: 16,
    },
    weekToggleButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: '#3b82f6',
      marginLeft: 8,
    },
    weekToggleButtonText: {
      color: '#fff',
      fontWeight: '600',
    },
    todayButton: {
      backgroundColor: '#3b82f6',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    todayButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 14,
    },
  });
}

export default function CalendarScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState<Record<string, MarkedDate>>({});
  const [calendarMode, setCalendarMode] = useState('month'); // 'month' or 'week'
  const [calendarKey, setCalendarKey] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    generateMarkedDates();
  }, [notes, selectedDate, theme]);

  useEffect(() => {
    setCalendarKey(prev => prev + 1); // force re-render on theme or notes change
  }, [theme, notes]);

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

  const generateMarkedDates = () => {
    const marked: Record<string, MarkedDate> = {};
    notes.forEach((note: Note) => {
      const dateKey = note.createdAt.split('T')[0];
      if (!marked[dateKey]) {
        marked[dateKey] = {
          marked: true,
          customStyles: {
            container: {
              backgroundColor: '#3b82f6',
              borderRadius: 8,
            },
            text: {
              color: '#fff',
            },
          },
        };
      }
      marked[dateKey].highlight = note.title;
    });
    if (selectedDate) {
      marked[selectedDate] = {
        ...(marked[selectedDate] || {}),
        selected: true,
        selectedColor: '#3b82f6',
      };
    }
    setMarkedDates(marked);
  };

  const getNotesForDate = (date: string) => {
    return notes.filter((note: Note) => note.createdAt.split('T')[0] === date);
  };

  const selectedDateNotes = getNotesForDate(selectedDate);

  const handleDatePress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
  };

  const handleNotePress = (note: Note) => {
    router.push({
      pathname: '/note-editor',
      params: { noteId: note.id }
    });
  };

  const handleCreateNote = () => {
    router.push('/note-editor');
  };

  const renderNoteItem = ({ item }: { item: Note }) => {
    const categoryColor = CategoryHelpers.getCategoryColor(item.categoryId, categories);
    const categoryName = CategoryHelpers.getCategoryName(item.categoryId, categories);
    return (
      <TouchableOpacity
        style={styles.noteItem}
        onPress={() => handleNotePress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.noteColorStrip, { backgroundColor: categoryColor }]} />
        <View style={styles.noteContent}>
          <View style={styles.noteHeader}>
            <Text style={styles.noteTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.noteTypeIcon}>
              {item.type === 'checklist' ? (
                <CheckSquare size={16} color="#666" />
              ) : (
                <FileText size={16} color="#666" />
              )}
            </View>
          </View>
          <Text style={styles.notePreview} numberOfLines={2}>
            {item.type === 'checklist' 
              ? `${item.items.filter(i => i.completed).length}/${item.items.length} completed`
              : item.content.substring(0, 80) + (item.content.length > 80 ? '...' : '')
            }
          </Text>
          <View style={styles.noteFooter}>
            <Text style={styles.noteCategory}>{categoryName}</Text>
            <Text style={styles.noteTime}>
              {new Date(item.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No notes for this date</Text>
      <Text style={styles.emptySubtitle}>
        Tap the + button to create a new note
      </Text>
    </View>
  );

  // Toggle between month and week view
  const toggleCalendarMode = () => {
    setCalendarMode(calendarMode === 'month' ? 'week' : 'month');
  };

  // Custom day component to show highlight tile if note exists
  // Remove renderDay if not supported by react-native-calendars
  // ... existing code ...

  const today = new Date().toISOString().split('T')[0];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/menu')}>
            <MenuIcon size={24} color={theme === 'dark' ? '#fff' : '#222'} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', marginRight: 16, marginBottom: 8 }}>
        <TouchableOpacity style={styles.todayButton} onPress={() => setSelectedDate(today)}>
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>

      <Calendar
        key={calendarKey}
        current={selectedDate}
        onDayPress={handleDatePress}
        markingType="custom"
        markedDates={markedDates}
        // renderDay={renderDay} // Removed as per edit hint
        theme={{
          calendarBackground: theme === 'dark' ? '#1a1a1a' : '#fff',
          textSectionTitleColor: theme === 'dark' ? '#666' : '#888',
          selectedDayBackgroundColor: '#3b82f6',
          selectedDayTextColor: '#fff',
          todayTextColor: '#3b82f6',
          dayTextColor: theme === 'dark' ? '#fff' : '#222',
          textDisabledColor: theme === 'dark' ? '#333' : '#ccc',
          dotColor: '#3b82f6',
          selectedDotColor: '#fff',
          arrowColor: '#3b82f6',
          monthTextColor: theme === 'dark' ? '#fff' : '#222',
          indicatorColor: '#3b82f6',
          textDayFontWeight: '500',
          textMonthFontWeight: '600',
          textDayHeaderFontWeight: '600',
        }}
        style={styles.calendar}
        hideExtraDays={false}
        displayLoadingIndicator={false}
        enableSwipeMonths={true}
        firstDay={1}
        // Switch between month and week view
        {...(calendarMode === 'week' ? {
          hideArrows: false,
          disableMonthChange: false,
          showSixWeeks: false,
          numberOfWeeks: 1,
        } : {})}
      />

      <View style={styles.notesSection}>
        <Text style={styles.sectionTitle}>
          Notes for {new Date(selectedDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        <FlatList
          data={selectedDateNotes}
          renderItem={renderNoteItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmptyState}
          style={styles.notesList}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateNote}
        activeOpacity={0.8}
      >
        <Plus size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}