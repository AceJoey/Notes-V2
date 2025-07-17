import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, SquareCheck as CheckSquare, FileText } from 'lucide-react-native';
import { CategoryHelpers } from '../utils/categoryHelpers';

export default function NoteCard({ note, categories, onPress, onLongPress }) {
  const categoryColor = CategoryHelpers.getCategoryColor(note.categoryId, categories);
  const formattedDate = CategoryHelpers.formatDate(note.createdAt);

  const getPreview = () => {
    if (note.type === 'checklist') {
      const completedItems = note.items.filter(item => item.completed).length;
      const totalItems = note.items.length;
      return `${completedItems}/${totalItems} completed`;
    }
    return note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '');
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={[styles.colorStrip, { backgroundColor: categoryColor }]} />
      <View style={[styles.content, { backgroundColor: categoryColor + '10' }]}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {note.title}
          </Text>
          <View style={styles.typeIndicator}>
            {note.type === 'checklist' ? (
              <CheckSquare size={16} color="#666" />
            ) : (
              <FileText size={16} color="#666" />
            )}
          </View>
        </View>
        
        <Text style={styles.preview} numberOfLines={2}>
          {getPreview()}
        </Text>
        
        <View style={styles.footer}>
          <View style={styles.dateContainer}>
            <Calendar size={14} color="#666" />
            <Text style={styles.date}>{formattedDate}</Text>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
            <Text style={styles.categoryText}>
              {CategoryHelpers.getCategoryName(note.categoryId, categories)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  colorStrip: {
    width: 6,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  typeIndicator: {
    marginLeft: 8,
  },
  preview: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
});