import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTheme, PRIMARY_COLOR } from '../theme/ThemeContext';

const PULL_THRESHOLD = 120;

interface VaultPullGestureProps {
  children: React.ReactNode;
  onVaultTrigger: () => void;
}

function getStyles(theme: string) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    pullIndicator: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 100,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
      zIndex: 10,
    },
    pullText: {
      fontSize: 16,
      fontWeight: '600',
      color: PRIMARY_COLOR,
      textAlign: 'center',
    },
    pullSubtext: {
      fontSize: 14,
      color: theme === 'dark' ? '#666' : '#888',
      textAlign: 'center',
      marginTop: 4,
    },
  });
}

export default function VaultPullGesture({ children, onVaultTrigger }: VaultPullGestureProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleScrollEndDrag = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    if (contentOffset.y < -PULL_THRESHOLD) {
      onVaultTrigger();
    }
  };

  const handleScroll = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    if (contentOffset.y < 0) {
      setPullDistance(-contentOffset.y);
    } else {
      setPullDistance(0);
    }
  };

  return (
    <View style={styles.container}>
      {pullDistance > 50 && (
        <View style={styles.pullIndicator}>
          <Text style={styles.pullText}>
            {pullDistance > PULL_THRESHOLD ? 'Release to open vault' : 'Pull down to access vault'}
          </Text>
          <Text style={styles.pullSubtext}>
            Secure vault access
          </Text>
        </View>
      )}
      <ScrollView
        style={{ flex: 1 }}
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={PRIMARY_COLOR}
            colors={[PRIMARY_COLOR]}
          />
        }
      >
        {children}
      </ScrollView>
    </View>
  );
}