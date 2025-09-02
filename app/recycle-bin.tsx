import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { StorageHelper } from '../utils/storage';
import { ArrowLeft, Trash2, RotateCcw } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';

export default function RecycleBinScreen() {
  const [deletedNotes, setDeletedNotes] = useState([]);
  const { theme } = useTheme();
  const router = useRouter();
  const styles = getStyles(theme);

  useEffect(() => {
    loadDeletedNotes();
  }, []);

  const loadDeletedNotes = async () => {
    const notes = await StorageHelper.getNotes();
    setDeletedNotes(notes.filter(n => n.deletedAt));
  };

  const handleRestore = async (id) => {
    await StorageHelper.updateNote(id, { deletedAt: null });
    loadDeletedNotes();
  };

  const handlePermanentDelete = (id) => {
    Alert.alert(
      'Delete Permanently',
      'This note will be permanently deleted and cannot be recovered. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            await StorageHelper.permanentlyDeleteNote(id);
            loadDeletedNotes();
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.noteCard}>
      <Text style={styles.title}>{item.title || '(Untitled)'}</Text>
      <Text style={styles.date}>Deleted: {new Date(item.deletedAt).toLocaleString()}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.restoreBtn} onPress={() => handleRestore(item.id)}>
          <RotateCcw size={18} color="#10b981" />
          <Text style={styles.restoreText}>Restore</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handlePermanentDelete(item.id)}>
          <Trash2 size={18} color="#e11d48" />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/menu')}>
          <ArrowLeft size={24} color={theme === 'dark' ? '#fff' : '#222'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recycle Bin</Text>
      </View>
      <FlatList
        data={deletedNotes}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={deletedNotes.length === 0 ? styles.emptyContainer : null}
        ListEmptyComponent={<Text style={styles.emptyText}>No deleted notes.</Text>}
      />
    </View>
  );
}

function getStyles(theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 60,
      paddingBottom: 20,
      paddingHorizontal: 16,
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      marginLeft: 16,
      color: theme === 'dark' ? '#fff' : '#222',
    },
    noteCard: {
      backgroundColor: theme === 'dark' ? '#23272f' : '#f3f4f6',
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#222',
    },
    date: {
      fontSize: 12,
      color: '#888',
      marginTop: 4,
    },
    actions: {
      flexDirection: 'row',
      marginTop: 12,
    },
    restoreBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 24,
    },
    restoreText: {
      color: '#10b981',
      marginLeft: 6,
      fontWeight: '600',
    },
    deleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    deleteText: {
      color: '#e11d48',
      marginLeft: 6,
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      color: '#888',
      fontSize: 16,
      marginTop: 40,
      textAlign: 'center',
    },
  });
} 