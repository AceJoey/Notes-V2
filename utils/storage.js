import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  NOTES: 'notes',
  CATEGORIES: 'categories',
  SETTINGS: 'settings',
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
  // Notes
  async getNotes() {
    try {
      const notes = await AsyncStorage.getItem(STORAGE_KEYS.NOTES);
      return notes ? JSON.parse(notes) : [];
    } catch (error) {
      console.error('Error loading notes:', error);
      return [];
    }
  },

  async saveNotes(notes) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  },

  async addNote(note) {
    const notes = await this.getNotes();
    const newNote = {
      id: Date.now().toString(),
      ...note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null, // Add deletedAt property
    };
    notes.push(newNote);
    await this.saveNotes(notes);
    return newNote;
  },

  async updateNote(id, updates) {
    const notes = await this.getNotes();
    const index = notes.findIndex(note => note.id === id);
    if (index !== -1) {
      notes[index] = {
        ...notes[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await this.saveNotes(notes);
      return notes[index];
    }
    return null;
  },

  // Soft delete: set deletedAt timestamp
  async deleteNote(id) {
    const notes = await this.getNotes();
    const index = notes.findIndex(note => note.id === id);
    if (index !== -1) {
      notes[index].deletedAt = new Date().toISOString();
      await this.saveNotes(notes);
    }
  },

  // Hard delete: remove from storage
  async permanentlyDeleteNote(id) {
    const notes = await this.getNotes();
    const filteredNotes = notes.filter(note => note.id !== id);
    await this.saveNotes(filteredNotes);
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
      id: Date.now().toString(),
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
      return settings ? JSON.parse(settings) : { theme: 'dark' };
    } catch (error) {
      console.error('Error loading settings:', error);
      return { theme: 'dark' };
    }
  },

  async saveSettings(settings) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },
};