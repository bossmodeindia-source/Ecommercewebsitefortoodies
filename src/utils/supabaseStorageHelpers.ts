// Supabase Storage Helper Functions
// Handles all file uploads/downloads to Supabase Storage buckets
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './supabase/info';

// Initialize Supabase client for storage operations
const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'toodies-auth',
    }
  }
);

// ============================================
// Helper Functions
// ============================================

/**
 * Get current user ID from localStorage or Supabase session
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    // Try Supabase session first
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return user.id;

    // Fallback to localStorage
    const userStr = localStorage.getItem('toodies_user');
    if (!userStr) return null;
    const localUser = JSON.parse(userStr);
    return localUser.id || null;
  } catch {
    return null;
  }
}

/**
 * Check if current user is admin
 */
async function isAdmin(): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  try {
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    
    return data?.role === 'admin';
  } catch {
    return false;
  }
}

/**
 * Generate unique filename with timestamp
 */
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop();
  return `${timestamp}-${randomStr}.${ext}`;
}

// ============================================
// Storage Upload Functions
// ============================================

export const storageHelpers = {
  /**
   * Upload customer design to 'customer-designs' bucket
   * Path: {userId}/{timestamp}-{filename}
   * RLS: Only owner can access
   */
  uploadCustomerDesign: async (file: File): Promise<string> => {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const fileName = generateUniqueFileName(file.name);
    const path = `${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('customer-designs')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload design: ${error.message}`);
    }

    // Get public URL (RLS still enforces access control)
    const { data: urlData } = supabase.storage
      .from('customer-designs')
      .getPublicUrl(path);

    return urlData.publicUrl;
  },

  /**
   * Upload AI-generated design to 'ai-generated-designs' bucket
   * Path: {userId}/{timestamp}.png
   * RLS: Only owner can access
   */
  uploadAIDesign: async (blob: Blob, fileName?: string): Promise<string> => {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const name = fileName || `ai-design-${Date.now()}.png`;
    const path = `${userId}/${name}`;

    const { data, error } = await supabase.storage
      .from('ai-generated-designs')
      .upload(path, blob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload AI design: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('ai-generated-designs')
      .getPublicUrl(path);

    return urlData.publicUrl;
  },

  /**
   * Upload product image to 'product-images' bucket (Admin only)
   * Path: {timestamp}-{filename}
   * Public bucket - anyone can view
   */
  uploadProductImage: async (file: File): Promise<string> => {
    const admin = await isAdmin();
    if (!admin) throw new Error('Unauthorized: Admin access required');

    const fileName = generateUniqueFileName(file.name);

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload product image: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  },

  /**
   * Upload multiple product images (Admin only)
   * Returns array of URLs
   */
  uploadProductImages: async (files: File[]): Promise<string[]> => {
    const admin = await isAdmin();
    if (!admin) throw new Error('Unauthorized: Admin access required');

    const uploadPromises = files.map(async (file) => {
      const fileName = generateUniqueFileName(file.name);

      const { error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw new Error(`Failed to upload ${file.name}: ${error.message}`);

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    });

    return Promise.all(uploadPromises);
  },

  /**
   * Upload product mockup template to 'product-mockups' bucket (Admin only)
   * Path: {productId}/{filename}
   * Public bucket - needed for 2D designer
   */
  uploadProductMockup: async (productId: string, file: File): Promise<string> => {
    const admin = await isAdmin();
    if (!admin) throw new Error('Unauthorized: Admin access required');

    const fileName = generateUniqueFileName(file.name);
    const path = `${productId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('product-mockups')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload mockup: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('product-mockups')
      .getPublicUrl(path);

    return urlData.publicUrl;
  },

  /**
   * Upload gifting template (Admin only)
   * Path: {type}/{timestamp}-{filename} (type: neck-label, thank-you-card, box)
   * Public bucket
   */
  uploadGiftingTemplate: async (type: 'neck-label' | 'thank-you-card' | 'box', file: File): Promise<string> => {
    const admin = await isAdmin();
    if (!admin) throw new Error('Unauthorized: Admin access required');

    const fileName = generateUniqueFileName(file.name);
    const path = `${type}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('gifting-templates')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload gifting template: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('gifting-templates')
      .getPublicUrl(path);

    return urlData.publicUrl;
  },

  /**
   * Upload design thumbnail to 'design-thumbnails' bucket
   * Path: {userId}/{designId}.jpg
   * RLS: Only owner can access
   */
  uploadDesignThumbnail: async (designId: string, blob: Blob): Promise<string> => {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const path = `${userId}/${designId}.jpg`;

    const { data, error } = await supabase.storage
      .from('design-thumbnails')
      .upload(path, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true // Allow overwriting thumbnails
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload thumbnail: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('design-thumbnails')
      .getPublicUrl(path);

    return urlData.publicUrl;
  },

  /**
   * Upload invoice PDF to 'invoices' bucket
   * Path: {userId}/{orderId}.pdf
   * RLS: Only owner + admin can access
   * Returns signed URL (expires in 24 hours)
   */
  uploadInvoice: async (orderId: string, pdfBlob: Blob): Promise<{ publicUrl: string; signedUrl: string }> => {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const path = `${userId}/${orderId}.pdf`;

    const { data, error } = await supabase.storage
      .from('invoices')
      .upload(path, pdfBlob, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true // Allow regenerating invoices
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload invoice: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('invoices')
      .getPublicUrl(path);

    // Get signed URL (expires in 24 hours = 86400 seconds)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('invoices')
      .createSignedUrl(path, 86400);

    if (signedError) {
      console.error('Signed URL error:', signedError);
      throw new Error(`Failed to create signed URL: ${signedError.message}`);
    }

    return {
      publicUrl: urlData.publicUrl,
      signedUrl: signedData.signedUrl
    };
  },

  /**
   * Upload admin asset to 'admin-uploads' bucket (Admin only)
   * Path: {type}/{timestamp}-{filename} (type: hero, banner, logo, etc.)
   * Public bucket
   */
  uploadAdminAsset: async (type: string, file: File): Promise<string> => {
    const admin = await isAdmin();
    if (!admin) throw new Error('Unauthorized: Admin access required');

    const fileName = generateUniqueFileName(file.name);
    const path = `${type}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('admin-uploads')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload admin asset: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('admin-uploads')
      .getPublicUrl(path);

    return urlData.publicUrl;
  },

  // ============================================
  // Storage Retrieval Functions
  // ============================================

  /**
   * Get signed URL for private file (invoices, customer designs, etc.)
   * @param bucket - Bucket name
   * @param path - File path in bucket
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   */
  getSignedUrl: async (bucket: string, path: string, expiresIn: number = 3600): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Signed URL error:', error);
      throw new Error(`Failed to get signed URL: ${error.message}`);
    }

    return data.signedUrl;
  },

  /**
   * Get public URL for file (works for public buckets only)
   */
  getPublicUrl: (bucket: string, path: string): string => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  },

  /**
   * List files in a bucket path
   * @param bucket - Bucket name
   * @param path - Folder path (default: root)
   */
  listFiles: async (bucket: string, path: string = ''): Promise<any[]> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path);

    if (error) {
      console.error('List files error:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }

    return data || [];
  },

  // ============================================
  // Storage Management Functions
  // ============================================

  /**
   * Delete file from bucket
   * RLS policies enforce who can delete
   */
  deleteFile: async (bucket: string, path: string): Promise<void> => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  },

  /**
   * Delete multiple files from bucket
   */
  deleteFiles: async (bucket: string, paths: string[]): Promise<void> => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths);

    if (error) {
      console.error('Delete error:', error);
      throw new Error(`Failed to delete files: ${error.message}`);
    }
  },

  /**
   * Move/rename file in bucket
   */
  moveFile: async (bucket: string, fromPath: string, toPath: string): Promise<void> => {
    const { error } = await supabase.storage
      .from(bucket)
      .move(fromPath, toPath);

    if (error) {
      console.error('Move error:', error);
      throw new Error(`Failed to move file: ${error.message}`);
    }
  },

  /**
   * Get bucket size and file count
   */
  getBucketStats: async (bucket: string): Promise<{ count: number; size: number }> => {
    const files = await storageHelpers.listFiles(bucket);
    
    const stats = files.reduce((acc, file) => ({
      count: acc.count + 1,
      size: acc.size + (file.metadata?.size || 0)
    }), { count: 0, size: 0 });

    return stats;
  },
};

// Export supabase client for direct usage if needed
export { supabase };

export default storageHelpers;
