import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, Image, PanResponder, Alert } from 'react-native';
import { X, ChevronLeft, ChevronRight, RotateCw, Unlock, Trash2 } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { vaultFileSystem } from '../utils/vaultFileSystem';
import SuccessPopup from './SuccessPopup';

interface PhotoViewerProps {
  visible: boolean;
  onClose: () => void;
  images: Array<{
    filename: string;
    path: string;
    type: string;
    timestamp: number;
  }>;
  initialIndex?: number;
  onImageDeleted?: (deletedImagePath: string) => void; // Callback to update parent component
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function PhotoViewer({ visible, onClose, images, initialIndex = 0, onImageDeleted }: PhotoViewerProps) {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [initialPinchDistance, setInitialPinchDistance] = useState(0);
  const [isPinching, setIsPinching] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [baseScale, setBaseScale] = useState(1); // Store the scale before pinch started
  const [baseTranslateX, setBaseTranslateX] = useState(0);
  const [baseTranslateY, setBaseTranslateY] = useState(0);
  const [initialTouchX, setInitialTouchX] = useState(0);
  const [initialTouchY, setInitialTouchY] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [successPopupVisible, setSuccessPopupVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [lastTapTime, setLastTapTime] = useState(0);
  const [doubleTapTimeout, setDoubleTapTimeout] = useState<number | null>(null);

  const styles = getStyles(theme);

  // Update currentIndex when initialIndex changes
  useEffect(() => {
    if (initialIndex >= 0 && initialIndex < images.length) {
      setCurrentIndex(initialIndex);
      setRotation(0);
      setScale(1);
      setTranslateX(0);
      setTranslateY(0);
      setBaseScale(1);
      setBaseTranslateX(0);
      setBaseTranslateY(0);
      setInitialPinchDistance(0);
      setIsPinching(false);
      setIsPanning(false);
      setShowControls(true);
      // Clear any pending double tap timeout
      if (doubleTapTimeout) {
        clearTimeout(doubleTapTimeout);
        setDoubleTapTimeout(null);
      }
    }
  }, [initialIndex, images.length]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (doubleTapTimeout) {
        clearTimeout(doubleTapTimeout);
      }
    };
  }, [doubleTapTimeout]);

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (showControls) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls]);

  // Handle double-tap zoom
  const handleDoubleTap = () => {
    if (scale > 1) {
      // If zoomed in, zoom out to 1x
      setScale(1);
      setTranslateX(0);
      setTranslateY(0);
      setBaseScale(1);
      setBaseTranslateX(0);
      setBaseTranslateY(0);
      console.log('PhotoViewer: Double tap - zoomed out to 1x');
    } else {
      // If at 1x, zoom in to max (3x)
      setScale(3);
      setTranslateX(0);
      setTranslateY(0);
      setBaseScale(3);
      setBaseTranslateX(0);
      setBaseTranslateY(0);
      console.log('PhotoViewer: Double tap - zoomed in to 3x');
    }
  };

  // Handle tap to toggle controls
  const handleImageTap = () => {
    setShowControls(!showControls);
  };

  // Calculate distance between two touch points
  const getDistance = (touch1: any, touch2: any) => {
    return Math.sqrt(
      Math.pow(touch2.pageX - touch1.pageX, 2) + 
      Math.pow(touch2.pageY - touch1.pageY, 2)
    );
  };

  // Handle touch events for better multi-touch detection
  const handleTouchStart = (evt: any) => {
    const touches = evt.nativeEvent.touches;
    console.log('PhotoViewer: Touch start, touches:', touches.length);
    
    if (touches.length === 2) {
      // Two finger touch - start pinch
      const distance = getDistance(touches[0], touches[1]);
      setInitialPinchDistance(distance);
      setBaseScale(scale); // Store current scale as base
      setBaseTranslateX(translateX);
      setBaseTranslateY(translateY);
      setIsPinching(true);
      setIsPanning(false);
      console.log('PhotoViewer: Pinch started, initial distance:', distance, 'base scale:', scale);
    } else if (touches.length === 1 && scale > 1) {
      // Single finger touch when zoomed in - start panning
      setInitialTouchX(touches[0].pageX);
      setInitialTouchY(touches[0].pageY);
      setBaseTranslateX(translateX);
      setBaseTranslateY(translateY);
      setIsPanning(true);
      setIsPinching(false);
      console.log('PhotoViewer: Panning started');
    }
  };

  const handleTouchMove = (evt: any) => {
    const touches = evt.nativeEvent.touches;
    
    if (touches.length === 2 && isPinching && initialPinchDistance > 0) {
      // Two finger move - handle pinch
      const distance = getDistance(touches[0], touches[1]);
      
      // Calculate scale change relative to initial pinch distance
      const scaleChange = distance / initialPinchDistance;
      
      // Apply scale change to the base scale (scale when pinch started)
      const newScale = Math.max(1, Math.min(3, baseScale * scaleChange));
      
      setScale(newScale);
      console.log('PhotoViewer: Pinch move, distance:', distance, 'scale change:', scaleChange.toFixed(2), 'new scale:', newScale.toFixed(2));
    } else if (touches.length === 1 && isPanning && scale > 1) {
      // Single finger move when zoomed in - handle panning
      const deltaX = touches[0].pageX - initialTouchX;
      const deltaY = touches[0].pageY - initialTouchY;
      
      // Apply panning sensitivity - slower movement for more natural feel
      const panningSensitivity = 0.4; // Adjust this value to control panning speed
      const adjustedDeltaX = deltaX * panningSensitivity;
      const adjustedDeltaY = deltaY * panningSensitivity;
      
      // Calculate new translation
      let newTranslateX = baseTranslateX + adjustedDeltaX;
      let newTranslateY = baseTranslateY + adjustedDeltaY;
      
      // Calculate boundary constraints
      const maxTranslateX = (scale - 1) * screenWidth / 2;
      const maxTranslateY = (scale - 1) * screenHeight / 2;
      
      // Constrain translation to keep image edges within viewport
      newTranslateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, newTranslateX));
      newTranslateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, newTranslateY));
      
      setTranslateX(newTranslateX);
      setTranslateY(newTranslateY);
      console.log('PhotoViewer: Panning move, translateX:', newTranslateX.toFixed(2), 'translateY:', newTranslateY.toFixed(2));
    }
  };

  const handleTouchEnd = (evt: any) => {
    const touches = evt.nativeEvent.touches;
    console.log('PhotoViewer: Touch end, remaining touches:', touches.length);
    
    if (touches.length === 0) {
      // All fingers lifted
      setIsPinching(false);
      setIsPanning(false);
      setInitialPinchDistance(0);
      setBaseScale(scale); // Update base scale to current scale
      setBaseTranslateX(translateX);
      setBaseTranslateY(translateY);
      console.log('PhotoViewer: Touch ended, final scale:', scale, 'final translateX:', translateX, 'final translateY:', translateY);
    }
  };

  // PanResponder for swipe detection and double-tap (single finger only)
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt) => {
      // Handle single finger touches for double-tap (always) and swipe (when not zoomed)
      return evt.nativeEvent.touches.length === 1;
    },
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only handle horizontal swipes when not zoomed, not vertical scrolling
      const { dx, dy } = gestureState;
      return evt.nativeEvent.touches.length === 1 && scale <= 1 && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
    },
    onPanResponderGrant: () => {
      console.log('PhotoViewer: Swipe gesture started');
    },
    onPanResponderMove: (evt, gestureState) => {
      if (evt.nativeEvent.touches.length === 1) {
        console.log('PhotoViewer: Swipe move, dx:', gestureState.dx);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (evt.nativeEvent.touches.length === 0) {
        console.log('PhotoViewer: Touch released, dx:', gestureState.dx);
        
        // Always check for double-tap first
        if (Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10) {
          // Tap detected - check for double tap
          const currentTime = Date.now();
          const timeDiff = currentTime - lastTapTime;
          
          if (timeDiff < 300 && timeDiff > 0) {
            // Double tap detected
            console.log('PhotoViewer: Double tap detected');
            if (doubleTapTimeout) {
              clearTimeout(doubleTapTimeout);
              setDoubleTapTimeout(null);
            }
            handleDoubleTap();
          } else {
            // Single tap - set timeout for potential double tap
            console.log('PhotoViewer: Single tap detected, waiting for double tap');
            if (doubleTapTimeout) {
              clearTimeout(doubleTapTimeout);
            }
            const timeout = setTimeout(() => {
              console.log('PhotoViewer: Single tap confirmed, toggling controls');
              handleImageTap();
              setDoubleTapTimeout(null);
            }, 300);
            setDoubleTapTimeout(timeout);
          }
          setLastTapTime(currentTime);
        } else if (scale <= 1) {
          // Only handle swiping when not zoomed
          const swipeThreshold = screenWidth * 0.2; // 20% of screen width
        
        if (gestureState.dx > swipeThreshold && currentIndex > 0) {
          // Swipe right - go to previous image
          console.log('PhotoViewer: Swipe right detected, going to previous image');
          handlePrevious();
        } else if (gestureState.dx < -swipeThreshold && currentIndex < images.length - 1) {
          // Swipe left - go to next image
          console.log('PhotoViewer: Swipe left detected, going to next image');
          handleNext();
        } else {
          console.log('PhotoViewer: Swipe not strong enough or at boundary');
          }
        }
      }
    },
  });

  const currentImage = images[currentIndex];

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setRotation(0);
      setScale(1);
      setTranslateX(0);
      setTranslateY(0);
      setBaseScale(1);
      setBaseTranslateX(0);
      setBaseTranslateY(0);
      setIsPinching(false);
      setIsPanning(false);
      setInitialPinchDistance(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setRotation(0);
      setScale(1);
      setTranslateX(0);
      setTranslateY(0);
      setBaseScale(1);
      setIsPinching(false);
      setInitialPinchDistance(0);
    }
  };

  const handleRotate = () => {
    setRotation((rotation + 90) % 360);
  };

  const handleReset = () => {
    setRotation(0);
    setScale(1);
    setBaseScale(1);
    setIsPinching(false);
    setInitialPinchDistance(0);
  };

  const handleUnlock = async () => {
    console.log('PhotoViewer: Unlock image from vault');
    
    Alert.alert(
      'Unlock Image',
      'Are you sure you want to unlock this image? It will be moved back to your device gallery and removed from the vault.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlock',
          style: 'default',
          onPress: async () => {
            try {
              console.log('PhotoViewer: Unlocking image from vault:', currentImage.path);
              
              // Restore the image from vault back to media library
              const result = await vaultFileSystem.restoreFileFromVault(currentImage.path, 'image');
              
              if (result.success) {
                console.log('PhotoViewer: Image unlocked successfully:', result.message);
                setSuccessMessage(result.message);
                setSuccessPopupVisible(true);
                
                // Notify parent component to update the images list
                onImageDeleted?.(currentImage.path);
                
                // Close the photo viewer
                onClose();
              } else {
                console.log('PhotoViewer: Image unlock failed:', result.message);
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              console.error('PhotoViewer: Error unlocking image from vault:', error);
              Alert.alert('Error', 'Failed to unlock image from vault. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image from the vault? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('PhotoViewer: Deleting image from vault:', currentImage.path);
              
              // Delete the file from vault
              await vaultFileSystem.deleteFile(currentImage.path);
              
              console.log('PhotoViewer: Image deleted successfully from vault');
              
              // Notify parent component to update the images list
              onImageDeleted?.(currentImage.path);
              
              // Close the photo viewer
              onClose();
              
            } catch (error) {
              console.error('PhotoViewer: Error deleting image from vault:', error);
              Alert.alert('Error', 'Failed to delete image from vault. Please try again.');
            }
          },
        },
      ],
    );
  };

  if (!visible || !currentImage) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        {showControls && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
            <X size={24} color={theme === 'dark' ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            ({currentIndex + 1}/{images.length})
          </Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton} onPress={handleUnlock}>
              <Unlock size={20} color={theme === 'dark' ? '#fff' : '#000'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
              <Trash2 size={20} color={theme === 'dark' ? '#fff' : '#000'} />
            </TouchableOpacity>
          </View>
        </View>
        )}

        {/* Image Container */}
        <View 
          style={styles.imageContainer} 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          {...panResponder.panHandlers}
        >
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: currentImage.path }}
              style={[styles.image, { transform: [{ rotate: `${rotation}deg` }, { scale: scale }, { translateX: translateX }, { translateY: translateY }] }]}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
      <SuccessPopup
        visible={successPopupVisible}
        message={successMessage}
        onClose={() => {
          setSuccessPopupVisible(false);
          setSuccessMessage('');
        }}
      />
    </Modal>
  );
}

function getStyles(theme: string) {
  const isDark = theme === 'dark';
  const backgroundColor = isDark ? '#000' : '#fff';
  const textColor = isDark ? '#fff' : '#000';
  const overlayColor = isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
    },
    header: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 12,
      backgroundColor: overlayColor,
    },
    headerButton: {
      padding: 8,
    },
    headerTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: textColor,
      textAlign: 'center',
      marginHorizontal: 16,
    },
    headerSpacer: {
      width: 40,
    },
    headerRight: {
      flexDirection: 'row',
      gap: 8,
    },
    imageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    imageWrapper: {
      justifyContent: 'center',
      alignItems: 'center',
      width: screenWidth,
      height: screenHeight,
    },
    image: {
      width: screenWidth,
      height: screenHeight,
      resizeMode: 'contain',
    },
    navigationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: overlayColor,
    },
    navButton: {
      padding: 12,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
      borderRadius: 8,
    },
    navButtonDisabled: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    controlsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    controlButton: {
      padding: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
      borderRadius: 6,
    },
    resetText: {
      color: textColor,
      fontSize: 12,
      fontWeight: '600',
    },
    infoContainer: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      backgroundColor: overlayColor,
    },
    infoText: {
      fontSize: 12,
      color: isDark ? '#ccc' : '#666',
      textAlign: 'center',
    },
  });
} 