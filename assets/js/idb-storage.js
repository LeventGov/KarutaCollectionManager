class IDBManager {
  static DB_NAME = 'karutaDB';
  static DB_VERSION = 1;
  static STORE_NAME = 'collections';
  static PREFS_STORE = 'preferences';

  static async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(this.PREFS_STORE)) {
          db.createObjectStore(this.PREFS_STORE, { keyPath: 'key' });
        }
      };
    });
  }

  static async getCollection() {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.STORE_NAME], 'readonly');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.get('karuta-collection');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : []);
      };
    });
  }

  static async saveCollection(collection) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.STORE_NAME], 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.put({ id: 'karuta-collection', data: collection });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  static async appendToCollection(newCards) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.STORE_NAME], 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      const getRequest = store.get('karuta-collection');

      getRequest.onsuccess = () => {
        const current = getRequest.result?.data || [];
        const updated = [...current, ...newCards];
        const putRequest = store.put({ id: 'karuta-collection', data: updated });

        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => resolve(updated.length);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  static async clearCollection() {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.STORE_NAME], 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.delete('karuta-collection');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  static async getPref(key) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.PREFS_STORE], 'readonly');
      const store = tx.objectStore(this.PREFS_STORE);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
    });
  }

  static async setPref(key, value) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.PREFS_STORE], 'readwrite');
      const store = tx.objectStore(this.PREFS_STORE);
      const request = store.put({ key, value });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

if (typeof window !== 'undefined') {
  window.IDBManager = IDBManager;
}
