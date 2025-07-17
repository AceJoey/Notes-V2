import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Check, X, CreditCard as Edit3 } from 'lucide-react-native';

export default function ChecklistItem({ item, onToggle, onUpdate, onDelete, editable = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

  const handleSave = () => {
    if (editText.trim()) {
      onUpdate(item.id, editText.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditText(item.text);
    setIsEditing(false);
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

      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.editInput}
            value={editText}
            onChangeText={setEditText}
            onSubmitEditing={handleSave}
            onBlur={handleSave}
            autoFocus
            multiline
            placeholder="Enter item text..."
            placeholderTextColor="#666"
          />
          <View style={styles.editActions}>
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Check size={16} color="#10b981" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
              <X size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.textContainer}>
          <Text style={[styles.text, item.completed && styles.completedText]}>
            {item.text}
          </Text>
          {editable && (
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.actionButton}>
                <Edit3 size={16} color="#3b82f6" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.actionButton}>
                <X size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
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
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  actionButton: {
    padding: 4,
    marginLeft: 4,
  },
  editContainer: {
    flex: 1,
  },
  editInput: {
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  saveButton: {
    padding: 8,
    marginRight: 8,
  },
  cancelButton: {
    padding: 8,
  },
});