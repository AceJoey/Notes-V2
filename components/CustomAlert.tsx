import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { useTheme, PRIMARY_COLOR } from '../theme/ThemeContext';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: Array<{
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress: () => void;
  }>;
  onDismiss?: () => void;
}

export default function CustomAlert({ visible, title, message, buttons, onDismiss }: CustomAlertProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const handleButtonPress = (button: any) => {
    button.onPress();
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleBackdropPress = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleBackdropPress}
      >
        <View style={styles.alertContainer}>
          <View style={styles.alertContent}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            
            <View style={styles.buttonContainer}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    button.style === 'destructive' && styles.destructiveButton,
                    button.style === 'cancel' && styles.cancelButton,
                    buttons.length === 1 && styles.singleButton,
                  ]}
                  onPress={() => handleButtonPress(button)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.buttonText,
                    button.style === 'destructive' && styles.destructiveButtonText,
                    button.style === 'cancel' && styles.cancelButtonText,
                  ]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function getStyles(theme: string) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    alertContainer: {
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff',
      borderRadius: 16,
      padding: 24,
      minWidth: 280,
      maxWidth: 400,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    alertContent: {
      alignItems: 'center',
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme === 'dark' ? '#fff' : '#222',
      marginBottom: 12,
      textAlign: 'center',
    },
    message: {
      fontSize: 16,
      color: theme === 'dark' ? '#ccc' : '#666',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      gap: 12,
    },
    button: {
      flex: 1,
      backgroundColor: PRIMARY_COLOR,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    destructiveButton: {
      backgroundColor: '#ef4444',
    },
    cancelButton: {
      backgroundColor: theme === 'dark' ? '#444' : '#f3f4f6',
    },
    singleButton: {
      maxWidth: 120,
      alignSelf: 'center',
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    destructiveButtonText: {
      color: '#fff',
    },
    cancelButtonText: {
      color: theme === 'dark' ? '#fff' : '#222',
    },
  });
}

// Cross-platform alert function
export const showAlert = (
  title: string,
  message: string,
  buttons: Array<{
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress: () => void;
  }>
): Promise<void> => {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      // Use browser's native confirm/alert for web
      if (buttons.length === 1) {
        alert(`${title}\n\n${message}`);
        buttons[0].onPress();
        resolve();
      } else if (buttons.length === 2) {
        const isConfirmed = confirm(`${title}\n\n${message}`);
        if (isConfirmed) {
          buttons[1].onPress(); // Usually the destructive/confirm button
        } else {
          buttons[0].onPress(); // Usually the cancel button
        }
        resolve();
      } else {
        // Fallback to first button for complex cases
        alert(`${title}\n\n${message}`);
        buttons[0].onPress();
        resolve();
      }
    } else {
      // Use native Alert for mobile
      const { Alert } = require('react-native');
      Alert.alert(title, message, buttons, { cancelable: false });
      resolve();
    }
  });
}; 