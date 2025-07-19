import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { View } from 'react-native';

function LayoutWithTheme() {
  useFrameworkReady();
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff' }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LayoutWithTheme />
    </ThemeProvider>
  );
}
