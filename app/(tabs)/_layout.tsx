import { Tabs } from 'expo-router';
import { FileText, Calendar, List, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme, PRIMARY_COLOR } from '../../theme/ThemeContext';
import { useState, useEffect } from 'react';
import { View } from 'react-native';
import SwipeableTabView from '../../components/SwipeableTabView';

export default function TabLayout() {
  const { theme } = useTheme();
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [tabsReady, setTabsReady] = useState(false);

  const tabScreens = [
    { name: 'index', title: 'Notes', icon: FileText },
    { name: 'checklists', title: 'Checklists', icon: List },
    { name: 'calendar', title: 'Calendar', icon: Calendar },
  ];

  useEffect(() => {
    // Delay to ensure tabs are ready
    setTimeout(() => setTabsReady(true), 100);
  }, []);

  const handleSwipe = (index: number) => {
    setCurrentTabIndex(index);
  };
  
  if (!tabsReady) {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
            borderTopColor: theme === 'dark' ? '#333' : '#e5e7eb',
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: PRIMARY_COLOR,
          tabBarInactiveTintColor: theme === 'dark' ? '#666' : '#9ca3af',
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Notes',
            tabBarIcon: ({ size, color }) => (
              <FileText size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="checklists"
          options={{
            title: 'Checklists',
            tabBarIcon: ({ size, color }) => (
              <List size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Calendar',
            tabBarIcon: ({ size, color }) => (
              <Calendar size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
            borderTopColor: theme === 'dark' ? '#333' : '#e5e7eb',
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: PRIMARY_COLOR,
          tabBarInactiveTintColor: theme === 'dark' ? '#666' : '#9ca3af',
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Notes',
            tabBarIcon: ({ size, color }) => (
              <FileText size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="checklists"
          options={{
            title: 'Checklists',
            tabBarIcon: ({ size, color }) => (
              <List size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Calendar',
            tabBarIcon: ({ size, color }) => (
              <Calendar size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}