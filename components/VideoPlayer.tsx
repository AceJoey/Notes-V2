import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, Alert, PanResponder } from 'react-native';
import { X, Play, Pause, ChevronLeft, ChevronRight, RotateCw, Trash2, Unlock, List, Repeat, Maximize, MoreHorizontal, SkipBack, SkipForward, Crop } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useTheme, PRIMARY_COLOR } from '../theme/ThemeContext';
import { vaultFileSystem } from '../utils/vaultFileSystem';
import SuccessPopup from './SuccessPopup';

interface VideoPlayerProps {
  visible: boolean;
  onClose: () => void;
  videos: Array<{
    filename: string;
    path: string;
    type: string;
    timestamp: number;
  }>;
  initialIndex?: number;
  onVideoDeleted?: (deletedVideoPath: string) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function VideoPlayer({ visible, onClose, videos, initialIndex = 0, onVideoDeleted }: VideoPlayerProps) {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const [lastTap, setLastTap] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'backward' | 'forward' | 'play' | 'pause' | null>(null);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'original' | '4:3' | '16:9' | '9:16'>('original');
  const [showAspectRatioFeedback, setShowAspectRatioFeedback] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const videoRef = useRef<Video>(null);

  const styles = getStyles(theme, aspectRatio);

  // Update currentIndex when initialIndex changes
  useEffect(() => {
    if (initialIndex >= 0 && initialIndex < videos.length) {
      // Add small delay to ensure proper cleanup
      const timer = setTimeout(() => {
        setCurrentIndex(initialIndex);
        setIsPlaying(false);
        setShowControls(true);
        setCurrentTime(0);
        setDuration(0);
        setIsVideoLoaded(false);
        setAspectRatio('original');
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [initialIndex, videos.length]);

  // Auto-hide controls after 3 seconds when playing
  useEffect(() => {
    if (showControls && isPlaying) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls, isPlaying]);

  // Reset orientation when component unmounts
  useEffect(() => {
    return () => {
      // Reset to portrait when video player closes
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(console.log);
    };
  }, []);

  // Cleanup video player when component unmounts or video changes
  useEffect(() => {
    return () => {
      // Cleanup video player
      if (videoRef.current) {
        videoRef.current.unloadAsync().catch(console.log);
      }
    };
  }, [currentIndex]);

  // Additional cleanup when modal closes
  useEffect(() => {
    if (!visible) {
      // Cleanup when modal is not visible
      if (videoRef.current) {
        videoRef.current.unloadAsync().catch(console.log);
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setIsVideoLoaded(false);
    }
  }, [visible]);

  // Ensure video shows first frame when loaded
  useEffect(() => {
    if (isVideoLoaded && videoRef.current) {
      // Position video at the beginning to show first frame
      videoRef.current.setPositionAsync(0).catch(console.log);
    }
  }, [isVideoLoaded]);

  // Timer for live updates when video is playing
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isPlaying) {
      interval = setInterval(async () => {
        try {
          const status = await videoRef.current?.getStatusAsync();
          if (status && status.isLoaded) {
            setCurrentTime(status.positionMillis / 1000);
            if (status.durationMillis) {
              setDuration(status.durationMillis / 1000);
            }
          }
        } catch (error) {
          console.log('VideoPlayer: Error getting status:', error);
        }
      }, 100); // Update every 100ms for smoother progress
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying]);

  const handleTimelinePress = (event: any) => {
    const { locationX } = event.nativeEvent;
    const timelineWidth = screenWidth - 120; // Account for padding and time labels
    const percentage = Math.max(0, Math.min(1, locationX / timelineWidth));
    const newTime = percentage * duration;
    
    // Seek to the new time immediately
    videoRef.current?.setPositionAsync(newTime * 1000);
    setCurrentTime(newTime);
  };

  const handleTimelineSeek = (event: any) => {
    if (!isSeeking) return;
    
    const { locationX } = event.nativeEvent;
    const timelineWidth = screenWidth - 120;
    const percentage = Math.max(0, Math.min(1, locationX / timelineWidth));
    const newTime = percentage * duration;
    
    setSeekTime(newTime);
    setCurrentTime(newTime);
  };

  const handleTimelineRelease = async () => {
    if (isSeeking) {
      setIsSeeking(false);
      try {
        await videoRef.current?.setPositionAsync(seekTime * 1000);
        setCurrentTime(seekTime);
      } catch (error) {
        console.log('VideoPlayer: Error seeking to position:', error);
      }
    }
  };

  const handleDoubleTap = (segment: 'left' | 'center' | 'right') => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // 300ms for double tap

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap detected
      switch (segment) {
        case 'left':
          handleBackward();
          setFeedbackType('backward');
          break;
        case 'center':
          handlePlayPause();
          setFeedbackType(isPlaying ? 'pause' : 'play');
          break;
        case 'right':
          handleForward();
          setFeedbackType('forward');
          break;
      }
      
      // Show feedback
      setShowFeedback(true);
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackType(null);
      }, 1000);
      
      setLastTap(0); // Reset for next double tap
    } else {
      setLastTap(now);
    }
  };

  const handleVideoAreaPress = (event: any) => {
    const { locationX } = event.nativeEvent;
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    // In landscape mode, the touch coordinates are still relative to the original screen width
    // So we should always use screenWidth for calculating segments
      const segmentWidth = screenWidth / 3;
      
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap detected
      if (locationX < segmentWidth) {
        handleDoubleTap('left');
      } else if (locationX < segmentWidth * 2) {
        handleDoubleTap('center');
      } else {
        handleDoubleTap('right');
      }
    } else {
      // Single tap - toggle controls (works for both playing and paused)
      setShowControls(!showControls);
      setLastTap(now);
    }
  };

  const handleRotate = async () => {
    try {
      if (isLandscape) {
        // Switch back to portrait
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        setIsLandscape(false);
      } else {
        // Switch to landscape
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        setIsLandscape(true);
      }
      setShowControls(true); // Show controls when rotating
    } catch (error) {
      console.log('VideoPlayer: Error changing orientation:', error);
    }
  };

  const handleAspectRatio = () => {
    const ratios: Array<'original' | '4:3' | '16:9' | '9:16'> = ['original', '4:3', '16:9', '9:16'];
    const currentIndex = ratios.indexOf(aspectRatio);
    const nextIndex = (currentIndex + 1) % ratios.length;
    const newRatio = ratios[nextIndex];
    setAspectRatio(newRatio);
    setShowControls(true); // Show controls when changing aspect ratio
    
    // Debug: Log the new aspect ratio
    console.log('VideoPlayer: Changed aspect ratio to:', newRatio);
    
    // Show brief feedback for non-original ratios
    if (newRatio !== 'original') {
      setShowAspectRatioFeedback(true);
      setTimeout(() => {
        setShowAspectRatioFeedback(false);
      }, 1500);
    }
  };

  // PanResponder for timeline dragging
  const timelinePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      setIsSeeking(true);
      const { locationX } = evt.nativeEvent;
      const timelineWidth = screenWidth - 120;
      const percentage = Math.max(0, Math.min(1, locationX / timelineWidth));
      const newTime = percentage * duration;
      setSeekTime(newTime);
      setCurrentTime(newTime);
    },
    onPanResponderMove: (evt) => {
      if (!isSeeking) return;
      const { locationX } = evt.nativeEvent;
      const timelineWidth = screenWidth - 120;
      const percentage = Math.max(0, Math.min(1, locationX / timelineWidth));
      const newTime = percentage * duration;
      setSeekTime(newTime);
      setCurrentTime(newTime);
    },
    onPanResponderRelease: async () => {
      if (isSeeking) {
        setIsSeeking(false);
        try {
          await videoRef.current?.setPositionAsync(seekTime * 1000);
          setCurrentTime(seekTime);
        } catch (error) {
          console.log('VideoPlayer: Error seeking to position:', error);
        }
      }
    },
  });

  const currentVideo = videos[currentIndex];

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(false);
      setShowControls(true);
      setCurrentTime(0);
      setDuration(0);
      setAspectRatio('original');
    }
  };

  const handleNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(false);
      setShowControls(true);
      setCurrentTime(0);
      setDuration(0);
      setAspectRatio('original');
    }
  };

  const handlePlayPause = () => {
    if (!isVideoLoaded) {
      console.log('VideoPlayer: Video not loaded yet');
      return;
    }
    
    if (isPlaying) {
      videoRef.current?.pauseAsync().catch(console.log);
      setIsPlaying(false);
      setShowControls(true); // Show controls when paused
    } else {
      videoRef.current?.playAsync().catch(console.log);
      setIsPlaying(true);
      setShowControls(true); // Show controls when starting to play
    }
  };

  const handleForward = async () => {
    try {
      const newTime = Math.min(currentTime + 5, duration);
      await videoRef.current?.setPositionAsync(newTime * 1000);
      setCurrentTime(newTime);
    } catch (error) {
      console.log('VideoPlayer: Error seeking forward:', error);
    }
  };

  const handleBackward = async () => {
    try {
      const newTime = Math.max(currentTime - 5, 0);
      await videoRef.current?.setPositionAsync(newTime * 1000);
      setCurrentTime(newTime);
    } catch (error) {
      console.log('VideoPlayer: Error seeking backward:', error);
    }
  };

  const handleVideoLoad = (data: any) => {
    console.log('VideoPlayer: Video loaded successfully');
    setIsVideoLoaded(true);
    if (data.durationMillis) {
      setDuration(data.durationMillis / 1000);
    }
    
    // Ensure video is paused at the beginning to show first frame
    if (videoRef.current) {
      videoRef.current.setPositionAsync(0).catch(console.log);
    }
  };

  const handleVideoError = (error: any) => {
    console.log('VideoPlayer: Video error:', error);
    setIsVideoLoaded(false);
    
    // Suppress timeout errors as they're usually harmless
    if (error?.message?.includes('timed out') || error?.message?.includes('release')) {
      console.log('VideoPlayer: Suppressing timeout error - video should still work');
      return;
    }
    
    // Only show alert for critical errors
    if (error?.message?.includes('not found') || error?.message?.includes('failed to load')) {
      Alert.alert('Error', 'Failed to load video. Please try again.');
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setShowControls(true);
    setCurrentTime(0);
    
    // Reset video position to beginning but keep it paused
    if (videoRef.current) {
      videoRef.current.setPositionAsync(0).then(() => {
        // Ensure video stays paused after resetting position
        videoRef.current?.pauseAsync().catch(console.log);
      }).catch(console.log);
    }
  };

  const handlePlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      // Only update playing state and duration, not current time
      // Current time is handled by the timer for smoother updates
      setIsPlaying(status.isPlaying);
      
      if (status.durationMillis && duration === 0) {
        setDuration(status.durationMillis / 1000);
      }
      
      // Handle video end
      if (status.didJustFinish) {
        setIsPlaying(false);
        setShowControls(true);
        setCurrentTime(0);
        
        // Reset video position to beginning but keep it paused
        if (videoRef.current) {
          videoRef.current.setPositionAsync(0).then(() => {
            // Ensure video stays paused after resetting position
            videoRef.current?.pauseAsync().catch(console.log);
          }).catch(console.log);
        }
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUnlock = async () => {
    console.log('VideoPlayer: Unlock video from vault');
    
    Alert.alert(
      'Unlock Video',
      'Are you sure you want to unlock this video? It will be moved back to your device gallery and removed from the vault.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlock',
          style: 'default',
          onPress: async () => {
            try {
              console.log('VideoPlayer: Unlocking video from vault:', currentVideo.path);
              
              // Restore the video from vault back to media library
              const result = await vaultFileSystem.restoreFileFromVault(currentVideo.path, 'video');
              
              if (result.success) {
                console.log('VideoPlayer: Video unlocked successfully:', result.message);
                setSuccessMessage(result.message);
                setShowSuccessPopup(true);
                
                // Notify parent component to update the videos list
                onVideoDeleted?.(currentVideo.path);
                
                // Close the video player
                onClose();
              } else {
                console.log('VideoPlayer: Video unlock failed:', result.message);
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              console.error('VideoPlayer: Error unlocking video from vault:', error);
              Alert.alert('Error', 'Failed to unlock video from vault. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video from the vault? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('VideoPlayer: Deleting video from vault:', currentVideo.path);
              
              // Delete the file from vault
              await vaultFileSystem.deleteFile(currentVideo.path);
              
              console.log('VideoPlayer: Video deleted successfully from vault');
              
              // Notify parent component to update the videos list
              onVideoDeleted?.(currentVideo.path);
              
              // Close the video player
              onClose();
              
            } catch (error) {
              console.error('VideoPlayer: Error deleting video from vault:', error);
              Alert.alert('Error', 'Failed to delete video from vault. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleVideoPress = () => {
    setShowControls(!showControls);
  };

  if (!visible || !currentVideo) {
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
            <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              ({currentIndex + 1}/{videos.length})
            </Text>
              {(aspectRatio !== 'original' || showAspectRatioFeedback) && (
                <Text style={styles.aspectRatioIndicator}>
                  {aspectRatio}
                </Text>
              )}
            </View>
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

        {/* Video Container */}
        <TouchableOpacity 
          style={styles.videoContainer}
          onPress={handleVideoAreaPress}
          activeOpacity={1}
        >
          <Video
            ref={videoRef}
            source={{ uri: currentVideo.path }}
            style={styles.video}
            useNativeControls={false}
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false}
            shouldPlay={false}
            onLoad={handleVideoLoad}
            onError={handleVideoError}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            posterStyle={styles.videoPoster}
            posterSource={{ uri: currentVideo.path }}
            shouldCorrectPitch={true}
            isMuted={false}
            volume={1.0}
            positionMillis={0}
          />

          {/* Feedback Overlay */}
          {showFeedback && (
            <View style={styles.feedbackOverlay}>
              {feedbackType === 'backward' && (
                <View style={styles.feedbackIconLeft}>
                  <View style={styles.doubleTriangleLeft}>
                    <View style={styles.triangleLeft} />
                    <View style={[styles.triangleLeft, styles.triangleLeftBack]} />
                  </View>
                </View>
              )}
              {feedbackType === 'forward' && (
                <View style={styles.feedbackIconRight}>
                  <View style={styles.doubleTriangleRight}>
                    <View style={styles.triangleRight} />
                    <View style={[styles.triangleRight, styles.triangleRightBack]} />
                  </View>
                </View>
              )}
              {feedbackType === 'play' && (
                <View style={styles.feedbackIconCenter}>
                  <Play size={24} color="#fff" />
                </View>
              )}
              {feedbackType === 'pause' && (
                <View style={styles.feedbackIconCenter}>
                  <Pause size={24} color="#fff" />
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* Controls Overlay */}
        {showControls && (
          <View style={styles.controlsOverlay}>
            {/* Timeline */}
            <View style={styles.timelineContainer}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <TouchableOpacity 
                style={styles.timelineBar}
                onPress={handleTimelinePress}
                activeOpacity={0.8}
              >
                <View style={styles.timelineBackground} />
                <View 
                  style={[
                    styles.timelineProgress, 
                    { width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }
                  ]} 
                />
                <View 
                  style={[
                    styles.timelineScrubber,
                    { left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }
                  ]} 
                />
              </TouchableOpacity>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>

            {/* Control Bar */}
            <View style={styles.controlBar}>
              <TouchableOpacity style={styles.controlButton} onPress={handleAspectRatio}>
                <Crop size={20} color={theme === 'dark' ? '#fff' : '#000'} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.controlButton}
                onPress={handlePrevious}
                disabled={currentIndex === 0}
              >
                <SkipBack size={20} color={currentIndex === 0 ? (theme === 'dark' ? '#666' : '#999') : (theme === 'dark' ? '#fff' : '#000')} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
                {isPlaying ? (
                  <Pause size={24} color={theme === 'dark' ? '#fff' : '#000'} />
                ) : (
                  <Play size={24} color={theme === 'dark' ? '#fff' : '#000'} />
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.controlButton}
                onPress={handleNext}
                disabled={currentIndex === videos.length - 1}
              >
                <SkipForward size={20} color={currentIndex === videos.length - 1 ? (theme === 'dark' ? '#666' : '#999') : (theme === 'dark' ? '#fff' : '#000')} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.controlButton} onPress={handleRotate}>
                <RotateCw size={20} color={theme === 'dark' ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      <SuccessPopup
        visible={showSuccessPopup}
        message={successMessage}
        onClose={() => {
          setShowSuccessPopup(false);
          setSuccessMessage('');
        }}
      />
    </Modal>
  );
}

function getStyles(theme: string, aspectRatio: 'original' | '4:3' | '16:9' | '9:16') {
  const isDark = theme === 'dark';
  const backgroundColor = isDark ? '#000' : '#fff';
  const textColor = isDark ? '#fff' : '#000';
  const overlayColor = isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)';
  const controlBarColor = isDark ? '#000' : '#f5f5f5';
  const timelineBgColor = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
  const buttonBgColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
  const buttonBorderColor = isDark ? '#fff' : '#000';
  const disabledColor = isDark ? '#666' : '#999';

  // Calculate video dimensions based on aspect ratio
  const getVideoDimensions = (): any => {
    if (aspectRatio === 'original') {
      return {
        width: '100%',
        height: '100%',
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      };
    }

    const screenRatio = screenWidth / screenHeight;
    let videoWidth, videoHeight;

    if (aspectRatio === '4:3') {
      const targetRatio = 4/3;
      if (screenRatio > targetRatio) {
        // Screen is wider than 4:3, constrain by height
        videoHeight = screenHeight;
        videoWidth = screenHeight * targetRatio;
      } else {
        // Screen is taller than 4:3, constrain by width
        videoWidth = screenWidth;
        videoHeight = screenWidth / targetRatio;
      }
    } else if (aspectRatio === '16:9') {
      const targetRatio = 16/9;
      if (screenRatio > targetRatio) {
        // Screen is wider than 16:9, constrain by height
        videoHeight = screenHeight;
        videoWidth = screenHeight * targetRatio;
      } else {
        // Screen is taller than 16:9, constrain by width
        videoWidth = screenWidth;
        videoHeight = screenWidth / targetRatio;
      }
    } else if (aspectRatio === '9:16') {
      const targetRatio = 9/16;
      if (screenRatio > targetRatio) {
        // Screen is wider than 9:16, constrain by height
        videoHeight = screenHeight;
        videoWidth = screenHeight * targetRatio;
      } else {
        // Screen is taller than 9:16, constrain by width
        videoWidth = screenWidth;
        videoHeight = screenWidth / targetRatio;
      }
    }

    return {
      width: videoWidth,
      height: videoHeight,
      alignSelf: 'center' as const,
    };
  };

  const videoDimensions = getVideoDimensions();
  
  // Debug: Log the calculated dimensions
  console.log('VideoPlayer: Aspect ratio:', aspectRatio, 'Dimensions:', videoDimensions);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
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
    headerTitleContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: textColor,
    },
    aspectRatioIndicator: {
      fontSize: 12,
      fontWeight: '500',
      color: PRIMARY_COLOR,
      marginLeft: 8,
    },
    headerRight: {
      flexDirection: 'row',
      gap: 8,
    },
    videoContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    video: {
      backgroundColor: isDark ? '#000' : '#f0f0f0',
      ...videoDimensions,
    },
    videoPoster: {
      resizeMode: 'contain',
      backgroundColor: isDark ? '#000' : '#f0f0f0',
      ...videoDimensions,
    },
    controlsOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: overlayColor,
      width: '100%',
    },
    timelineContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    timeText: {
      color: textColor,
      fontSize: 12,
      fontWeight: '500',
      minWidth: 30,
      textAlign: 'center',
    },
    timelineBar: {
      flex: 1,
      height: 20,
      marginHorizontal: 12,
      position: 'relative',
      justifyContent: 'center',
    },
    timelineBackground: {
      position: 'absolute',
      top: 8,
      left: 0,
      right: 0,
      height: 4,
      backgroundColor: timelineBgColor,
      borderRadius: 2,
    },
    timelineProgress: {
      position: 'absolute',
      top: 8,
      left: 0,
      height: 4,
      backgroundColor: PRIMARY_COLOR,
      borderRadius: 2,
    },
    timelineScrubber: {
      position: 'absolute',
      top: 2,
      width: 16,
      height: 16,
      backgroundColor: PRIMARY_COLOR,
      borderRadius: 8,
      borderWidth: 3,
      borderColor: textColor,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    controlBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: controlBarColor,
    },
    controlButton: {
      padding: 8,
      borderRadius: 20,
    },
    playButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: buttonBgColor,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: buttonBorderColor,
    },
    feedbackOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: 10,
    },
    feedbackIconLeft: {
      position: 'absolute',
      left: 0,
      top: '50%',
      transform: [{ translateY: -20 }],
    },
    feedbackIconRight: {
      position: 'absolute',
      right: 0,
      top: '50%',
      transform: [{ translateY: -20 }],
    },
    feedbackIconCenter: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -25 }, { translateY: -25 }],
      width: 50,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: PRIMARY_COLOR,
      borderRadius: 25,
      borderWidth: 3,
      borderColor: 'rgba(255, 255, 255, 0.7)',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    doubleTriangleLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 20,
    },
    triangleLeft: {
      width: 0,
      height: 0,
      borderTopWidth: 8,
      borderBottomWidth: 8,
      borderRightWidth: 12,
      borderStyle: 'solid',
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
      borderRightColor: '#fff',
      marginRight: -4,
    },
    triangleLeftBack: {
      opacity: 0.6,
      marginRight: 0,
    },
    doubleTriangleRight: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 20,
    },
    triangleRight: {
      width: 0,
      height: 0,
      borderTopWidth: 8,
      borderBottomWidth: 8,
      borderLeftWidth: 12,
      borderStyle: 'solid',
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
      borderLeftColor: '#fff',
      marginLeft: -4,
    },
    triangleRightBack: {
      opacity: 0.6,
      marginLeft: 0,
    },
  });
} 