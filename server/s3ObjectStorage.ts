import 'dotenv/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { Response } from 'express';

export interface ObjectAclPolicy {
  owner: string;
  visibility: 'public' | 'private';
}

export class S3ObjectStorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;
  private cloudFrontDomain: string;

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME || 'curacao-travel-planner';
    this.region = process.env.S3_REGION || 'us-east-1';
    this.cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN || '';
    
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
    });

    // Validate configuration
    if (!process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
      console.warn('⚠️  S3 credentials not configured. Set S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY environment variables.');
    }
    
    if (this.cloudFrontDomain) {
      console.log(`🌐 CloudFront CDN enabled: ${this.cloudFrontDomain}`);
    }
  }

  // Get upload URL for proof content
  async getObjectEntityUploadURL(): Promise<string> {
    const objectId = randomUUID();
    const objectKey = `uploads/${objectId}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
      ContentType: 'application/octet-stream',
    });

    try {
      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 900 }); // 15 minutes
      return signedUrl;
    } catch (error) {
      console.error('Error generating upload URL:', error);
      throw new Error('Failed to generate upload URL');
    }
  }

  // Normalize object path for S3 storage
  normalizeObjectEntityPath(rawPath: string): string {
    // If it's already an S3 URL, extract the key
    if (rawPath.includes(`s3.${this.region}.amazonaws.com/${this.bucketName}/`)) {
      const url = new URL(rawPath);
      return url.pathname.substring(1); // Remove leading slash
    }
    
    // If it's a signed URL, extract the key from query params
    if (rawPath.includes('X-Amz-Signature=')) {
      const url = new URL(rawPath);
      const keyMatch = url.pathname.match(/\/uploads\/(.+)$/);
      if (keyMatch) {
        return `uploads/${keyMatch[1]}`;
      }
    }
    
    return rawPath;
  }

  // Set ACL policy for uploaded object
  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const objectKey = this.normalizeObjectEntityPath(rawPath);
    
    try {
      // For S3, we'll use bucket policies for public access
      // Private objects remain private by default
      console.log(`Setting ACL for ${objectKey}:`, aclPolicy);
      
      // Return the public URL if visibility is public
      if (aclPolicy.visibility === 'public') {
        return this.getPublicUrl(objectKey);
      }
      
      // For private objects, return the key for signed URL generation
      return objectKey;
    } catch (error) {
      console.error('Error setting ACL policy:', error);
      return rawPath;
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
      // In a real implementation, you'd check user permissions against object metadata
      return !!userId;
    } catch (error) {
      console.error('Error checking object access:', error);
      return false;
    }
  }

  // Get object file for serving
  async getObjectEntityFile(objectPath: string): Promise<string> {
    const objectKey = this.normalizeObjectEntityPath(objectPath);
    
    try {
      // Check if object exists and is public
      const headCommand = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
      });
      
      await this.s3Client.send(headCommand);
      
      // Return public URL
      return this.getPublicUrl(objectKey);
    } catch (error) {
      console.error('Error getting object file:', error);
      throw new Error('Object not found');
    }
  }

  // Download object to response
  async downloadObject(filePath: string, res: Response, cacheTtlSec: number = 3600) {
    try {
      const objectKey = this.normalizeObjectEntityPath(filePath);
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
      });

      const response = await this.s3Client.send(command);
      
      // Set headers
      res.set({
        'Content-Type': response.ContentType || 'application/octet-stream',
        'Content-Length': response.ContentLength?.toString() || '0',
        'Cache-Control': `private, max-age=${cacheTtlSec}`,
        'ETag': response.ETag,
      });

      // Stream the file to the response
      if (response.Body) {
        const stream = response.Body as NodeJS.ReadableStream;
        stream.pipe(res);
      } else {
        res.status(404).json({ error: 'File not found' });
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error downloading file' });
      }
    }
  }

  // Get signed URL for private object access
  async getSignedObjectUrl(objectKey: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
    });

    try {
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  // Delete object
  async deleteObject(objectKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
    });

    try {
      await this.s3Client.send(command);
      console.log(`Deleted object: ${objectKey}`);
    } catch (error) {
      console.error('Error deleting object:', error);
      throw new Error('Failed to delete object');
    }
  }

  // Upload object directly (for server-side uploads)
  async uploadObject(
    objectKey: string, 
    body: Buffer | Uint8Array | string, 
    contentType: string = 'application/octet-stream'
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
      Body: body,
      ContentType: contentType,
    });

    try {
      await this.s3Client.send(command);
      return this.getPublicUrl(objectKey);
    } catch (error) {
      console.error('Error uploading object:', error);
      throw new Error('Failed to upload object');
    }
  }

  // Get public URL for object (CloudFront or S3 direct)
  private getPublicUrl(objectKey: string): string {
    if (this.cloudFrontDomain) {
      // Use CloudFront URL for better performance and global distribution
      return `https://${this.cloudFrontDomain}/${objectKey}`;
    } else {
      // Fallback to direct S3 URL
      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${objectKey}`;
    }
  }
}
