// S3 Upload service for client-side file uploads
export class S3UploadService {
  private static async getUploadUrl(): Promise<string> {
    const response = await fetch('/api/upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get upload URL');
    }

    const data = await response.json();
    return data.uploadUrl;
  }

  static async uploadFile(file: File): Promise<string> {
    try {
      // Get signed upload URL from server
      const uploadUrl = await this.getUploadUrl();
      
      // Upload file directly to S3
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      // Extract the S3 object key from the upload URL
      const url = new URL(uploadUrl);
      const objectKey = url.pathname.substring(1); // Remove leading slash
      
      // Return the public URL (CloudFront or S3 direct)
      const cloudFrontDomain = process.env.VITE_CLOUDFRONT_DOMAIN;
      if (cloudFrontDomain) {
        return `https://${cloudFrontDomain}/${objectKey}`;
      } else {
        const bucketName = process.env.VITE_S3_BUCKET_NAME || 'curacao-travel-planner';
        const region = process.env.VITE_S3_REGION || 'us-east-1';
        return `https://${bucketName}.s3.${region}.amazonaws.com/${objectKey}`;
      }
    } catch (error) {
      console.error('S3 upload error:', error);
      throw error;
    }
  }

  static async uploadMultipleFiles(files: File[]): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }
}
