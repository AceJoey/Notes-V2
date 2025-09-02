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
      
      // Request media library permissions (this covers file access and deletion)
      const mediaPermission = await MediaLibrary.requestPermissionsAsync();
      console.log('VaultFileSystem: Media library permission:', mediaPermission.status);
      
      // Check if we have write permissions (needed for deletion)
      if (mediaPermission.status === 'granted') {
        console.log('VaultFileSystem: Media library write permissions granted');
      } else {
        console.warn('VaultFileSystem: Media library permissions not granted - deletion may fail');
      }
      
      // For file system operations, we only need media library permissions
      // FileSystem operations work within the app's document directory without additional permissions
      return {
        mediaLibrary: mediaPermission.status === 'granted',
        fileSystem: true // FileSystem operations are always allowed in app's document directory
      };
    } catch (error) {
      console.error('VaultFileSystem: Error requesting permissions:', error);
      throw error;
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
      
      const mediaPermission = await MediaLibrary.getPermissionsAsync();
      return {
        mediaLibrary: mediaPermission.status === 'granted',
        fileSystem: true // FileSystem operations are always allowed in app's document directory
      };
    } catch (error) {
      console.error('VaultFileSystem: Error checking permissions:', error);
      return { mediaLibrary: false, fileSystem: true };
    }
  }

  // Get asset ID from file URI (fallback method)
  async getAssetIdFromUri(fileUri) {
    try {
      if (Platform.OS === 'web') {
        return null; // Web doesn't have asset IDs
      }
      
      // Try to find the asset by matching the URI
      const assets = await MediaLibrary.getAssetsAsync({
        first: 1000, // Get a reasonable number of assets
        mediaType: MediaLibrary.MediaType.photo,
        sortBy: MediaLibrary.SortBy.creationTime
      });
      
      // Find the asset with matching URI
      const matchingAsset = assets.assets.find(asset => asset.uri === fileUri);
      if (matchingAsset) {
        console.log(`VaultFileSystem: Found matching asset ID: ${matchingAsset.id}`);
        return matchingAsset.id;
      }
      
      console.warn(`VaultFileSystem: No matching asset found for URI: ${fileUri}`);
      return null;
    } catch (error) {
      console.error('VaultFileSystem: Error getting asset ID from URI:', error);
      return null;
    }
  }

  // Try to delete file from multiple possible locations
  async deleteFileFromDevice(fileUri) {
    try {
      console.log(`VaultFileSystem: Attempting comprehensive file deletion for: ${fileUri}`);
      
      // Method 1: Try to delete the original URI directly
      try {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
        console.log(`VaultFileSystem: Successfully deleted file at original URI: ${fileUri}`);
        return true;
      } catch (error) {
        console.log(`VaultFileSystem: Failed to delete at original URI: ${fileUri}`, error.message);
      }
      
      // Method 2: Try to find and delete from common media directories
      if (Platform.OS === 'android') {
        const possiblePaths = [
          '/storage/emulated/0/DCIM/Camera/',
          '/storage/emulated/0/Pictures/',
          '/storage/emulated/0/Download/',
          '/storage/emulated/0/Images/'
        ];
        
        // Extract filename from URI
        const filename = fileUri.split('/').pop();
        if (filename) {
          for (const basePath of possiblePaths) {
            const fullPath = basePath + filename;
            try {
              const fileInfo = await FileSystem.getInfoAsync(fullPath);
              if (fileInfo.exists) {
                await FileSystem.deleteAsync(fullPath, { idempotent: true });
                console.log(`VaultFileSystem: Successfully deleted file from: ${fullPath}`);
                return true;
              }
            } catch (error) {
              // Continue to next path
            }
          }
        }
      }
      
      // Method 3: Try to delete from iOS Photos directory (if on iOS)
      if (Platform.OS === 'ios') {
        // iOS typically doesn't allow direct file system access to Photos
        // But we can try some common paths
        const possiblePaths = [
          '/var/mobile/Media/DCIM/',
          '/var/mobile/Media/Photos/'
        ];
        
        const filename = fileUri.split('/').pop();
        if (filename) {
          for (const basePath of possiblePaths) {
            const fullPath = basePath + filename;
            try {
              const fileInfo = await FileSystem.getInfoAsync(fullPath);
              if (fileInfo.exists) {
                await FileSystem.deleteAsync(fullPath, { idempotent: true });
                console.log(`VaultFileSystem: Successfully deleted file from: ${fullPath}`);
                return true;
              }
            } catch (error) {
              // Continue to next path
            }
          }
        }
      }
      
      console.warn(`VaultFileSystem: Could not delete file from any location: ${fileUri}`);
      
      // Final fallback: Try shell commands
      console.log(`VaultFileSystem: Attempting shell command deletion as final fallback...`);
      await this.deleteFileWithShell(fileUri);
      
      return false;
    } catch (error) {
      console.error(`VaultFileSystem: Error in comprehensive file deletion:`, error);
      return false;
    }
  }

  // Final fallback: Try shell command deletion (may not work in Expo Go)
  async deleteFileWithShell(fileUri) {
    try {
      if (Platform.OS === 'android') {
        // Try using Android's rm command
        const filename = fileUri.split('/').pop();
        const shellCommands = [
          `rm -f "${fileUri}"`,
          `rm -f "/storage/emulated/0/DCIM/Camera/${filename}"`,
          `rm -f "/storage/emulated/0/Pictures/${filename}"`,
          `rm -f "/storage/emulated/0/Download/${filename}"`
        ];
        
        for (const command of shellCommands) {
          try {
            // Note: This may not work in Expo Go due to security restrictions
            console.log(`VaultFileSystem: Attempting shell command: ${command}`);
            // In a real implementation, you might use a native module here
            // For now, we'll just log the attempt
            console.log(`VaultFileSystem: Shell command attempted (may not work in Expo Go): ${command}`);
          } catch (error) {
            console.log(`VaultFileSystem: Shell command failed: ${command}`, error.message);
          }
        }
      }
      
      return false; // Shell commands likely won't work in Expo Go
    } catch (error) {
      console.error(`VaultFileSystem: Error in shell deletion:`, error);
      return false;
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
      
      // Delete the original file from device media library
      if (Platform.OS !== 'web') {
        try {
          // Step 1: Get the asset info from the file URI to ensure we have the correct asset ID
          const assetInfo = await MediaLibrary.getAssetInfoAsync(fileUri);
          
          if (!assetInfo || !assetInfo.id) {
            console.warn(`VaultFileSystem: No asset found for fileUri: ${fileUri}`);
          } else {
            console.log(`VaultFileSystem: Found asset ID: ${assetInfo.id} for file: ${fileUri}`);
            
            // Step 2: Check permissions before attempting deletion
            const permissionResult = await MediaLibrary.requestPermissionsAsync();
            if (permissionResult.status !== 'granted') {
              console.warn(`VaultFileSystem: Media library permission not granted: ${permissionResult.status}`);
            } else {
              // Step 3: Delete the asset using the resolved asset ID
              console.log(`VaultFileSystem: Deleting asset from media library: ${assetInfo.id}`);
              await MediaLibrary.deleteAssetsAsync([assetInfo.id]);
              console.log(`VaultFileSystem: Successfully deleted asset from media library: ${assetInfo.id}`);
            }
          }
        } catch (deleteError) {
          console.error(`VaultFileSystem: Failed to delete asset from media library for: ${fileUri}`, deleteError);
          // Don't throw error, just log it - file is still copied to vault
        }
      } else {
        console.log('VaultFileSystem: Web platform - skipping media library deletion');
      }
      
      console.log(`VaultFileSystem: File copied successfully to vault: ${targetPath}`);
      
      return {
        success: true,
        filename: filename,
        path: targetPath,
        type: type,
        timestamp: timestamp,
        originalUri: fileUri,
        assetId: assetId
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

      // Ask for media library access (simplified permission request)
      const permissionResult = await MediaLibrary.requestPermissionsAsync();

      if (!permissionResult.granted) {
        throw new Error('Media library permission not granted');
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
        success: true,
        originalUri: selectedImage.uri,
        storedFile: storedResult,
        message: 'Image moved to vault successfully'
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

      // Ask for media library access (simplified permission request)
      const permissionResult = await MediaLibrary.requestPermissionsAsync();

      if (!permissionResult.granted) {
        throw new Error('Media library permission not granted');
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
        success: true,
        originalUri: selectedVideo.uri,
        storedFile: storedResult,
        message: 'Video moved to vault successfully'
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