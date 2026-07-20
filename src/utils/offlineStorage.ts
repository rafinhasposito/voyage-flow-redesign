// src/utils/offlineStorage.ts
export class OfflineStorage {
  private static readonly DB_NAME = 'VoyageFlowOfflineDB';
  private static readonly STORE_NAME = 'documents';
  private static dbPromise: Promise<IDBDatabase> | null = null;

  static async initDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(this.DB_NAME, 1);
        request.onupgradeneeded = (e: any) => {
          if (!e.target.result.objectStoreNames.contains(this.STORE_NAME)) {
            e.target.result.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return this.dbPromise;
  }

  static async saveDocumentBlob(id: string, name: string, mime: string, size: number, blob: Blob) {
    const db = await this.initDB();
    const tx = db.transaction(this.STORE_NAME, 'readwrite');
    const store = tx.objectStore(this.STORE_NAME);
    
    return new Promise<void>((resolve, reject) => {
      const request = store.put({
        id,
        name,
        mime,
        size,
        data: blob,
        downloadedAt: new Date().toISOString()
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async getDocumentBlob(id: string): Promise<any | null> {
    const db = await this.initDB();
    const tx = db.transaction(this.STORE_NAME, 'readonly');
    const store = tx.objectStore(this.STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  static async removeDocumentBlob(id: string): Promise<void> {
    const db = await this.initDB();
    const tx = db.transaction(this.STORE_NAME, 'readwrite');
    const store = tx.objectStore(this.STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
