import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated, Vibration } from 'react-native';
import { ArrowLeft, Delete } from 'lucide-react-native';
import { useTheme, PRIMARY_COLOR } from '../theme/ThemeContext';
import { StorageHelper } from '../utils/storage';
import { useRouter, useLocalSearchParams } from 'expo-router';

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
    pinDotWrong: {
      borderColor: '#ef4444',
      backgroundColor: '#ef4444',
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

export default function VaultAuthScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const router = useRouter();
  const params = useLocalSearchParams();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasExistingPin, setHasExistingPin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isWrongPin, setIsWrongPin] = useState(false);
  const [isPinMismatch, setIsPinMismatch] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [isVerifyingOldPin, setIsVerifyingOldPin] = useState(false);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // Vibration patterns
  const vibrateCorrect = () => {
    Vibration.vibrate(100); // Single vibration for correct PIN
  };

  const vibrateIncorrect = () => {
    Vibration.vibrate([0, 100, 50, 100]); // Double vibration for incorrect PIN
  };

  useEffect(() => {
    checkExistingPin();
  }, []);

  // Clear PIN when screen is focused (when returning from vault)
  useEffect(() => {
    const clearPinOnFocus = () => {
      setPin('');
      setConfirmPin('');
      setIsConfirming(false);
      setIsWrongPin(false);
      setIsPinMismatch(false);
      setIsChangingPin(false);
      setIsVerifyingOldPin(false);
    };

    // Clear PIN on mount and when returning to this screen
    clearPinOnFocus();
  }, []);

  const checkExistingPin = async () => {
    try {
      const settings = await StorageHelper.getSettings();
      const existingPin = settings.vaultPin;
      setHasExistingPin(!!existingPin);
      
      // Check if we're in change mode
      console.log('VaultAuth: Params:', params);
      console.log('VaultAuth: Mode:', params.mode);
      console.log('VaultAuth: Has existing PIN:', !!existingPin);
      
      if (params.mode === 'change' && existingPin) {
        console.log('VaultAuth: Starting change PIN flow - verifying old PIN');
        setIsVerifyingOldPin(true);
        setIsSettingPin(false);
      } else {
        console.log('VaultAuth: Starting normal flow - setting PIN:', !existingPin);
      setIsSettingPin(!existingPin);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking existing PIN:', error);
      setIsLoading(false);
    }
  };

  const handleNumberPress = (number: string) => {
    console.log('VaultAuth: Number pressed:', number);
    console.log('VaultAuth: States - isSettingPin:', isSettingPin, 'isChangingPin:', isChangingPin, 'isVerifyingOldPin:', isVerifyingOldPin, 'isConfirming:', isConfirming);
    
    if (isSettingPin) {
      // PIN setup flow (no existing PIN)
      console.log('VaultAuth: In PIN setup flow');
      if (isConfirming) {
        if (confirmPin.length < 4) {
          const newConfirmPin = confirmPin + number;
          setConfirmPin(newConfirmPin);
          if (newConfirmPin.length === 4) {
            setTimeout(() => {
              if (pin === newConfirmPin) {
                savePin(pin);
              } else {
                showPinMismatchError();
              }
            }, 100);
          }
        }
      } else {
        if (pin.length < 4) {
          const newPin = pin + number;
          setPin(newPin);
          if (newPin.length === 4) {
            setTimeout(() => {
              setIsConfirming(true);
            }, 100);
          }
        }
      }
    } else if (isChangingPin) {
      // Change PIN flow (after old PIN verification)
      console.log('VaultAuth: In change PIN flow');
    if (isConfirming) {
      if (confirmPin.length < 4) {
        const newConfirmPin = confirmPin + number;
        setConfirmPin(newConfirmPin);
        if (newConfirmPin.length === 4) {
            setTimeout(() => {
              if (pin === newConfirmPin) {
                savePin(pin);
              } else {
                showPinMismatchError();
              }
            }, 100);
          }
        }
      } else {
        if (pin.length < 4) {
          const newPin = pin + number;
          setPin(newPin);
          if (newPin.length === 4) {
            setTimeout(() => {
              setIsConfirming(true);
            }, 100);
          }
        }
      }
    } else if (isVerifyingOldPin) {
      // Verifying old PIN for change PIN flow
      console.log('VaultAuth: In verifying old PIN flow');
      if (pin.length < 4) {
        const newPin = pin + number;
        setPin(newPin);
        if (newPin.length === 4) {
          setTimeout(async () => {
            const settings = await StorageHelper.getSettings();
            console.log('VaultAuth: Verifying old PIN - entered:', newPin, 'stored:', settings.vaultPin);
            if (newPin === settings.vaultPin) {
              // Old PIN verified, now set new PIN
              console.log('VaultAuth: Old PIN verified, moving to new PIN setup');
              vibrateCorrect(); // Single vibration for correct PIN
              setPin('');
              setIsVerifyingOldPin(false);
              setIsChangingPin(true);
            } else {
              console.log('VaultAuth: Old PIN verification failed');
              vibrateIncorrect(); // Double vibration for incorrect PIN
              shakePinDisplay();
            }
          }, 100);
        }
      }
    } else {
      // PIN verification flow (vault access)
      console.log('VaultAuth: In vault access flow');
      if (pin.length < 4) {
        const newPin = pin + number;
        setPin(newPin);
        if (newPin.length === 4) {
          setTimeout(async () => {
            const settings = await StorageHelper.getSettings();
            if (newPin === settings.vaultPin) {
              vibrateCorrect(); // Single vibration for correct PIN
              setPin('');
              router.push('/vault');
            } else {
              vibrateIncorrect(); // Double vibration for incorrect PIN
              shakePinDisplay();
            }
          }, 100);
        }
      }
    }
  };

  const savePin = async (pinToSave: string) => {
    try {
      const settings = await StorageHelper.getSettings();
      await StorageHelper.saveSettings({ ...settings, vaultPin: pinToSave });
      console.log('PIN saved successfully:', pinToSave);
      vibrateCorrect(); // Single vibration for successful PIN save
      Alert.alert('Success', 'Vault PIN has been set successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving PIN:', error);
      Alert.alert('Error', 'Failed to save PIN. Please try again.');
    }
  };

  const showPinMismatchError = () => {
    vibrateIncorrect(); // Double vibration for PIN mismatch
    setIsPinMismatch(true);
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsPinMismatch(false);
      setPin('');
      setConfirmPin('');
      setIsConfirming(false);
    });
  };

  const handleDelete = () => {
    if (isSettingPin) {
      if (isConfirming) {
        setConfirmPin(confirmPin.slice(0, -1));
      } else {
        setPin(pin.slice(0, -1));
      }
    } else if (isChangingPin) {
    if (isConfirming) {
      setConfirmPin(confirmPin.slice(0, -1));
      } else {
        setPin(pin.slice(0, -1));
      }
    } else {
      setPin(pin.slice(0, -1));
    }
  };

  const handleConfirm = async () => {
    if (isSettingPin) {
      if (!isConfirming) {
        // First time setting PIN
        if (pin.length < 4) {
          Alert.alert('Invalid PIN', 'PIN must be exactly 4 digits');
          return;
        }
        setIsConfirming(true);
      } else {
        // Confirming PIN
        if (pin === confirmPin) {
          savePin(pin);
        } else {
          showPinMismatchError();
        }
      }
    } else if (isChangingPin) {
      if (!isConfirming) {
        // First time setting new PIN
        if (pin.length < 4) {
          Alert.alert('Invalid PIN', 'New PIN must be exactly 4 digits');
          return;
        }
        setIsConfirming(true);
      } else {
        // Confirming new PIN
        if (pin === confirmPin) {
          savePin(pin);
        } else {
          showPinMismatchError();
        }
      }
    } else {
      // Verifying existing PIN
      try {
        const settings = await StorageHelper.getSettings();
        if (pin === settings.vaultPin) {
          router.push('/vault');
        } else {
          shakePinDisplay();
        }
      } catch (error) {
        console.error('Error verifying PIN:', error);
        Alert.alert('Error', 'Failed to verify PIN. Please try again.');
      }
    }
  };

  const handleBack = () => {
    router.back();
  };



  const shakePinDisplay = () => {
    setIsWrongPin(true);
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsWrongPin(false);
      setPin('');
    });
  };

  const getTitle = () => {
    if (isSettingPin) {
      return isConfirming ? 'Confirm PIN' : 'Set Vault PIN';
    } else if (isChangingPin) {
      return isConfirming ? 'Confirm New PIN' : 'Set New Vault PIN';
    } else if (isVerifyingOldPin) {
      return 'Verify Current PIN';
    }
    return 'Enter Vault PIN';
  };

  const getSubtitle = () => {
    if (isSettingPin) {
      if (isConfirming) {
        return 'Re-enter your PIN to confirm';
      }
      return 'Create a 4-digit PIN to secure your vault';
    } else if (isChangingPin) {
      if (isConfirming) {
        return 'Re-enter your new PIN to confirm';
      }
      return 'Set a new 4-digit PIN to secure your vault';
    } else if (isVerifyingOldPin) {
      return 'Enter your current PIN to continue';
    }
    return 'Enter your PIN to access the vault';
  };

  const currentPin = isSettingPin && isConfirming ? confirmPin : 
                    isChangingPin && isConfirming ? confirmPin : pin;
  const showError = isWrongPin || isPinMismatch;

  const keypadNumbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'delete'],
  ];

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={28} color={theme === 'dark' ? '#fff' : '#222'} />
          </TouchableOpacity>
          <Text style={styles.title}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={28} color={theme === 'dark' ? '#fff' : '#222'} />
        </TouchableOpacity>
        <Text style={styles.title}>{getTitle()}</Text>
        {__DEV__ && (
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/vault')}>
            <Text style={{ color: '#ffeb3b', fontSize: 12 }}>TEST</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>{getSubtitle()}</Text>



        <Animated.View 
          style={[
            styles.pinDisplay,
            {
              transform: [{ translateX: shakeAnimation }]
            }
          ]}
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.pinDot,
                index < currentPin.length && styles.pinDotFilled,
                showError && styles.pinDotWrong,
              ]}
            />
          ))}
        </Animated.View>

        {isPinMismatch && (
          <Text style={[styles.subtitle, { color: '#ef4444', marginTop: 16 }]}>
            PIN does not match. Please try again.
          </Text>
        )}

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


      </View>
    </View>
  );
} 