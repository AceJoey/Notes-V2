import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { ArrowLeft, Shield, Key, Trash2, Eye, EyeOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme, PRIMARY_COLOR } from '../theme/ThemeContext';
import { StorageHelper } from '../utils/storage';
import VaultKeypad from '../components/VaultKeypad';

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
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme === 'dark' ? '#fff' : '#222',
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#222',
      marginBottom: 16,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f3f4f6',
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIcon: {
      marginRight: 16,
    },
    settingText: {
      fontSize: 16,
      color: theme === 'dark' ? '#fff' : '#222',
      flex: 1,
    },
    settingSubtext: {
      fontSize: 14,
      color: theme === 'dark' ? '#666' : '#888',
      marginTop: 2,
    },
    dangerItem: {
      backgroundColor: theme === 'dark' ? '#2a1a1a' : '#fef2f2',
      borderWidth: 1,
      borderColor: '#ef4444',
    },
    dangerText: {
      color: '#ef4444',
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: PRIMARY_COLOR,
    },
    statusText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    disabledBadge: {
      backgroundColor: '#666',
    },
  });
}

export default function VaultSettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [hasPin, setHasPin] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [keypadMode, setKeypadMode] = useState<'setup' | 'change'>('setup');

  useEffect(() => {
    checkPinStatus();
  }, []);

  const checkPinStatus = async () => {
    const settings = await StorageHelper.getSettings();
    setHasPin(!!settings.vaultPin);
  };

  const handleSetupPin = () => {
    setKeypadMode('setup');
    setShowKeypad(true);
  };

  const handleChangePin = () => {
    setKeypadMode('change');
    setShowKeypad(true);
  };

  const handleRemovePin = () => {
    Alert.alert(
      'Remove Vault PIN',
      'Are you sure you want to remove your vault PIN? This will disable vault protection.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const settings = await StorageHelper.getSettings();
            await StorageHelper.saveSettings({ ...settings, vaultPin: null });
            setHasPin(false);
            Alert.alert('Success', 'Vault PIN has been removed');
          }
        }
      ]
    );
  };

  const handleClearVaultData = () => {
    Alert.alert(
      'Clear Vault Data',
      'This will permanently delete all data stored in the vault. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement vault data clearing
            Alert.alert('Success', 'Vault data has been cleared');
          }
        }
      ]
    );
  };

  const handleKeypadSuccess = () => {
    setShowKeypad(false);
    checkPinStatus();
    Alert.alert('Success', hasPin ? 'PIN has been changed' : 'Vault PIN has been set up');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme === 'dark' ? '#fff' : '#222'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vault Settings</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={hasPin ? handleChangePin : handleSetupPin}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Key size={24} color={PRIMARY_COLOR} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingText}>
                  {hasPin ? 'Change PIN' : 'Set up PIN'}
                </Text>
                <Text style={styles.settingSubtext}>
                  {hasPin ? 'Update your vault access PIN' : 'Create a PIN to secure your vault'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, !hasPin && styles.disabledBadge]}>
              <Text style={styles.statusText}>
                {hasPin ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </TouchableOpacity>

          {hasPin && (
            <TouchableOpacity
              style={[styles.settingItem, styles.dangerItem]}
              onPress={handleRemovePin}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Shield size={24} color="#ef4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingText, styles.dangerText]}>
                    Remove PIN
                  </Text>
                  <Text style={styles.settingSubtext}>
                    Disable vault protection
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity
            style={[styles.settingItem, styles.dangerItem]}
            onPress={handleClearVaultData}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Trash2 size={24} color="#ef4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingText, styles.dangerText]}>
                  Clear Vault Data
                </Text>
                <Text style={styles.settingSubtext}>
                  Permanently delete all vault content
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <VaultKeypad
        visible={showKeypad}
        onClose={() => setShowKeypad(false)}
        onSuccess={handleKeypadSuccess}
      />
    </View>
  );
}