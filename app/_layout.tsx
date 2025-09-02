import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Suppress aria-hidden warning for React Native Web
if (typeof console !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    // Check if any argument contains aria-hidden
    const hasAriaHidden = args.some(arg => 
      typeof arg === 'string' && arg.includes('aria-hidden')
    );
    
    if (hasAriaHidden) {
      return; // Suppress aria-hidden warnings
    }
    originalError.apply(console, args);
  };
}

function LayoutWithTheme() {
  useFrameworkReady();
  const { theme } = useTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff' }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="vault" />
        <Stack.Screen name="vault-auth" />
        <Stack.Screen name="menu" />
        <Stack.Screen name="note-editor" />
        <Stack.Screen name="category-editor" />
        <Stack.Screen name="recycle-bin" />
        <Stack.Screen name="font-size" />
        <Stack.Screen name="vault-settings" />
        <Stack.Screen name="feedback" />
        <Stack.Screen name="default-category" />
      </Stack>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      </View>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LayoutWithTheme />
    </ThemeProvider>
  );
}
