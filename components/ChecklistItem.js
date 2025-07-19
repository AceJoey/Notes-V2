import React, { useState, forwardRef, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

function getStyles(theme, textSize = 18) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center', // changed from 'flex-start' to 'center'
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
      // marginTop: 2, // removed for better alignment
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
      fontSize: textSize,
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
      fontSize: textSize,
      color: theme === 'dark' ? '#fff' : '#222',
      lineHeight: textSize + 6,
      paddingVertical: 8,
    },
    completedText: {
      textDecorationLine: 'line-through',
      color: '#666',
    },
  });
}

export default forwardRef(function ChecklistItem({ item, onToggle, onUpdate, onDelete, editable = false, autoFocus = false, onSubmitEditing, textSize = 18 }, ref) {
  const { theme } = useTheme();
  const styles = getStyles(theme, textSize);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text || '');
  const inputRef = useRef(null);

  // Allow parent to control focus and blur
  React.useImperativeHandle(ref, () => ({
    focus: () => {
      if (inputRef.current) inputRef.current.focus();
    },
    blur: () => {
      if (inputRef.current) inputRef.current.blur();
    }
  }));

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current && inputRef.current.focus();
      }, 50);
    }
  }, [autoFocus]);

  const handleTextChange = (text) => {
    setEditText(text);
    onUpdate(item.id, text);
  };

  const handleSubmitEditing = () => {
    if (editText.trim() === '') {
      onDelete(item.id);
    } else if (onSubmitEditing) {
      onSubmitEditing();
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
            ref={ref || inputRef}
            style={[styles.textInput, item.completed && styles.completedInput]}
            value={editText}
            onChangeText={handleTextChange}
            onSubmitEditing={handleSubmitEditing}
            placeholder="Enter item text..."
            placeholderTextColor="#666"
            multiline={false}
            blurOnSubmit={false}
            autoFocus={autoFocus}
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
});