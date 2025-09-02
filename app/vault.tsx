import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, FlatList, BackHandler, Alert, Image, Dimensions, PanResponder } from 'react-native';
import { ArrowLeft, FileText, Video, Plus, Lock, Play, Unlock } from 'lucide-react-native';
import { useTheme, PRIMARY_COLOR } from '../theme/ThemeContext';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { StorageHelper } from '../utils/storage';
import { vaultFileSystem } from '../utils/vaultFileSystem';
import PermissionRequest from '../components/PermissionRequest';
import PhotoViewer from '../components/PhotoViewer';
import VideoPlayer from '../components/VideoPlayer';
import SuccessPopup from '../components/SuccessPopup';

const { width: screenWidth } = Dimensions.get('window');

interface VaultNote {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  type: 'text' | 'checklist';
  items: { id: string; text: string; completed: boolean }[];
  createdAt: string;
  updatedAt: string;
  isVaultNote: boolean;
  originalId?: string;
}

// Tab content components
const NotesTab = ({
  theme, 
  onAddPress, 
  vaultNotes,
  onNotePress,
  onNoteUnlock
}: {
  theme: string; 
  onAddPress: () => void; 
  vaultNotes: VaultNote[];
  onNotePress: (note: VaultNote) => void;
  onNoteUnlock: (note: VaultNote) => void;
}) => (
  <View style={getTabStyles(theme).container}>
    {vaultNotes.length === 0 ? (
      <View style={getTabStyles(theme).content}>
        <Text style={getTabStyles(theme).emptyTitle}>Secure Notes</Text>
        <Text style={getTabStyles(theme).emptyText}>
          Your private notes will appear here. They are encrypted and protected by your vault PIN.
        </Text>
      </View>
    ) : (
      <FlatList
        data={vaultNotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={getTabStyles(theme).noteCard}>
          <TouchableOpacity 
              style={getTabStyles(theme).noteContent}
            onPress={() => onNotePress(item)}
            activeOpacity={0.7}
          >
            <Text style={getTabStyles(theme).noteTitle}>{item.title}</Text>
              <Text style={getTabStyles(theme).noteContentText} numberOfLines={2}>
              {item.type === 'checklist' 
                ? `${item.items?.length || 0} items` 
                : item.content
              }
            </Text>
            <Text style={getTabStyles(theme).noteDate}>
              {new Date(item.updatedAt).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
            <TouchableOpacity 
              style={getTabStyles(theme).unlockButton}
              onPress={() => onNoteUnlock(item)}
              activeOpacity={0.7}
            >
              <Unlock size={16} color={PRIMARY_COLOR} />
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={getTabStyles(theme).notesList}
      />
    )}
    <TouchableOpacity style={getTabStyles(theme).fab} onPress={onAddPress} activeOpacity={0.8}>
      <Plus size={24} color="#fff" style={{ marginRight: 6 }} />
      <Lock size={20} color="#fff" />
    </TouchableOpacity>
  </View>
);

const VideosTab = ({ theme, onAddPress, vaultFiles, onVideoPress }: { 
  theme: string; 
  onAddPress: () => void; 
  vaultFiles: any[];
  onVideoPress: (index: number) => void;
}) => {
  const videoFiles = vaultFiles.filter(file => file.type === 'video');
  
  const renderVideoItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity 
      style={getTabStyles(theme).imageGridItem}
      onPress={() => onVideoPress(index)}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: item.path }}
        style={getTabStyles(theme).videoThumbnail}
        resizeMode="cover"
      />
      <View style={getTabStyles(theme).playButtonOverlay}>
        <Play size={24} color="#fff" />
      </View>
      <View style={getTabStyles(theme).imageOverlay}>
        <Text style={getTabStyles(theme).imageDate}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <View style={getTabStyles(theme).container}>
      {videoFiles.length === 0 ? (
        <View style={getTabStyles(theme).content}>
          <Text style={getTabStyles(theme).emptyTitle}>Private Videos</Text>
          <Text style={getTabStyles(theme).emptyText}>
            Your private videos will appear here. They are encrypted and protected by your vault PIN.
          </Text>
        </View>
      ) : (
        <FlatList
          data={videoFiles}
          keyExtractor={(item) => item.filename}
          renderItem={renderVideoItem}
          numColumns={3}
          columnWrapperStyle={getTabStyles(theme).imageGridRow}
          contentContainerStyle={getTabStyles(theme).imageGridList}
          showsVerticalScrollIndicator={false}
        />
      )}
      <TouchableOpacity style={getTabStyles(theme).fab} onPress={onAddPress} activeOpacity={0.8}>
        <Plus size={24} color="#fff" style={{ marginRight: 6 }} />
        <Lock size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const ImagesTab = ({ theme, onAddPress, vaultFiles, onImagePress }: { 
  theme: string; 
  onAddPress: () => void; 
  vaultFiles: any[];
  onImagePress: (index: number) => void;
}) => {
  const imageFiles = vaultFiles.filter(file => file.type === 'image');
  console.log('ImagesTab: All vault files:', vaultFiles);
  console.log('ImagesTab: Filtered image files:', imageFiles);
  
  const renderImageItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity 
      style={getTabStyles(theme).imageGridItem}
      onPress={() => onImagePress(index)}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: item.path }}
        style={getTabStyles(theme).imageThumbnail}
        resizeMode="cover"
      />
      <View style={getTabStyles(theme).imageOverlay}>
        <Text style={getTabStyles(theme).imageDate}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <View style={getTabStyles(theme).container}>
      {imageFiles.length === 0 ? (
        <View style={getTabStyles(theme).content}>
          <Text style={getTabStyles(theme).emptyTitle}>Private Images</Text>
          <Text style={getTabStyles(theme).emptyText}>
            Move images from your device gallery to the vault for secure storage. Original files will be removed from your gallery.
          </Text>
        </View>
      ) : (
        <FlatList
          data={imageFiles}
          keyExtractor={(item) => item.filename}
          renderItem={renderImageItem}
          numColumns={3}
          columnWrapperStyle={getTabStyles(theme).imageGridRow}
          contentContainerStyle={getTabStyles(theme).imageGridList}
          showsVerticalScrollIndicator={false}
        />
      )}
      <TouchableOpacity style={getTabStyles(theme).fab} onPress={onAddPress} activeOpacity={0.8}>
        <Plus size={24} color="#fff" style={{ marginRight: 6 }} />
        <Lock size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

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
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
      borderBottomWidth: 1,
      borderBottomColor: theme === 'dark' ? '#333' : '#e5e7eb',
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 12,
    },
    tabText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    activeTab: {
      borderBottomWidth: 3,
      borderBottomColor: PRIMARY_COLOR,
    },
    activeTabText: {
      color: PRIMARY_COLOR,
    },
    inactiveTabText: {
      color: theme === 'dark' ? '#888' : '#666',
    },
    contentContainer: {
      flex: 1,
    },
  });
}

function getTabStyles(theme: string) {
  return StyleSheet.create({
    container: {
      flex: 1,
      position: 'relative',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme === 'dark' ? '#fff' : '#222',
      textAlign: 'center',
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 16,
      color: theme === 'dark' ? '#ccc' : '#666',
      textAlign: 'center',
      lineHeight: 24,
    },
    notesList: {
      padding: 16,
    },
    noteCard: {
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f8f9fa',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 4,
      borderLeftColor: PRIMARY_COLOR,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    noteContent: {
      flex: 1,
    },
    noteTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#222',
      marginBottom: 8,
    },
    noteContentText: {
      fontSize: 14,
      color: theme === 'dark' ? '#ccc' : '#666',
      marginBottom: 8,
    },
    noteDate: {
      fontSize: 12,
      color: theme === 'dark' ? '#888' : '#999',
    },
    unlockButton: {
      padding: 8,
      marginLeft: 12,
    },
    fab: {
      position: 'absolute',
      bottom: 32,
      left: '50%',
      transform: [{ translateX: -40 }],
      backgroundColor: PRIMARY_COLOR,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 40,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      minWidth: 80,
    },
    filesList: {
      padding: 16,
    },
    fileCard: {
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f8f9fa',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderLeftWidth: 4,
      borderLeftColor: PRIMARY_COLOR,
    },
    fileTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#222',
      marginBottom: 4,
    },
    fileInfo: {
      fontSize: 12,
      color: theme === 'dark' ? '#888' : '#999',
    },
    imageGridList: {
      padding: 8,
    },
    imageGridRow: {
      justifyContent: 'space-between',
      paddingHorizontal: 4,
    },
    imageGridItem: {
      width: '32%',
      aspectRatio: 1,
      marginBottom: 8,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f8f9fa',
    },
    imageThumbnail: {
      width: '100%',
      height: '100%',
    },
    imageOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    imageDate: {
      fontSize: 10,
      color: '#fff',
      textAlign: 'center',
    },
    videoThumbnail: {
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
    },
    playButtonOverlay: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -24 }, { translateY: -24 }],
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#fff',
      zIndex: 10,
    },
  });
}

function VaultScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('notes');
  const [vaultNotes, setVaultNotes] = useState<VaultNote[]>([]);
  const [vaultFiles, setVaultFiles] = useState<any[]>([]);
  const [isFileSystemReady, setIsFileSystemReady] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [showPermissionRequest, setShowPermissionRequest] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [currentVideoPath, setCurrentVideoPath] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Swipe gesture handlers
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt) => {
      // Only handle single finger touches for horizontal swipe
      return evt.nativeEvent.touches.length === 1;
    },
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only handle horizontal swipes, not vertical scrolling
      const { dx, dy } = gestureState;
      return evt.nativeEvent.touches.length === 1 && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
    },
    onPanResponderGrant: () => {
      console.log('Vault: Swipe gesture started');
    },
    onPanResponderMove: (evt, gestureState) => {
      if (evt.nativeEvent.touches.length === 1) {
        console.log('Vault: Swipe move, dx:', gestureState.dx);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (evt.nativeEvent.touches.length === 0) {
        console.log('Vault: Swipe released, dx:', gestureState.dx);
        const swipeThreshold = screenWidth * 0.2; // 20% of screen width
        
        if (gestureState.dx > swipeThreshold) {
          // Swipe right - go to previous tab
          console.log('Vault: Swipe right detected');
          switch (activeTab) {
            case 'videos':
              setActiveTab('notes');
              break;
            case 'images':
              setActiveTab('videos');
              break;
            default:
              break;
          }
        } else if (gestureState.dx < -swipeThreshold) {
          // Swipe left - go to next tab
          console.log('Vault: Swipe left detected');
          switch (activeTab) {
            case 'notes':
              setActiveTab('videos');
              break;
            case 'videos':
              setActiveTab('images');
              break;
            default:
              break;
          }
        } else {
          console.log('Vault: Swipe not strong enough or at boundary');
        }
      }
    },
  });

  useEffect(() => {
    initializeVault();
  }, []);

  // Refresh vault data when screen comes back into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Vault: Screen focused, refreshing vault data...');
      loadVaultNotes();
      loadVaultFiles();
    }, [])
  );

  const initializeVault = async () => {
    try {
      // Clean up any existing duplicate IDs first
      await StorageHelper.cleanupDuplicateIds();
      
      // On web, skip permission checks
      if (Platform.OS === 'web') {
        console.log('Vault: Web platform - skipping permission checks');
        setPermissionsGranted(true);
        setIsFileSystemReady(true);
        
        // Load vault notes
        await loadVaultNotes();
        
        // Load vault files
        await loadVaultFiles();
        
        console.log('Vault initialized successfully on web');
        return;
      }
      
      // Check permissions first (mobile only)
      const permissions = await vaultFileSystem.checkPermissions();
      
      if (!permissions.mediaLibrary) {
        setShowPermissionRequest(true);
        return;
      }
      
      setPermissionsGranted(true);
      
      // Initialize file system
      await vaultFileSystem.initialize();
      setIsFileSystemReady(true);
      
      // Load vault notes
      await loadVaultNotes();
      
      // Load vault files
      await loadVaultFiles();
      
      console.log('Vault initialized successfully');
    } catch (error) {
      console.error('Error initializing vault:', error);
      Alert.alert('Error', 'Failed to initialize vault file system');
    }
  };

  const handleRequestPermissions = async () => {
    try {
      // On web, no permissions needed
      if (Platform.OS === 'web') {
        setPermissionsGranted(true);
        setShowPermissionRequest(false);
        await initializeVault();
        return;
      }
      
      const permissions = await vaultFileSystem.requestPermissions();
      
      if (permissions.mediaLibrary) {
        setPermissionsGranted(true);
        setShowPermissionRequest(false);
        await initializeVault();
      } else {
        Alert.alert('Permissions Required', 'Media library permissions are required to use the vault features.');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request permissions');
    }
  };

  // Override native back button behavior
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Navigate directly to homepage instead of going back to PIN modal
      router.push('/(tabs)');
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, [router]);

  const loadVaultNotes = async () => {
    try {
      const notes = await StorageHelper.getVaultNotes();
      setVaultNotes(notes);
    } catch (error) {
      console.error('Error loading vault notes:', error);
    }
  };

  const loadVaultFiles = async () => {
    try {
      console.log('Vault: Loading vault files...');
      
      // Debug: Get vault info to see what's actually in the directories
      const vaultInfo = await vaultFileSystem.getVaultInfo();
      console.log('Vault: Vault info:', vaultInfo);
      
      const files = await vaultFileSystem.getVaultFiles();
      console.log('Vault: Loaded files:', files);
      setVaultFiles(files);
    } catch (error) {
      console.error('Error loading vault files:', error);
    }
  };

  const handleBack = () => {
    // Navigate directly to homepage instead of going back to PIN modal
    router.push('/(tabs)');
  };

  const handleNotePress = (note: VaultNote) => {
    router.push({ pathname: '/note-editor', params: { noteId: note.id, fromVault: 'true' } });
  };

  const handleNoteUnlock = async (note: VaultNote) => {
    try {
      console.log('Vault: Attempting to unlock note:', note.id);
      
      Alert.alert(
        'Unlock Note',
        'Are you sure you want to unlock this note? It will be moved back to your regular notes and removed from the vault.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unlock',
            style: 'default',
            onPress: async () => {
              try {
                // Move note from vault back to regular notes
                const result = await StorageHelper.moveNoteFromVault(note.id);
                
                if (result.success) {
                  console.log('Vault: Note unlocked successfully:', result.note);
                  setSuccessMessage('Note has been unlocked and moved back to your regular notes.');
                  setShowSuccessPopup(true);
                  
                  // Refresh the vault notes list
                  await loadVaultNotes();
                } else {
                  console.log('Vault: Note unlock failed');
                  Alert.alert('Error', 'Failed to unlock note. Please try again.');
                }
              } catch (error) {
                console.error('Vault: Error unlocking note:', error);
                Alert.alert('Error', 'Failed to unlock note. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Vault: Error in unlock dialog:', error);
      Alert.alert('Error', 'Failed to unlock note. Please try again.');
    }
  };

  const tabs = [
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'images', label: 'Images', icon: Image },
  ];

  // Handle add button press for each tab
  const handleAddPress = async () => {
    if (activeTab === 'notes') {
      console.log('Vault: Showing import dialog for notes...');
      // Show import dialog for notes
      Alert.alert(
        'Import Notes to Vault',
        'Select notes from your regular notes to move them to the vault. The original notes will be removed from your regular notes and will only be accessible through the vault.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              console.log('Vault: User cancelled the import operation');
            }
          },
          {
            text: 'Import Notes',
            style: 'default',
            onPress: async () => {
              console.log('Vault: User confirmed import operation, navigating to note selection...');
              try {
                // Navigate to a note selection screen
                router.push('/vault-note-import');
              } catch (error) {
                console.error('Vault: Error navigating to note import:', error);
                Alert.alert('Error', 'Failed to open note import screen. Please try again.');
              }
            },
          },
        ]
      );
    } else if (activeTab === 'images') {
      console.log('Vault: Showing confirmation dialog for moving images...');
      // Show confirmation dialog for moving images
      Alert.alert(
        'Move Image to Vault',
        'This will move the selected image from your device gallery to the vault. The original file will be removed from your gallery and will only be accessible through the vault.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              console.log('Vault: User cancelled the move operation');
            }
          },
          {
            text: 'Move to Vault',
            style: 'destructive',
            onPress: async () => {
              console.log('Vault: User confirmed move operation, starting image picker...');
              try {
                console.log('Vault: Adding image to vault...');
                const result = await vaultFileSystem.pickAndStoreImage();
                
                if (result.success) {
                  console.log('Vault: Image moved successfully:', result.message);
                  Alert.alert('Success', result.message);
                  
                  // Refresh the vault files list
                  await loadVaultFiles();
                } else {
                  console.log('Vault: Image picker cancelled or failed');
                  // Don't show alert for cancellation
                }
              } catch (error) {
                console.error('Vault: Error moving image:', error);
                Alert.alert('Error', 'Failed to move image to vault. Please check permissions and try again.');
              }
            },
          },
        ]
      );
    } else if (activeTab === 'videos') {
      console.log('Vault: Showing confirmation dialog for moving videos...');
      // Show confirmation dialog for moving videos
      Alert.alert(
        'Move Video to Vault',
        'This will move the selected video from your device gallery to the vault. The original file will be removed from your gallery and will only be accessible through the vault.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              console.log('Vault: User cancelled the video move operation');
            }
          },
          {
            text: 'Move to Vault',
            style: 'destructive',
            onPress: async () => {
              console.log('Vault: User confirmed video move operation, starting video picker...');
              try {
                console.log('Vault: Adding video to vault...');
                const result = await vaultFileSystem.pickAndStoreVideo();
                
                if (result.success) {
                  console.log('Vault: Video moved successfully:', result.message);
                  Alert.alert('Success', result.message);
                  
                  // Refresh the vault files list
                  await loadVaultFiles();
                } else {
                  console.log('Vault: Video picker cancelled or failed');
                  // Don't show alert for cancellation
                }
              } catch (error) {
                console.error('Vault: Error moving video:', error);
                Alert.alert('Error', 'Failed to move video to vault. Please check permissions and try again.');
              }
            },
          },
        ]
      );
    } else {
      // Handle other tabs (notes)
      console.log('Vault: Add pressed for tab:', activeTab);
    }
  };

  const handleImagePress = (index: number) => {
    console.log('handleImagePress: Opening image at index:', index);
    setPhotoViewerIndex(index);
    setShowPhotoViewer(true);
  };

  const handleClosePhotoViewer = () => {
    console.log('handleClosePhotoViewer: Closing photo viewer');
    setShowPhotoViewer(false);
  };

  const handleImageDeleted = (deletedImagePath: string) => {
    console.log('Vault: Image deleted, updating vault files list:', deletedImagePath);
    // Remove the deleted image from the vaultFiles state
    setVaultFiles(prevFiles => prevFiles.filter(file => file.path !== deletedImagePath));
  };

  const handleVideoPress = (index: number) => {
    console.log('handleVideoPress: Opening video at index:', index);
    setPhotoViewerIndex(index);
    setShowVideoPlayer(true);
  };

  const handleCloseVideoPlayer = () => {
    console.log('handleCloseVideoPlayer: Closing video player');
    setShowVideoPlayer(false);
  };

  const handleVideoDeleted = (deletedVideoPath: string) => {
    console.log('Vault: Video deleted, updating vault files list:', deletedVideoPath);
    // Remove the deleted video from the vaultFiles state
    setVaultFiles(prevFiles => prevFiles.filter(file => file.path !== deletedVideoPath));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'notes':
        return <NotesTab theme={theme} onAddPress={handleAddPress} vaultNotes={vaultNotes} onNotePress={handleNotePress} onNoteUnlock={handleNoteUnlock} />;
      case 'videos':
        return <VideosTab theme={theme} onAddPress={handleAddPress} vaultFiles={vaultFiles} onVideoPress={handleVideoPress} />;
      case 'images':
        return <ImagesTab theme={theme} onAddPress={handleAddPress} vaultFiles={vaultFiles} onImagePress={handleImagePress} />;
      default:
        return <NotesTab theme={theme} onAddPress={handleAddPress} vaultNotes={vaultNotes} onNotePress={handleNotePress} onNoteUnlock={handleNoteUnlock} />;
    }
  };

  // Show permission request if permissions not granted
  if (showPermissionRequest) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={28} color={theme === 'dark' ? '#fff' : '#222'} />
          </TouchableOpacity>
          <Text style={styles.title}>Vault</Text>
        </View>
        <PermissionRequest onRequestPermissions={handleRequestPermissions} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={28} color={theme === 'dark' ? '#fff' : '#222'} />
        </TouchableOpacity>
        <Text style={styles.title}>Vault</Text>
      </View>

      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Icon 
                size={20} 
                color={isActive ? PRIMARY_COLOR : (theme === 'dark' ? '#888' : '#666')} 
              />
              <Text 
                style={[
                  styles.tabText,
                  isActive ? styles.activeTabText : styles.inactiveTabText
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.contentContainer} {...panResponder.panHandlers}>
        {renderTabContent()}
      </View>

      {/* Photo Viewer */}
      <PhotoViewer
        visible={showPhotoViewer}
        onClose={handleClosePhotoViewer}
        images={vaultFiles.filter(file => file.type === 'image')}
        initialIndex={photoViewerIndex}
        onImageDeleted={handleImageDeleted}
      />

      {/* Video Player */}
      <VideoPlayer
        visible={showVideoPlayer}
        onClose={handleCloseVideoPlayer}
        videos={vaultFiles.filter(file => file.type === 'video')}
        initialIndex={photoViewerIndex}
        onVideoDeleted={handleVideoDeleted}
      />

      {/* Success Popup */}
      <SuccessPopup
        visible={showSuccessPopup}
        message={successMessage}
        onClose={() => setShowSuccessPopup(false)}
      />
    </View>
  );
}

// Explicit default export
export default VaultScreen; 