import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Lock, Shield, AlertTriangle } from 'lucide-react-native';
import { useTheme, PRIMARY_COLOR } from '../theme/ThemeContext';

interface PermissionRequestProps {
  onRequestPermissions: () => void;
  message?: string;
}

export default function PermissionRequest({ onRequestPermissions, message }: PermissionRequestProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Shield size={48} color={PRIMARY_COLOR} />
      </View>
      
      <Text style={styles.title}>Vault Access Required</Text>
      
      <Text style={styles.message}>
        {message || (Platform.OS === 'web' 
          ? 'To store encrypted media files in your vault, click the button below to initialize the vault system.'
          : 'To store encrypted media files in your vault, we need permission to access your media library.'
        )}
      </Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={onRequestPermissions}
        activeOpacity={0.8}
      >
        <Lock size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.buttonText}>
          {Platform.OS === 'web' ? 'Initialize Vault' : 'Grant Permissions'}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.infoContainer}>
        <AlertTriangle size={16} color={theme === 'dark' ? '#888' : '#666'} />
        <Text style={styles.infoText}>
          Your files will be stored securely in the vault directory
        </Text>
      </View>
    </View>
  );
}

function getStyles(theme: string) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
    },
    iconContainer: {
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: theme === 'dark' ? '#fff' : '#222',
      textAlign: 'center',
      marginBottom: 16,
    },
    message: {
      fontSize: 16,
      color: theme === 'dark' ? '#ccc' : '#666',
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
    },
    button: {
      backgroundColor: PRIMARY_COLOR,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 12,
      marginBottom: 24,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    infoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    infoText: {
      fontSize: 14,
      color: theme === 'dark' ? '#888' : '#666',
      marginLeft: 8,
      textAlign: 'center',
    },
  });
} 