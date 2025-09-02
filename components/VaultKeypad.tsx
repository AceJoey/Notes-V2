import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ArrowLeft, Delete } from 'lucide-react-native';
import { useTheme, PRIMARY_COLOR } from '../theme/ThemeContext';
import { StorageHelper } from '../utils/storage';

interface VaultKeypadProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function getStyles(theme: string) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 60,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme === 'dark' ? '#333' : '#e5e7eb',
    },
    backButton: {
      padding: 8,
      marginRight: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: theme === 'dark' ? '#fff' : '#222',
      flex: 1,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    subtitle: {
      fontSize: 16,
      color: theme === 'dark' ? '#ccc' : '#666',
      textAlign: 'center',
      marginBottom: 48,
    },
    pinDisplay: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 60,
    },
    pinDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: PRIMARY_COLOR,
      marginHorizontal: 12,
    },
    pinDotFilled: {
      backgroundColor: PRIMARY_COLOR,
    },
    keypad: {
      width: '100%',
      maxWidth: 300,
    },
    keypadRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    keypadButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f3f4f6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    keypadButtonText: {
      fontSize: 28,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#222',
    },
    deleteButton: {
      backgroundColor: 'transparent',
    },
    confirmButton: {
      backgroundColor: PRIMARY_COLOR,
      paddingHorizontal: 40,
      paddingVertical: 18,
      borderRadius: 16,
      marginTop: 40,
    },
    confirmButtonText: {
      color: '#fff',
      fontSize: 20,
      fontWeight: '600',
    },
    confirmButtonDisabled: {
      backgroundColor: '#666',
    },
  });
}

export default function VaultKeypad({ visible, onClose, onSuccess }: VaultKeypadProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasExistingPin, setHasExistingPin] = useState(false);

  useEffect(() => {
    if (visible) {
      checkExistingPin();
      setPin('');
      setConfirmPin('');
      setIsConfirming(false);
    }
  }, [visible]);

  const checkExistingPin = async () => {
    const settings = await StorageHelper.getSettings();
    const existingPin = settings.vaultPin;
    setHasExistingPin(!!existingPin);
    setIsSettingPin(!existingPin);
  };

  const handleNumberPress = (number: string) => {
    if (isConfirming) {
      if (confirmPin.length < 6) {
        setConfirmPin(confirmPin + number);
      }
    } else {
      if (pin.length < 6) {
        setPin(pin + number);
      }
    }
  };

  const handleDelete = () => {
    if (isConfirming) {
      setConfirmPin(confirmPin.slice(0, -1));
    } else {
      setPin(pin.slice(0, -1));
    }
  };

  const handleConfirm = async () => {
    if (isSettingPin) {
      if (!isConfirming) {
        if (pin.length >= 4) {
          setIsConfirming(true);
        } else {
          Alert.alert('Invalid PIN', 'PIN must be at least 4 digits');
        }
      } else {
        if (pin === confirmPin) {
          const settings = await StorageHelper.getSettings();
          await StorageHelper.saveSettings({ ...settings, vaultPin: pin });
          onSuccess();
          handleClose();
        } else {
          Alert.alert('PIN Mismatch', 'PINs do not match. Please try again.');
          setPin('');
          setConfirmPin('');
          setIsConfirming(false);
        }
      }
    } else {
      const settings = await StorageHelper.getSettings();
      if (pin === settings.vaultPin) {
        onSuccess();
        handleClose();
      } else {
        Alert.alert('Incorrect PIN', 'Please try again.');
        setPin('');
      }
    }
  };

  const handleClose = () => {
    setPin('');
    setConfirmPin('');
    setIsConfirming(false);
    onClose();
  };

  const getTitle = () => {
    if (isSettingPin) {
      return isConfirming ? 'Confirm PIN' : 'Set Vault PIN';
    }
    return 'Enter Vault PIN';
  };

  const getSubtitle = () => {
    if (isSettingPin) {
      return isConfirming ? 'Re-enter your PIN to confirm' : 'Create a PIN to secure your vault';
    }
    return 'Enter your PIN to access the vault';
  };

  const currentPin = isConfirming ? confirmPin : pin;

  const keypadNumbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'delete'],
  ];

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleClose}>
          <ArrowLeft size={28} color={theme === 'dark' ? '#fff' : '#222'} />
        </TouchableOpacity>
        <Text style={styles.title}>{getTitle()}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>{getSubtitle()}</Text>

        <View style={styles.pinDisplay}>
          {Array.from({ length: 6 }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.pinDot,
                index < currentPin.length && styles.pinDotFilled,
              ]}
            />
          ))}
        </View>

        <View style={styles.keypad}>
          {keypadNumbers.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map((key, keyIndex) => (
                <TouchableOpacity
                  key={keyIndex}
                  style={[
                    styles.keypadButton,
                    key === 'delete' && styles.deleteButton,
                  ]}
                  onPress={() => {
                    if (key === 'delete') {
                      handleDelete();
                    } else if (key !== '') {
                      handleNumberPress(key);
                    }
                  }}
                  activeOpacity={0.7}
                  disabled={key === ''}
                >
                  {key === 'delete' ? (
                    <Delete size={28} color={theme === 'dark' ? '#fff' : '#222'} />
                  ) : key !== '' ? (
                    <Text style={styles.keypadButtonText}>{key}</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {currentPin.length >= 4 && (
          <TouchableOpacity
            style={[
              styles.confirmButton,
              currentPin.length < 4 && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            activeOpacity={0.7}
          >
            <Text style={styles.confirmButtonText}>
              {isSettingPin ? (isConfirming ? 'Confirm' : 'Continue') : 'Access Vault'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}