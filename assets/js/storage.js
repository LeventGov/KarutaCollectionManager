// Local storage management for Karuta Collection

class StorageManager {
  constructor(storageKey = 'karuta-collection') {
    this.storageKey = storageKey;
  }

  /**
   * Load collection from localStorage
   * @returns {Array} Collection array or empty array if not found
   */
  load() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading collection:', error);
      return [];
    }
  }

  /**
   * Save collection to localStorage
   * @param {Array} collection - Collection array to save
   */
  save(collection) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(collection));
    } catch (error) {
      console.error('Error saving collection:', error);
    }
  }

  /**
   * Clear all collection data
   */
  clear() {
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Check if collection exists in storage
   * @returns {boolean}
   */
  exists() {
    return localStorage.getItem(this.storageKey) !== null;
  }
}

// Create global instance
const storage = new StorageManager();
