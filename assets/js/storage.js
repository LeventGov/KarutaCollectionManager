class StorageManager {
  constructor(storageKey = 'karuta-collection') {
    this.storageKey = storageKey;
    this.useIDB = true;
  }

  async waitForIDBManager(maxAttempts = 100) {
    let attempts = 0;
    while (!window.IDBManager && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 50));
      attempts++;
    }
    return window.IDBManager;
  }

  async load() {
    try {
      if (this.useIDB) {
        const idbMgr = await this.waitForIDBManager();
        if (idbMgr) {
          return await IDBManager.getCollection();
        }
      }
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading collection:', error);
      return [];
    }
  }

  async save(collection) {
    try {
      if (this.useIDB) {
        const idbMgr = await this.waitForIDBManager();
        if (idbMgr) {
          await IDBManager.saveCollection(collection);
          return true;
        }
      }
      localStorage.setItem(this.storageKey, JSON.stringify(collection));
      return true;
    } catch (error) {
      console.error('Error saving collection:', error);
      return false;
    }
  }

  async append(newCards) {
    try {
      const idbMgr = await this.waitForIDBManager();
      if (!idbMgr) {
        throw new Error('IndexedDB manager not available');
      }
      return await IDBManager.appendToCollection(newCards);
    } catch (error) {
      console.error('Error appending to collection:', error);
      throw error;
    }
  }

  async clear() {
    try {
      if (this.useIDB) {
        const idbMgr = await this.waitForIDBManager();
        if (idbMgr) {
          await IDBManager.clearCollection();
        }
      }
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Error clearing collection:', error);
    }
  }

  async exists() {
    try {
      const data = await this.load();
      return data && data.length > 0;
    } catch {
      return false;
    }
  }

  async getPref(key) {
    try {
      if (this.useIDB) {
        const idbMgr = await this.waitForIDBManager();
        if (idbMgr) {
          return await IDBManager.getPref(key);
        }
      }
      const stored = localStorage.getItem(`pref-${key}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting pref:', error);
      return null;
    }
  }

  async setPref(key, value) {
    try {
      if (this.useIDB) {
        const idbMgr = await this.waitForIDBManager();
        if (idbMgr) {
          await IDBManager.setPref(key, value);
          return true;
        }
      }
      localStorage.setItem(`pref-${key}`, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error setting pref:', error);
      return false;
    }
  }
}

const storage = new StorageManager();
