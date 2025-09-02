import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  NOTES: 'notes',
  CATEGORIES: 'categories',
  SETTINGS: 'settings',
  VAULT_NOTES: 'vault_notes',
};

// Default categories with colors
const DEFAULT_CATEGORIES = [
  { id: 'all', name: 'All', color: '#3b82f6' },
  { id: 'personal', name: 'Personal', color: '#f59e0b' },
  { id: 'work', name: 'Work', color: '#10b981' },
  { id: 'other', name: 'Other', color: '#6366f1' },
];

// Storage utilities
export const StorageHelper = {
  // Helper function to generate unique IDs
  generateUniqueId(prefix = 'item') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const counter = Math.floor(Math.random() * 10000);
    const microtime = performance.now ? performance.now().toString().replace('.', '') : Math.random().toString().substr(2, 6);
    return `${prefix}_${timestamp}_${random}_${counter}_${microtime}`;
  },

  // Cleanup function to fix duplicate IDs
  async cleanupDuplicateIds() {
    try {
      console.log('StorageHelper: Starting duplicate ID cleanup...');
      
      // Clean up regular notes
      const notes = await this.getNotes();
      const seenIds = new Set();
      const cleanedNotes = [];
      
      for (const note of notes) {
        if (seenIds.has(note.id)) {
          console.log('StorageHelper: Found duplicate note ID, regenerating:', note.id);
          note.id = this.generateUniqueId('note');
        }
        seenIds.add(note.id);
        cleanedNotes.push(note);
      }
      
      if (cleanedNotes.length !== notes.length) {
        await this.saveNotes(cleanedNotes);
        console.log('StorageHelper: Cleaned up regular notes');
      }
      
      // Clean up vault notes
      const vaultNotes = await this.getVaultNotes();
      const seenVaultIds = new Set();
      const cleanedVaultNotes = [];
      
      for (const note of vaultNotes) {
        if (seenVaultIds.has(note.id)) {
          console.log('StorageHelper: Found duplicate vault note ID, regenerating:', note.id);
          note.id = this.generateUniqueId('vault');
        }
        seenVaultIds.add(note.id);
        cleanedVaultNotes.push(note);
      }
      
      if (cleanedVaultNotes.length !== vaultNotes.length) {
        await this.saveVaultNotes(cleanedVaultNotes);
        console.log('StorageHelper: Cleaned up vault notes');
      }
      
      // Clean up categories
      const categories = await this.getCategories();
      const seenCategoryIds = new Set();
      const cleanedCategories = [];
      
      for (const category of categories) {
        if (seenCategoryIds.has(category.id)) {
          console.log('StorageHelper: Found duplicate category ID, regenerating:', category.id);
          category.id = this.generateUniqueId('category');
        }
        seenCategoryIds.add(category.id);
        cleanedCategories.push(category);
      }
      
      if (cleanedCategories.length !== categories.length) {
        await this.saveCategories(cleanedCategories);
        console.log('StorageHelper: Cleaned up categories');
      }
      
      console.log('StorageHelper: Duplicate ID cleanup completed');
    } catch (error) {
      console.error('StorageHelper: Error during duplicate ID cleanup:', error);
    }
  },

  // Notes
  async getNotes() {
    try {
      const notes = await AsyncStorage.getItem(STORAGE_KEYS.NOTES);
      const parsedNotes = notes ? JSON.parse(notes) : [];
      console.log('getNotes: Retrieved', parsedNotes.length, 'notes');
      return parsedNotes;
    } catch (error) {
      console.error('Error loading notes:', error);
      return [];
    }
  },

  async saveNotes(notes) {
    try {
      console.log('saveNotes: Saving', notes.length, 'notes');
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
      console.log('saveNotes: Successfully saved notes');
    } catch (error) {
      console.error('Error saving notes:', error);
      throw error;
    }
  },

  async addNote(note) {
    try {
    const notes = await this.getNotes();
    const newNote = {
      id: this.generateUniqueId('note'),
      ...note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
        deletedAt: null, // Add deletedAt property
    };
    notes.push(newNote);
    await this.saveNotes(notes);
      console.log('addNote: Successfully added note with ID:', newNote.id);
    return newNote;
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  },

  async updateNote(id, updates) {
    try {
    const notes = await this.getNotes();
    const index = notes.findIndex(note => note.id === id);
    if (index !== -1) {
      notes[index] = {
        ...notes[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await this.saveNotes(notes);
        console.log('updateNote: Successfully updated note with ID:', id);
      return notes[index];
    }
      console.warn('updateNote: Note not found with ID:', id);
    return null;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  },

  // Soft delete: set deletedAt timestamp
  async deleteNote(id) {
    try {
      console.log('deleteNote: Attempting to delete note with ID:', id);
      const notes = await this.getNotes();
      const index = notes.findIndex(note => note.id === id);
      if (index !== -1) {
        notes[index].deletedAt = new Date().toISOString();
        await this.saveNotes(notes);
        console.log('deleteNote: Successfully soft deleted note with ID:', id);
      } else {
        console.warn('deleteNote: Note not found with ID:', id);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  },

  // Hard delete: remove from storage
  async permanentlyDeleteNote(id) {
    try {
      console.log('permanentlyDeleteNote: Attempting to permanently delete note with ID:', id);
    const notes = await this.getNotes();
    const filteredNotes = notes.filter(note => note.id !== id);
    await this.saveNotes(filteredNotes);
      console.log('permanentlyDeleteNote: Successfully permanently deleted note with ID:', id);
    } catch (error) {
      console.error('Error permanently deleting note:', error);
      throw error;
    }
  },

  // Vault Notes
  async getVaultNotes() {
    try {
      const vaultNotes = await AsyncStorage.getItem(STORAGE_KEYS.VAULT_NOTES);
      const parsedVaultNotes = vaultNotes ? JSON.parse(vaultNotes) : [];
      console.log('getVaultNotes: Retrieved', parsedVaultNotes.length, 'vault notes');
      return parsedVaultNotes;
    } catch (error) {
      console.error('Error loading vault notes:', error);
      return [];
    }
  },

  async saveVaultNotes(vaultNotes) {
    try {
      console.log('saveVaultNotes: Saving', vaultNotes.length, 'vault notes');
      await AsyncStorage.setItem(STORAGE_KEYS.VAULT_NOTES, JSON.stringify(vaultNotes));
      console.log('saveVaultNotes: Successfully saved vault notes');
    } catch (error) {
      console.error('Error saving vault notes:', error);
      throw error;
    }
  },

  async addVaultNote(note) {
    try {
      const vaultNotes = await this.getVaultNotes();
      const newVaultNote = {
        id: this.generateUniqueId('vault'),
        ...note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isVaultNote: true, // Mark as vault note
      };
      vaultNotes.push(newVaultNote);
      await this.saveVaultNotes(vaultNotes);
      console.log('addVaultNote: Successfully added vault note with ID:', newVaultNote.id);
      return newVaultNote;
    } catch (error) {
      console.error('Error adding vault note:', error);
      throw error;
    }
  },

  async updateVaultNote(id, updates) {
    try {
      const vaultNotes = await this.getVaultNotes();
      const noteIndex = vaultNotes.findIndex(note => note.id === id);
      
      if (noteIndex === -1) {
        throw new Error('Vault note not found');
      }
      
      vaultNotes[noteIndex] = {
        ...vaultNotes[noteIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      await this.saveVaultNotes(vaultNotes);
      console.log('updateVaultNote: Successfully updated vault note', id);
      return vaultNotes[noteIndex];
    } catch (error) {
      console.error('Error updating vault note:', error);
      throw error;
    }
  },

  async deleteVaultNote(id) {
    try {
      const vaultNotes = await this.getVaultNotes();
      const filteredNotes = vaultNotes.filter(note => note.id !== id);
      
      if (filteredNotes.length === vaultNotes.length) {
        throw new Error('Vault note not found');
      }
      
      await this.saveVaultNotes(filteredNotes);
      console.log('deleteVaultNote: Successfully deleted vault note', id);
    } catch (error) {
      console.error('Error deleting vault note:', error);
      throw error;
    }
  },

  async moveNotesToVault(noteIds) {
    try {
      console.log('moveNotesToVault: Attempting to move', noteIds.length, 'notes to vault');
      
      // Get all notes
      const allNotes = await this.getNotes();
      console.log('moveNotesToVault: Found', allNotes.length, 'total notes');
      
      // Filter out deleted notes and get only the notes to be moved
      const notesToMove = allNotes.filter(note => 
        noteIds.includes(note.id) && !note.deletedAt
      );
      console.log('moveNotesToVault: Found', notesToMove.length, 'valid notes to move');

      if (notesToMove.length === 0) {
        throw new Error('No valid notes found to move');
      }

      // Add notes to vault
      const vaultNotes = await this.getVaultNotes();
      const movedNotes = [];

      for (const note of notesToMove) {
        const vaultNote = {
          id: this.generateUniqueId('vault'),
          title: note.title,
          content: note.content,
          categoryId: note.categoryId,
          type: note.type,
          items: note.items || [],
          createdAt: note.createdAt,
          updatedAt: new Date().toISOString(),
          isVaultNote: true,
          originalId: note.id, // Keep reference to original ID
        };
        
        vaultNotes.push(vaultNote);
        movedNotes.push(vaultNote);
      }

      // Save vault notes
      await this.saveVaultNotes(vaultNotes);
      console.log('moveNotesToVault: Successfully saved', movedNotes.length, 'notes to vault');

      // Delete original notes (soft delete)
      for (const noteId of noteIds) {
        await this.deleteNote(noteId);
      }
      console.log('moveNotesToVault: Successfully deleted original notes');

      return {
        success: true,
        movedCount: movedNotes.length,
        movedNotes: movedNotes
      };
    } catch (error) {
      console.error('Error moving notes to vault:', error);
      throw error;
    }
  },

  async moveNoteFromVault(vaultNoteId) {
    try {
      console.log('moveNoteFromVault: Attempting to move note from vault:', vaultNoteId);
      
      // Get vault notes
      const vaultNotes = await this.getVaultNotes();
      console.log('moveNoteFromVault: Found', vaultNotes.length, 'vault notes');
      
      // Find the vault note to move
      const vaultNoteIndex = vaultNotes.findIndex(note => note.id === vaultNoteId);
      
      if (vaultNoteIndex === -1) {
        throw new Error('Vault note not found');
      }
      
      const vaultNote = vaultNotes[vaultNoteIndex];
      console.log('moveNoteFromVault: Found vault note:', vaultNote.title);
      
      // Create regular note from vault note
      const regularNote = {
        id: vaultNote.originalId || this.generateUniqueId('note'),
        title: vaultNote.title,
        content: vaultNote.content,
        categoryId: vaultNote.categoryId,
        type: vaultNote.type,
        items: vaultNote.items || [],
        createdAt: vaultNote.createdAt,
        updatedAt: new Date().toISOString(),
        deletedAt: null, // Ensure it's not marked as deleted
      };
      
      // Add to regular notes
      const regularNotes = await this.getNotes();
      regularNotes.push(regularNote);
      await this.saveNotes(regularNotes);
      console.log('moveNoteFromVault: Successfully added note to regular notes');
      
      // Remove from vault notes
      vaultNotes.splice(vaultNoteIndex, 1);
      await this.saveVaultNotes(vaultNotes);
      console.log('moveNoteFromVault: Successfully removed note from vault');
      
      return {
        success: true,
        note: regularNote
      };
    } catch (error) {
      console.error('Error moving note from vault:', error);
      throw error;
    }
  },

  // Categories
  async getCategories() {
    try {
      const categories = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return categories ? JSON.parse(categories) : DEFAULT_CATEGORIES;
    } catch (error) {
      console.error('Error loading categories:', error);
      return DEFAULT_CATEGORIES;
    }
  },

  async saveCategories(categories) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving categories:', error);
    }
  },

  async addCategory(category) {
    const categories = await this.getCategories();
    const newCategory = {
      id: this.generateUniqueId('category'),
      ...category,
    };
    categories.push(newCategory);
    await this.saveCategories(categories);
    return newCategory;
  },

  // Settings
  async getSettings() {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return settings ? JSON.parse(settings) : { theme: 'dark', defaultCategory: 'personal' };
    } catch (error) {
      console.error('Error loading settings:', error);
      return { theme: 'dark', defaultCategory: 'personal' };
    }
  },

  async saveSettings(settings) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },

  async getDefaultCategory() {
    try {
      const settings = await this.getSettings();
      return settings.defaultCategory || 'personal';
    } catch (error) {
      console.error('Error getting default category:', error);
      return 'personal';
    }
  },

  async setDefaultCategory(categoryId) {
    try {
      const settings = await this.getSettings();
      settings.defaultCategory = categoryId;
      await this.saveSettings(settings);
    } catch (error) {
      console.error('Error setting default category:', error);
    }
  },
};