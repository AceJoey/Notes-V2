import React, { useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { Lock } from 'lucide-react-native';

const PULL_PROMPT_THRESHOLD = 120;
const PULL_KEYPAD_THRESHOLD = 200;
const VAULT_BLUE = '#3b82f6';

interface VaultPullGestureProps {
  children: React.ReactNode;
  onVaultPromptTrigger: () => void;
  onVaultKeypadTrigger: () => void;
}

function getStyles(theme: string) {
  return StyleSheet.create({
    indicatorContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'flex-end',
      zIndex: 20,
      overflow: 'visible',
      pointerEvents: 'none',
    },
    lockIcon: {
      marginBottom: 8,
    },
    promptText: {
      fontSize: 16,
      fontWeight: '600',
      color: VAULT_BLUE,
      textAlign: 'center',
      marginBottom: 8,
    },
  });
}

export default function VaultPullGesture({ children, onVaultPromptTrigger, onVaultKeypadTrigger }: VaultPullGestureProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const pullDistance = useSharedValue(0);
  const isDragging = useRef(false);
  const triggeredPrompt = useRef(false);
  const triggeredKeypad = useRef(false);

  // Handler to track scroll position and pull gesture
  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    if (y <= 0 && isDragging.current) {
      const dy = -y;
      pullDistance.value = dy;
      if (dy > PULL_KEYPAD_THRESHOLD && !triggeredKeypad.current) {
        triggeredKeypad.current = true;
        runOnJS(onVaultKeypadTrigger)();
      } else if (dy > PULL_PROMPT_THRESHOLD && !triggeredPrompt.current) {
        triggeredPrompt.current = true;
        runOnJS(onVaultPromptTrigger)();
      }
    } else if (y > 0) {
      pullDistance.value = 0;
      triggeredPrompt.current = false;
      triggeredKeypad.current = false;
    }
  };

  const handleScrollBeginDrag = () => {
    isDragging.current = true;
    triggeredPrompt.current = false;
    triggeredKeypad.current = false;
  };

  const handleScrollEndDrag = () => {
    isDragging.current = false;
    pullDistance.value = withSpring(0, { stiffness: 400, damping: 30 });
    triggeredPrompt.current = false;
    triggeredKeypad.current = false;
  };

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    height: pullDistance.value > 0 ? pullDistance.value : 0,
    opacity: pullDistance.value > 10 ? 1 : 0,
  }));

  const getPromptText = (dy: number) => {
    if (dy > PULL_KEYPAD_THRESHOLD) return 'Release to open private folder';
    if (dy > PULL_PROMPT_THRESHOLD) return 'Pull further to open private folder';
    return 'Pull down to open private folder';
  };

  // Only inject scroll props if children is a FlatList or ScrollView
  let content = children;
  if (
    React.isValidElement(children) &&
    (children.type === FlatList || children.type === ScrollView)
  ) {
    const childElement = children as React.ReactElement<any>;
    content = React.cloneElement(childElement, {
      onScroll: (event: any) => {
        handleScroll(event);
        if (childElement.props && typeof childElement.props.onScroll === 'function') childElement.props.onScroll(event);
      },
      onScrollBeginDrag: (event: any) => {
        handleScrollBeginDrag();
        if (childElement.props && typeof childElement.props.onScrollBeginDrag === 'function') childElement.props.onScrollBeginDrag(event);
      },
      onScrollEndDrag: (event: any) => {
        handleScrollEndDrag();
        if (childElement.props && typeof childElement.props.onScrollEndDrag === 'function') childElement.props.onScrollEndDrag(event);
      },
      scrollEventThrottle: 16,
    });
  }

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={[styles.indicatorContainer, animatedIndicatorStyle]}>
        {pullDistance.value > 10 && (
          <>
            <Lock size={48} color={VAULT_BLUE} style={styles.lockIcon} />
            <Text style={styles.promptText}>{getPromptText(pullDistance.value)}</Text>
          </>
        )}
          </Animated.View>
      {content}
    </View>
  );
}