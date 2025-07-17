// Category helper functions
export const CategoryHelpers = {
  getCategoryColor(categoryId, categories) {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.color : '#6b7280';
  },

  getCategoryName(categoryId, categories) {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown';
  },

  filterNotesByCategory(notes, categoryId) {
    if (categoryId === 'all') {
      return notes;
    }
    return notes.filter(note => note.categoryId === categoryId);
  },

  generateCategoryColors() {
    const colors = [
      '#f59e0b', '#10b981', '#6366f1', '#ef4444', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#14b8a6'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  },

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
      });
    }
  },
};