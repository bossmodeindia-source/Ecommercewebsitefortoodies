// IndexedDB for storing large uncompressed design files
const DB_NAME = 'ToodiesDesignStudio';
const DB_VERSION = 1;
const STORE_NAME = 'designs';

interface DesignData {
  id: string;
  userId: string;
  productId: string;
  name: string;
  timestamp: number;
  
  // NO SCREENSHOTS - Only coordinates!
  modelUrl: string; // URL of the model/mockup image
  designLayers: Array<{
    id: string;
    imageUrl: string; // Design layer image (base64 or URL)
    
    // NORMALIZED COORDINATES (0-100%)
    normalizedX: number;      // X position as % of canvas
    normalizedY: number;      // Y position as % of canvas
    normalizedWidth: number;  // Width as % of canvas
    normalizedHeight: number; // Height as % of canvas
    rotation: number;         // Rotation in degrees
    
    // Legacy absolute coordinates (fallback)
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    
    // Printing info
    printingMethodId: string;
    printingMethodName?: string;
    printingCost?: number;
  }>;
  
  // Product details
  productName: string;
  color: string;
  size: string;
  fabric: string;
  printingMethod: string;
  printingCost: number;
  basePrice: number;
  
  // Canvas metadata
  canvasWidth: number;  // Standard: 600
  canvasHeight: number; // Standard: 600
  
  // Status & tracking
  paymentStatus: 'unpaid' | 'paid' | 'submitted';
  orderId?: string;
  orderNumber?: string;
  paymentId?: string;
  figmaFileUrl?: string;
  isLocked: boolean;
  
  // Customer info
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  
  // APPROVAL WORKFLOW
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvalDate?: string;
  approvalNotes?: string;
  reviewedBy?: string;
  adminSetPrice?: number; // Admin can override the calculated price
  calculatedPrice?: number; // Store the original calculated price for reference
}

class DesignDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          objectStore.createIndex('userId', 'userId', { unique: false });
          objectStore.createIndex('paymentStatus', 'paymentStatus', { unique: false });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async saveDesign(design: DesignData): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(design);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getDesign(id: string): Promise<DesignData | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getUserDesigns(userId: string): Promise<DesignData[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteDesign(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateDesignStatus(id: string, status: 'unpaid' | 'paid' | 'submitted', additionalData?: Partial<DesignData>): Promise<void> {
    if (!this.db) await this.init();
    
    const design = await this.getDesign(id);
    if (!design) throw new Error('Design not found');

    design.paymentStatus = status;
    if (additionalData) {
      Object.assign(design, additionalData);
    }

    await this.saveDesign(design);
  }

  async updateDesign(updatedDesign: DesignData): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(updatedDesign);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllDesigns(): Promise<DesignData[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
}

export const designDB = new DesignDatabase();
export type { DesignData };