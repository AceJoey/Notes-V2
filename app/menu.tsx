import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, Animated, Easing } from 'react-native';
import { 
  Settings, 
  Palette, 
  Shield, 
  Download, 
  Upload, 
  Trash2, 
  Info,
  ChevronRight,
  Moon,
  Sun,
  ArrowLeft
} from 'lucide-react-native';
import { StorageHelper } from '../utils/storage';
import { useTheme } from '../theme/ThemeContext';
import { useRouter } from 'expo-router';

function getStyles(theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 60,
      paddingBottom: 20,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: theme === 'dark' ? '#fff' : '#222',
    },
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f3f4f6',
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      marginRight: 8,
    },
    statNumber: {
      fontSize: 24,
      fontWeight: '700',
      color: '#3b82f6',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 14,
      color: theme === 'dark' ? '#666' : '#888',
    },
    menuContainer: {
      paddingHorizontal: 16,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f3f4f6',
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    menuItemText: {
      fontSize: 16,
      color: theme === 'dark' ? '#fff' : '#222',
      marginLeft: 16,
    },
    footer: {
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 100,
      marginTop: 'auto',
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f3f4f6',
    },
    footerText: {
      fontSize: 14,
      color: theme === 'dark' ? '#666' : '#888',
      marginBottom: 4,
    },
    footerVersion: {
      fontSize: 12,
      color: theme === 'dark' ? '#444' : '#bbb',
    },
  });
}

export default function MenuScreen() {
  const { theme, setTheme } = useTheme();
  const [notesCount, setNotesCount] = useState(0);
  const styles = getStyles(theme);
  const router = useRouter();

  // Animated value for footer background
  const anim = useRef(new Animated.Value(theme === 'dark' ? 0 : 1)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: theme === 'dark' ? 0 : 1,
      duration: 400,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [theme]);

  const footerBg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#1a1a1a', '#f3f4f6'],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const loadedNotes = await StorageHelper.getNotes();
      setNotesCount(loadedNotes.length);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleThemeToggle = async (value) => {
    setTheme(value ? 'dark' : 'light');
  };

  const handleExportNotes = async () => {
    try {
      const notes = await StorageHelper.getNotes();
      const categories = await StorageHelper.getCategories();
      
      const exportData = {
        notes,
        categories,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };
      
      Alert.alert(
        'Export Successful',
        `Exported ${notes.length} notes and ${categories.length} categories.\n\nNote: In a production app, this would save to a file or cloud service.`,
        [{ text: 'OK' }]
      );
      
      console.log('Export data:', exportData);
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export notes');
    }
  };

  const handleImportNotes = () => {
    Alert.alert(
      'Import Notes',
      'This feature will be implemented in a future version. It will allow you to import notes from backup files.',
      [{ text: 'OK' }]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all notes and categories? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageHelper.saveNotes([]);
              await StorageHelper.saveCategories([]);
              setNotesCount(0);
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        }
      ]
    );
  };

  const handleVaultSettings = () => {
    Alert.alert(
      'Vault Settings',
      'Vault functionality will be available in Phase 2. This will include:\n\n• PIN setup and management\n• Secure file storage\n• Access control settings\n• Backup and recovery options',
      [{ text: 'OK' }]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About Notein',
      'Notein v1.0.0 - Phase 1 MVP\n\nA secure note-taking app with hidden vault functionality.\n\nDeveloped with React Native and Expo.\n\nFeatures:\n• Note and checklist management\n• Category organization\n• Calendar view\n• Dark/light theme\n• Secure vault (coming soon)',
      [{ text: 'OK' }]
    );
  };

  const menuItems = [
    {
      title: 'Theme',
      icon: theme === 'dark' ? Moon : Sun,
      type: 'toggle',
      value: theme === 'dark',
      onToggle: handleThemeToggle,
    },
    {
      title: 'Vault Settings',
      icon: Shield,
      type: 'button',
      onPress: handleVaultSettings,
    },
    {
      title: 'Export Notes',
      icon: Download,
      type: 'button',
      onPress: handleExportNotes,
    },
    {
      title: 'Import Notes',
      icon: Upload,
      type: 'button',
      onPress: handleImportNotes,
    },
    {
      title: 'Clear All Data',
      icon: Trash2,
      type: 'button',
      onPress: handleClearAllData,
      color: '#ef4444',
    },
    {
      title: 'About',
      icon: Info,
      type: 'button',
      onPress: handleAbout,
    },
  ];

  const renderMenuItem = (item, index) => {
    const Icon = item.icon;
    
    return (
      <TouchableOpacity
        key={index}
        style={styles.menuItem}
        onPress={item.onPress}
        activeOpacity={0.7}
        disabled={item.type === 'toggle'}
      >
        <View style={styles.menuItemLeft}>
          <Icon size={24} color={item.color || '#666'} />
          <Text style={[styles.menuItemText, item.color && { color: item.color }]}> 
            {item.title}
          </Text>
        </View>
        
        {item.type === 'toggle' ? (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: '#333', true: '#3b82f6' }}
            thumbColor={item.value ? '#fff' : '#ccc'}
          />
        ) : (
          <ChevronRight size={20} color="#666" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={{ position: 'absolute', left: 8, top: 60, zIndex: 10 }} onPress={() => router.back()}>
          <ArrowLeft size={28} color={theme === 'dark' ? '#fff' : '#222'} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{notesCount}</Text>
          <Text style={styles.statLabel}>Total Notes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>Phase 1</Text>
          <Text style={styles.statLabel}>Version</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => renderMenuItem(item, index))}
      </View>

      <Animated.View style={[styles.footer, { backgroundColor: footerBg }]}>
        <Text style={styles.footerText}>
          Notes V - Secure Notes App
        </Text>
        <Text style={styles.footerVersion}>
          Version 1.0.0 - Phase 1 MVP
        </Text>
      </Animated.View>
    </View>
  );
} 