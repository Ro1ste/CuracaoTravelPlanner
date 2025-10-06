import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Supabase configuration (prefer server env, fallback to VITE_)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is properly configured
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
  console.warn('   Current values:', { 
    SUPABASE_URL: supabaseUrl ? 'set' : 'not set',
    SUPABASE_ANON_KEY: supabaseAnonKey ? 'set' : 'not set'
  });
}

// Create Supabase client with anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class SupabaseObjectStorageService {
  private bucketName = 'proof-uploads';

  constructor() {
    // Initialize bucket if it doesn't exist
    this.initializeBucket();
  }

  private async initializeBucket() {
    // With anon key we cannot create buckets; assume created via SQL editor.
    try { await supabase.storage.getBucket(this.bucketName); } catch (_) {}
  }

  // Get upload URL for proof content
  async getObjectEntityUploadURL(): Promise<string> { return ''; }

  // Normalize object path for Supabase storage
  normalizeObjectEntityPath(rawPath: string): string {
    // Extract the file path from Supabase URL
    if (rawPath.includes('supabase.co/storage/v1/object/public/')) {
      const url = new URL(rawPath);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part === this.bucketName);
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        return pathParts.slice(bucketIndex + 1).join('/');
      }
    }
    return rawPath;
  }

  // Set ACL policy for uploaded object
  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: { owner: string; visibility: 'public' | 'private' }
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    
    try {
      // For Supabase, we'll store the file as private by default
      // The visibility is controlled by bucket policies
      console.log(`Setting ACL for ${normalizedPath}:`, aclPolicy);
      
      // Return the normalized path
      return normalizedPath;
    } catch (error) {
      console.error('Error setting ACL policy:', error);
      return normalizedPath;
    }
  }

  // Check if user can access object
  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission = 'read'
  }: {
    userId?: string;
    objectFile: string;
    requestedPermission?: 'read' | 'write';
  }): Promise<boolean> {
    try {
      // For now, allow access if user is authenticated
      // In a real implementation, you'd check user permissions
      return !!userId;
    } catch (error) {
      console.error('Error checking object access:', error);
      return false;
    }
  }

  // Get object file for serving
  async getObjectEntityFile(objectPath: string): Promise<string> {
    // Return the full Supabase URL for the object
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(objectPath);
    
    return data.publicUrl;
  }

  // Download object to response
  async downloadObject(filePath: string, res: any, cacheTtlSec: number = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(filePath);

      if (error) {
        throw new Error(`Failed to download file: ${error.message}`);
      }

      // Set headers
      res.set({
        'Content-Type': 'application/octet-stream',
        'Cache-Control': `private, max-age=${cacheTtlSec}`,
      });

      // Convert blob to buffer and send
      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.send(buffer);
    } catch (error) {
      console.error('Error downloading file:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error downloading file' });
      }
    }
  }
}
