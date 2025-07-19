import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert } from 'react-native';
import { X, Lock } from 'lucide-react-native';
import { PRIMARY_COLOR } from '../theme/ThemeContext';

export default function VaultPromptModal({ visible, onClose }) {
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
            <View style={styles.titleContainer}>
              <Lock size={24} color={PRIMARY_COLOR} />
              <Text style={styles.title}>Vault Detected</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>You've discovered the hidden vault! Pull down further to access it.</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: {
    alignItems: 'center',
  },
  cancelButton: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    minWidth: 120,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});