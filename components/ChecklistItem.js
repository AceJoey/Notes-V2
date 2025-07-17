import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

function getStyles(theme) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginVertical: 4,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: '#666',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      marginTop: 2,
    },
    checkboxCompleted: {
      backgroundColor: '#10b981',
      borderColor: '#10b981',
    },
    inputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    textInput: {
      flex: 1,
      fontSize: 16,
      color: theme === 'dark' ? '#fff' : '#222',
      backgroundColor: 'transparent',
      paddingVertical: 8,
      paddingRight: 8,
      minHeight: 32,
    },
    completedInput: {
      textDecorationLine: 'line-through',
      color: '#666',
    },
    deleteButton: {
      padding: 4,
      marginLeft: 8,
    },
    text: {
      flex: 1,
      fontSize: 16,
      color: theme === 'dark' ? '#fff' : '#222',
      lineHeight: 22,
      paddingVertical: 8,
    },
    completedText: {
      textDecorationLine: 'line-through',
      color: '#666',
    },
  });
}

export default function ChecklistItem({ item, onToggle, onUpdate, onDelete, editable = false }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text || '');

  const handleTextChange = (text) => {
    setEditText(text);
    onUpdate(item.id, text);
  };

  const handleSubmitEditing = () => {
    if (editText.trim() === '') {
      onDelete(item.id);
    }
  };

  const handleKeyPress = ({ nativeEvent }) => {
    if (nativeEvent.key === 'Enter') {
      handleSubmitEditing();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.checkbox, item.completed && styles.checkboxCompleted]}
        onPress={() => onToggle(item.id)}
        activeOpacity={0.7}
      >
        {item.completed && <Check size={16} color="#fff" />}
      </TouchableOpacity>

      {editable ? (
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.textInput, item.completed && styles.completedInput]}
            value={editText}
            onChangeText={handleTextChange}
            onSubmitEditing={handleSubmitEditing}
            onKeyPress={handleKeyPress}
            placeholder="Enter item text..."
            placeholderTextColor="#666"
            multiline={false}
            blurOnSubmit={true}
          />
          <TouchableOpacity 
            onPress={() => onDelete(item.id)} 
            style={styles.deleteButton}
            activeOpacity={0.7}
          >
            <X size={16} color={theme === 'dark' ? '#fff' : '#222'} />
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={[styles.text, item.completed && styles.completedText]}>
          {item.text}
        </Text>
      )}
    </View>
  );
}