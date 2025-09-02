import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { ArrowLeft, Shield, Key, Trash2, Eye, EyeOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme, PRIMARY_COLOR } from '../theme/ThemeContext';
import { StorageHelper } from '../utils/storage';


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
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f3f4f6',
      borderRadius: 12,
      padding: 20,
      marginBottom: 8,
      minHeight: 80,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      flex: 1,
    },
    settingIcon: {
      marginRight: 16,
      marginTop: 2,
    },
    settingText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#222',
      flex: 1,
      marginBottom: 4,
    },
    settingSubtext: {
      fontSize: 14,
      color: theme === 'dark' ? '#666' : '#888',
      lineHeight: 18,
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
      alignSelf: 'flex-start',
      marginTop: 2,
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

  useEffect(() => {
    checkPinStatus();
  }, []);

  const checkPinStatus = async () => {
    const settings = await StorageHelper.getSettings();
    setHasPin(!!settings.vaultPin);
  };

  const handleEnterVault = () => {
    router.push('/vault-auth');
  };

  const handleSetupPin = () => {
    router.push('/vault-auth');
  };

  const handleChangePin = () => {
    router.push('/vault-auth?mode=change');
  };


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/menu')}>
          <ArrowLeft size={24} color={theme === 'dark' ? '#fff' : '#222'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vault Settings</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vault Access</Text>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleEnterVault}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Shield size={24} color={PRIMARY_COLOR} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingText}>
                  Enter Vault
                </Text>
                <Text style={styles.settingSubtext}>
                  Access your secure vault content
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

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
        </View>
      </View>


    </View>
  );
}