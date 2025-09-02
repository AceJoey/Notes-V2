import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

class VaultFileSystem {
  constructor() {
    this.vaultDir = `${FileSystem.documentDirectory}vault/`;
    this.mediaDir = `${this.vaultDir}media/`;
    this.imagesDir = `${this.mediaDir}images/`;
    this.videosDir = `${this.mediaDir}videos/`;
    this.initialized = false;
  }

  // Initialize vault directory structure
  async initialize() {
    try {
      console.log('VaultFileSystem: Initializing vault directories...');
      
      // Create main vault directory
      await this.ensureDirectoryExists(this.vaultDir);
      
      // Create media subdirectories
      await this.ensureDirectoryExists(this.mediaDir);
      await this.ensureDirectoryExists(this.imagesDir);
      await this.ensureDirectoryExists(this.videosDir);
      
      this.initialized = true;
      console.log('VaultFileSystem: Vault directories initialized successfully');
      return true;
    } catch (error) {
      console.error('VaultFileSystem: Error initializing vault directories:', error);
      throw error;
    }
  }

  // Ensure directory exists, create if it doesn't
  async ensureDirectoryExists(dirPath) {
    try {
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
        console.log(`VaultFileSystem: Created directory: ${dirPath}`);
      }
    } catch (error) {
      console.error(`VaultFileSystem: Error ensuring directory exists: ${dirPath}`, error);
      throw error;
    }
  }

  // Request necessary permissions
  async requestPermissions() {
    try {
      console.log('VaultFileSystem: Requesting permissions...');
      
      // On web, no permissions needed for file system operations
      if (Platform.OS === 'web') {
        console.log('VaultFileSystem: Web platform - no permissions required');
        return {
          mediaLibrary: true,
          fileSystem: true
        };
      }
      
      // Request media library permissions with write access for deletion
      const mediaPermission = await MediaLibrary.requestPermissionsAsync(true);
      console.log('VaultFileSystem: Media library permission:', mediaPermission.status);
      
      // Verify we have full permissions including write access
      if (mediaPermission.status === 'granted' && mediaPermission.canAskAgain !== false) {
        console.log('VaultFileSystem: Media library permissions with write access granted');
      } else {
        console.warn('VaultFileSystem: Media library permissions not sufficient for deletion');
        return {
          mediaLibrary: false,
          fileSystem: true,
          error: 'Media library write permissions are required to move files to vault'
        };
      }
      
      return {
        mediaLibrary: mediaPermission.status === 'granted',
        fileSystem: true
      };
    } catch (error) {
      console.error('VaultFileSystem: Error requesting permissions:', error);
      return {
        mediaLibrary: false,
        fileSystem: true,
        error: error.message
      };
    }
  }

  // Check if permissions are granted
  async checkPermissions() {
    try {
      // On web, no permissions needed for file system operations
      if (Platform.OS === 'web') {
        console.log('VaultFileSystem: Web platform - permissions always granted');
        return {
          mediaLibrary: true,
          fileSystem: true
        };
      }
      
      const mediaPermission = await MediaLibrary.getPermissionsAsync(true);
      return {
        mediaLibrary: mediaPermission.status === 'granted',
        fileSystem: true,
        canDelete: mediaPermission.status === 'granted' && mediaPermission.canAskAgain !== false
      };
    } catch (error) {
      console.error('VaultFileSystem: Error checking permissions:', error);
      return { 
        mediaLibrary: false, 
        fileSystem: true, 
        canDelete: false,
        error: error.message 
      };
    }
  }

  // Enhanced method to get asset info from file URI
  async getAssetInfoFromUri(fileUri) {
    try {
      if (Platform.OS === 'web') {
        return null; // Web doesn't have asset IDs
      }
      
      console.log(`VaultFileSystem: Getting asset info for URI: ${fileUri}`);
      
      // First try to get asset info directly from the URI
      try {
        const assetInfo = await MediaLibrary.getAssetInfoAsync(fileUri);
        if (assetInfo && assetInfo.id) {
          console.log(`VaultFileSystem: Found asset info directly: ${assetInfo.id}`);
          return assetInfo;
        }
      } catch (directError) {
        console.log(`VaultFileSystem: Direct asset info lookup failed: ${directError.message}`);
      }
      
      // Fallback: Search through recent assets
      console.log('VaultFileSystem: Searching through recent assets...');
      const recentAssets = await MediaLibrary.getAssetsAsync({
        first: 100,
        mediaType: MediaLibrary.MediaType.all,
        sortBy: MediaLibrary.SortBy.modificationTime
      });
      
      // Try to find matching asset by URI or filename
      const filename = fileUri.split('/').pop();
      const matchingAsset = recentAssets.assets.find(asset => 
        asset.uri === fileUri || 
        (filename && asset.filename === filename)
      );
      
      if (matchingAsset) {
        console.log(`VaultFileSystem: Found matching asset in recent files: ${matchingAsset.id}`);
        return matchingAsset;
      }
      
      console.warn(`VaultFileSystem: No matching asset found for URI: ${fileUri}`);
      return null;
    } catch (error) {
      console.error('VaultFileSystem: Error getting asset info from URI:', error);
      return null;
    }
  }

  // Enhanced deletion method with better error handling
  async deleteOriginalFile(fileUri, assetInfo = null) {
    try {
      console.log(`VaultFileSystem: Attempting to delete original file: ${fileUri}`);
      
      if (Platform.OS === 'web') {
        console.log('VaultFileSystem: Web platform - no original file to delete');
        return { success: true, message: 'File copied to vault (web platform)' };
      }
      
      // Check permissions before attempting deletion
      const permissions = await this.checkPermissions();
      if (!permissions.canDelete) {
        console.warn('VaultFileSystem: Insufficient permissions for deletion');
        return { 
          success: false, 
          message: 'File copied to vault but could not be removed from gallery due to insufficient permissions. Please delete manually.' 
        };
      }
      
      // Get asset info if not provided
      if (!assetInfo) {
        assetInfo = await this.getAssetInfoFromUri(fileUri);
      }
      
      if (!assetInfo || !assetInfo.id) {
        console.warn(`VaultFileSystem: Could not find asset info for deletion: ${fileUri}`);
        return { 
          success: false, 
          message: 'File copied to vault but could not be removed from gallery. Asset not found. Please delete manually.' 
        };
      }
      
      // Attempt to delete the asset
      console.log(`VaultFileSystem: Deleting asset from media library: ${assetInfo.id}`);
      await MediaLibrary.deleteAssetsAsync([assetInfo.id]);
      console.log(`VaultFileSystem: Successfully deleted asset from media library: ${assetInfo.id}`);
      
      return { success: true, message: 'File moved to vault and removed from gallery successfully' };
      
    } catch (error) {
      console.error(`VaultFileSystem: Error deleting original file:`, error);
      
      // Provide specific error messages based on error type
      if (error.message.includes('permission') || error.message.includes('denied')) {
        return { 
          success: false, 
          message: 'File copied to vault but could not be removed from gallery due to permission restrictions. Please delete manually.' 
        };
      } else if (error.message.includes('not found')) {
        return { 
          success: false, 
          message: 'File copied to vault but original file not found in gallery. It may have been moved already.' 
        };
      } else {
        return { 
          success: false, 
          message: 'File copied to vault but could not be removed from gallery. Please delete manually.' 
        };
      }
    }
  }

  // Store a file in the vault (copies the file and deletes original)
  async storeFile(fileUri, type = 'image', assetId = null) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      console.log(`VaultFileSystem: Copying ${type} file to vault: ${fileUri}`);
      
      // Determine target directory based on type
      const targetDir = type === 'video' ? this.videosDir : this.imagesDir;
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      const extension = fileUri.split('.').pop() || 'jpg';
      const filename = `vault_${type}_${timestamp}_${randomId}.${extension}`;
      const targetPath = `${targetDir}${filename}`;
      
      // Copy file to vault directory
      await FileSystem.copyAsync({
        from: fileUri,
        to: targetPath
      });
      
      console.log(`VaultFileSystem: File copied successfully to vault: ${targetPath}`);
      
      // Delete the original file from device media library
      const deletionResult = await this.deleteOriginalFile(fileUri);
      
      return {
        success: deletionResult.success,
        filename: filename,
        path: targetPath,
        type: type,
        timestamp: timestamp,
        originalUri: fileUri,
        assetId: assetId,
        message: deletionResult.message,
        deletionSuccess: deletionResult.success
      };
    } catch (error) {
      console.error('VaultFileSystem: Error copying file to vault:', error);
      throw error;
    }
  }

  // Get list of files in vault
  async getVaultFiles(type = null) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      console.log(`VaultFileSystem: Getting vault files, type: ${type}`);
      
      // Debug: Check if directories exist
      const imagesDirInfo = await FileSystem.getInfoAsync(this.imagesDir);
      const videosDirInfo = await FileSystem.getInfoAsync(this.videosDir);
      console.log('VaultFileSystem: Images directory exists:', imagesDirInfo.exists);
      console.log('VaultFileSystem: Videos directory exists:', videosDirInfo.exists);
      
      let targetDir;
      if (type === 'video') {
        targetDir = this.videosDir;
        return await this.getFilesInDirectory(targetDir);
      } else if (type === 'image') {
        targetDir = this.imagesDir;
        return await this.getFilesInDirectory(targetDir);
      } else {
        // Get all media files
        console.log('VaultFileSystem: Getting all media files...');
        const imageFiles = await this.getFilesInDirectory(this.imagesDir);
        const videoFiles = await this.getFilesInDirectory(this.videosDir);
        const allFiles = [...imageFiles, ...videoFiles];
        console.log('VaultFileSystem: All files combined:', allFiles);
        return allFiles;
      }
    } catch (error) {
      console.error('VaultFileSystem: Error getting vault files:', error);
      throw error;
    }
  }

  // Get files in a specific directory
  async getFilesInDirectory(dirPath) {
    try {
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      if (!dirInfo.exists) {
        return [];
      }
      
      const files = await FileSystem.readDirectoryAsync(dirPath);
      console.log(`VaultFileSystem: Found files in ${dirPath}:`, files);
      console.log(`VaultFileSystem: Directory path: ${dirPath}`);
      console.log(`VaultFileSystem: Number of files found: ${files.length}`);
      const fileDetails = [];
      
      for (const filename of files) {
        const filePath = `${dirPath}${filename}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        console.log(`VaultFileSystem: Checking file: ${filename}, exists: ${fileInfo.exists}, isFile: ${fileInfo.isFile}, isDirectory: ${fileInfo.isDirectory}`);
        if (fileInfo.exists && !fileInfo.isDirectory) {
          const fileType = filename.includes('vault_video_') ? 'video' : 'image';
          const fileDetail = {
            filename: filename,
            path: filePath,
            size: fileInfo.size,
            type: fileType,
            timestamp: this.extractTimestampFromFilename(filename)
          };
          console.log(`VaultFileSystem: Processing file:`, fileDetail);
          fileDetails.push(fileDetail);
        } else {
          console.log(`VaultFileSystem: Skipping file: ${filename} - exists: ${fileInfo.exists}, isDirectory: ${fileInfo.isDirectory}`);
        }
      }
      
      console.log(`VaultFileSystem: Processed ${fileDetails.length} files from ${dirPath}:`, fileDetails);
      
      // Debug: Test accessing the first file if any exist
      if (fileDetails.length > 0) {
        const testFile = fileDetails[0];
        console.log(`VaultFileSystem: Testing access to first file: ${testFile.path}`);
        try {
          const testFileInfo = await FileSystem.getInfoAsync(testFile.path);
          console.log(`VaultFileSystem: Test file info:`, testFileInfo);
        } catch (e) {
          console.error(`VaultFileSystem: Error accessing test file:`, e);
        }
      }
      
      return fileDetails.sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first
    } catch (error) {
      console.error(`VaultFileSystem: Error reading directory: ${dirPath}`, error);
      return [];
    }
  }

  // Extract timestamp from filename
  extractTimestampFromFilename(filename) {
    const match = filename.match(/vault_\w+_(\d+)_/);
    return match ? parseInt(match[1]) : 0;
  }

  // Delete a file from vault
  async deleteFile(filePath) {
    try {
      console.log(`VaultFileSystem: Deleting file: ${filePath}`);
      
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
        console.log(`VaultFileSystem: File deleted successfully: ${filePath}`);
        return true;
      } else {
        console.log(`VaultFileSystem: File not found: ${filePath}`);
        return false;
      }
    } catch (error) {
      console.error('VaultFileSystem: Error deleting file:', error);
      throw error;
    }
  }

  // Get vault directory info
  async getVaultInfo() {
    try {
      const vaultInfo = await FileSystem.getInfoAsync(this.vaultDir);
      const mediaInfo = await FileSystem.getInfoAsync(this.mediaDir);
      const imagesInfo = await FileSystem.getInfoAsync(this.imagesDir);
      const videosInfo = await FileSystem.getInfoAsync(this.videosDir);
      
      return {
        vaultExists: vaultInfo.exists,
        mediaExists: mediaInfo.exists,
        imagesExists: imagesInfo.exists,
        videosExists: videosInfo.exists,
        initialized: this.initialized
      };
    } catch (error) {
      console.error('VaultFileSystem: Error getting vault info:', error);
      return {
        vaultExists: false,
        mediaExists: false,
        imagesExists: false,
        videosExists: false,
        initialized: false
      };
    }
  }

  // Pick image from gallery and store in vault
  async pickAndStoreImage() {
    try {
      console.log('VaultFileSystem: Picking image from gallery...');

      if (Platform.OS === 'web') {
        return await this.pickImageWeb();
      }

      // Check permissions first before launching picker
      const permissions = await this.checkPermissions();
      if (!permissions.mediaLibrary) {
        console.log('VaultFileSystem: Requesting media library permissions...');
        const permissionResult = await this.requestPermissions();
        
        if (!permissionResult.mediaLibrary) {
          return { 
            success: false, 
            message: permissionResult.error || 'Media library permissions are required to move files to vault' 
          };
        }
      }

      // Verify we can delete files
      if (!permissions.canDelete) {
        return { 
          success: false, 
          message: 'Write permissions are required to move files from gallery to vault' 
        };
      }

      // Launch the picker
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: false,
      });

      if (result.canceled || !result.assets?.length) {
        return { success: false, message: 'No image selected' };
      }

      const selectedImage = result.assets[0];
      console.log('VaultFileSystem: Selected image:', selectedImage.uri);

      // Copy the file into vault storage and delete from gallery
      const storedResult = await this.storeFile(selectedImage.uri, 'image');

      return {
        success: storedResult.success,
        originalUri: selectedImage.uri,
        storedFile: storedResult,
        message: storedResult.message,
        deletionSuccess: storedResult.deletionSuccess
      };
    } catch (error) {
      console.error('VaultFileSystem: Error picking and storing image:', error);
      return { success: false, message: error.message };
    }
  }

  // Web-specific image picker
  async pickImageWeb() {
    return new Promise((resolve) => {
      // Create a file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      
      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
          try {
            // Convert file to data URL
            const reader = new FileReader();
            reader.onload = async (e) => {
              const dataUrl = e.target.result;
              console.log('VaultFileSystem: Web image selected:', file.name);
              
              // Move the image to vault
              const storedResult = await this.storeFile(dataUrl, 'image');
              console.log('VaultFileSystem: Web image moved successfully:', storedResult);
              
              resolve({
                success: true,
                originalUri: dataUrl,
                storedFile: storedResult,
                message: 'Image moved to vault successfully'
              });
            };
            reader.readAsDataURL(file);
          } catch (error) {
            console.error('VaultFileSystem: Error processing web image:', error);
            resolve({
              success: false,
              message: 'Failed to process image'
            });
          }
        } else {
          resolve({
            success: false,
            message: 'No image selected'
          });
        }
        
        // Clean up
        document.body.removeChild(input);
      };
      
      // Trigger file selection
      document.body.appendChild(input);
      input.click();
    });
  }

  // Pick video from gallery and store in vault
  async pickAndStoreVideo() {
    try {
      console.log('VaultFileSystem: Picking video from gallery...');

      if (Platform.OS === 'web') {
        return await this.pickVideoWeb();
      }

      // Check permissions first before launching picker
      const permissions = await this.checkPermissions();
      if (!permissions.mediaLibrary) {
        console.log('VaultFileSystem: Requesting media library permissions...');
        const permissionResult = await this.requestPermissions();
        
        if (!permissionResult.mediaLibrary) {
          return { 
            success: false, 
            message: permissionResult.error || 'Media library permissions are required to move files to vault' 
          };
        }
      }

      // Verify we can delete files
      if (!permissions.canDelete) {
        return { 
          success: false, 
          message: 'Write permissions are required to move files from gallery to vault' 
        };
      }

      // Launch the picker for videos
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: false,
      });

      if (result.canceled || !result.assets?.length) {
        return { success: false, message: 'No video selected' };
      }

      const selectedVideo = result.assets[0];
      console.log('VaultFileSystem: Selected video:', selectedVideo.uri);

      // Copy the file into vault storage and delete from gallery
      const storedResult = await this.storeFile(selectedVideo.uri, 'video');

      return {
        success: storedResult.success,
        originalUri: selectedVideo.uri,
        storedFile: storedResult,
        message: storedResult.message,
        deletionSuccess: storedResult.deletionSuccess
      };
    } catch (error) {
      console.error('VaultFileSystem: Error picking and storing video:', error);
      return { success: false, message: error.message };
    }
  }

  // Web-specific video picker
  async pickVideoWeb() {
    return new Promise((resolve) => {
      // Create a file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      input.style.display = 'none';
      
      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
          try {
            // Convert file to data URL
            const reader = new FileReader();
            reader.onload = async (e) => {
              const dataUrl = e.target.result;
              console.log('VaultFileSystem: Web video selected:', file.name);
              
              // Move the video to vault
              const storedResult = await this.storeFile(dataUrl, 'video');
              console.log('VaultFileSystem: Web video moved successfully:', storedResult);
              
              resolve({
                success: true,
                originalUri: dataUrl,
                storedFile: storedResult,
                message: 'Video moved to vault successfully'
              });
            };
            reader.readAsDataURL(file);
          } catch (error) {
            console.error('VaultFileSystem: Error processing web video:', error);
            resolve({
              success: false,
              message: 'Failed to process video'
            });
          }
        } else {
          resolve({
            success: false,
            message: 'No video selected'
          });
        }
        
        // Clean up
        document.body.removeChild(input);
      };
      
      // Trigger file selection
      document.body.appendChild(input);
      input.click();
    });
  }

  // Restore a file from vault back to media library
  async restoreFileFromVault(filePath, type = 'image') {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      console.log(`VaultFileSystem: Restoring ${type} file from vault: ${filePath}`);
      
      // Check if file exists in vault
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        throw new Error('File not found in vault');
      }

      // On web, we can't restore to media library, so we'll just delete from vault
      if (Platform.OS === 'web') {
        console.log('VaultFileSystem: Web platform - deleting file from vault only');
        await FileSystem.deleteAsync(filePath);
        return {
          success: true,
          message: 'File removed from vault (web platform)'
        };
      }

      // For mobile platforms, save to media library
      try {
        console.log(`VaultFileSystem: Saving ${type} to media library...`);
        
        // Save file to media library
        const asset = await MediaLibrary.saveToLibraryAsync(filePath);
        console.log(`VaultFileSystem: File saved to media library with asset ID: ${asset}`);
        
        // Delete file from vault
        await FileSystem.deleteAsync(filePath);
        console.log(`VaultFileSystem: File deleted from vault: ${filePath}`);
        
        return {
          success: true,
          assetId: asset,
          message: `${type} restored to gallery successfully`
        };
      } catch (saveError) {
        console.error(`VaultFileSystem: Error saving ${type} to media library:`, saveError);
        
        // If saving to media library fails, just delete from vault
        try {
          await FileSystem.deleteAsync(filePath);
          console.log(`VaultFileSystem: File deleted from vault after save failure: ${filePath}`);
        } catch (deleteError) {
          console.error(`VaultFileSystem: Error deleting file from vault:`, deleteError);
        }
        
        return {
          success: false,
          message: `Failed to restore ${type} to gallery. File removed from vault.`
        };
      }
    } catch (error) {
      console.error(`VaultFileSystem: Error restoring ${type} from vault:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const vaultFileSystem = new VaultFileSystem();
export default vaultFileSystem; 