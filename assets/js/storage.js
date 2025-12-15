class StorageManager {
  constructor(storageKey = 'karuta-collection') {
    this.storageKey = storageKey;
  }

  load() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading collection:', error);
      return [];
    }
  }

  save(collection) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(collection));
    } catch (error) {
      console.error('Error saving collection:', error);
    }
  }

  clear() {
    localStorage.removeItem(this.storageKey);
  }

  exists() {
    return localStorage.getItem(this.storageKey) !== null;
  }
}

const storage = new StorageManager();
