import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Button, PanResponder, Dimensions, BackHandler } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Plus, FileText, SquareCheck as CheckSquare, Menu as MenuIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { StorageHelper } from '../../utils/storage';
import { CategoryHelpers } from '../../utils/categoryHelpers';
import { useTheme, PRIMARY_COLOR } from '../../theme/ThemeContext';
import { useFocusEffect } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

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
      color: PRIMARY_COLOR,
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
    noteTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#222',
      marginBottom: 4,
    },
    noteTypeIcon: {
      marginRight: 8,
    },
    noteDate: {
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
  });
}

export default function CalendarScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState<{ [key: string]: MarkedDate }>({});

  useEffect(() => {
    loadNotes();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit Notes V?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Exit',
              style: 'destructive',
              onPress: () => BackHandler.exitApp(),
            },
          ]
        );
        return true; // Prevent default behavior
      });

      return () => backHandler.remove();
    }, [])
  );

  const loadNotes = async () => {
    try {
      const loadedNotes = await StorageHelper.getNotes();
      const filteredNotes = loadedNotes.filter((note: Note) => !note.deletedAt);
      setNotes(filteredNotes);
      updateMarkedDates(filteredNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const updateMarkedDates = (notes: Note[]) => {
    const marked: { [key: string]: MarkedDate } = {};
    
    notes.forEach(note => {
      const date = new Date(note.createdAt).toISOString().split('T')[0];
      if (marked[date]) {
        marked[date].marked = true;
      } else {
        marked[date] = { marked: true };
      }
    });
    
    setMarkedDates(marked);
  };

  const getNotesForDate = (date: string) => {
    return notes.filter(note => {
      const noteDate = new Date(note.createdAt).toISOString().split('T')[0];
      return noteDate === date;
    });
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleNotePress = (note: Note) => {
    router.push({ pathname: '/note-editor', params: { noteId: note.id } });
  };

  const selectedDateNotes = getNotesForDate(selectedDate);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/note-editor')}
          >
            <Plus size={20} color={PRIMARY_COLOR} />
          </TouchableOpacity>
        </View>
      </View>

      <Calendar
        style={styles.calendar}
        theme={{
          backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff',
          calendarBackground: theme === 'dark' ? '#2a2a2a' : '#fff',
          textSectionTitleColor: theme === 'dark' ? '#fff' : '#222',
          selectedDayBackgroundColor: PRIMARY_COLOR,
          selectedDayTextColor: '#fff',
          todayTextColor: PRIMARY_COLOR,
          dayTextColor: theme === 'dark' ? '#fff' : '#222',
          textDisabledColor: theme === 'dark' ? '#666' : '#ccc',
          dotColor: PRIMARY_COLOR,
          selectedDotColor: '#fff',
          arrowColor: PRIMARY_COLOR,
          monthTextColor: theme === 'dark' ? '#fff' : '#222',
          indicatorColor: PRIMARY_COLOR,
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 13,
        }}
        markedDates={{
          ...markedDates,
          [selectedDate]: {
            ...markedDates[selectedDate],
            selected: true,
            selectedColor: PRIMARY_COLOR,
          },
        }}
        onDayPress={(day) => handleDateSelect(day.dateString)}
      />

      <View style={styles.notesSection}>
        <Text style={styles.sectionTitle}>
          Notes for {new Date(selectedDate).toLocaleDateString()}
        </Text>
        
        {selectedDateNotes.length > 0 ? (
        <FlatList
            style={styles.notesList}
          data={selectedDateNotes}
          keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.noteItem}
                onPress={() => handleNotePress(item)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.noteColorStrip,
                    {
                      backgroundColor: CategoryHelpers.getCategoryColor(item.categoryId, notes),
                    },
                  ]}
                />
                <View style={styles.noteContent}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    {item.type === 'checklist' ? (
                      <CheckSquare size={16} color={PRIMARY_COLOR} style={styles.noteTypeIcon} />
                    ) : (
                      <FileText size={16} color={PRIMARY_COLOR} style={styles.noteTypeIcon} />
                    )}
                    <Text style={styles.noteTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </View>
                  <Text style={styles.noteDate}>
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Notes</Text>
            <Text style={styles.emptySubtitle}>
              No notes were created on this date. Tap the + button to create a new note.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}