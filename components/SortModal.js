import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity 
} from 'react-native';
import { X, Check, ArrowUp, ArrowDown, Calendar, AlphabeticalOrder as Type, Clock } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

function getStyles(theme) {
  return StyleSheet.create({
    overlay: {
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
      minWidth: 280,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#222',
    },
    closeButton: {
      padding: 4,
    },
    optionGroup: {
      marginBottom: 20,
    },
    groupTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme === 'dark' ? '#fff' : '#222',
      marginBottom: 12,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 4,
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f3f4f6',
    },
    selectedOption: {
      backgroundColor: '#3b82f6' + '20',
      borderWidth: 1,
      borderColor: '#3b82f6',
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionText: {
      fontSize: 16,
      color: theme === 'dark' ? '#fff' : '#222',
      marginLeft: 12,
    },
    selectedOptionText: {
      color: '#3b82f6',
      fontWeight: '500',
    },
  });
}

export default function SortModal({ visible, onClose, currentSort, onSortChange }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const sortOptions = [
    {
      id: 'title-asc',
      label: 'Title A-Z',
      icon: Type,
      group: 'alphabetical'
    },
    {
      id: 'title-desc',
      label: 'Title Z-A',
      icon: Type,
      group: 'alphabetical'
    },
    {
      id: 'created-desc',
      label: 'Newest First',
      icon: Calendar,
      group: 'date'
    },
    {
      id: 'created-asc',
      label: 'Oldest First',
      icon: Calendar,
      group: 'date'
    },
    {
      id: 'updated-desc',
      label: 'Recently Modified',
      icon: Clock,
      group: 'date'
    },
    {
      id: 'updated-asc',
      label: 'Least Recently Modified',
      icon: Clock,
      group: 'date'
    },
  ];

  const groupedOptions = {
    alphabetical: sortOptions.filter(opt => opt.group === 'alphabetical'),
    date: sortOptions.filter(opt => opt.group === 'date'),
  };

  const handleOptionPress = (sortId) => {
    onSortChange(sortId);
    onClose();
  };

  const renderOption = (option) => {
    const Icon = option.icon;
    const isSelected = currentSort === option.id;
    
    return (
      <TouchableOpacity
        key={option.id}
        style={[styles.option, isSelected && styles.selectedOption]}
        onPress={() => handleOptionPress(option.id)}
        activeOpacity={0.7}
      >
        <View style={styles.optionLeft}>
          <Icon 
            size={20} 
            color={isSelected ? '#3b82f6' : '#666'} 
          />
          <Text style={[
            styles.optionText, 
            isSelected && styles.selectedOptionText
          ]}>
            {option.label}
          </Text>
        </View>
        
        {isSelected && <Check size={16} color="#3b82f6" />}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Sort By</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.optionGroup}>
            <Text style={styles.groupTitle}>Alphabetical</Text>
            {groupedOptions.alphabetical.map(renderOption)}
          </View>

          <View style={styles.optionGroup}>
            <Text style={styles.groupTitle}>Date</Text>
            {groupedOptions.date.map(renderOption)}
          </View>
        </View>
      </View>
    </Modal>
  );
}