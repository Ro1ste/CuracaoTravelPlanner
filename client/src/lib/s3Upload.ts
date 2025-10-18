// S3 Upload service for client-side file uploads
export class S3UploadService {
  private static async getUploadUrl(): Promise<string> {
    const response = await fetch('/api/upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      throw new Error('Failed to get upload URL');
    }

    const data = await response.json();
    return data.uploadUrl;
  }

  static async uploadFile(file: File): Promise<string> {
    try {
      console.log('Starting upload for file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      // Get signed upload URL from server
      const uploadUrl = await this.getUploadUrl();
      console.log('Got upload URL:', uploadUrl.substring(0, 100) + '...');
      
      // Upload file directly to S3
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      console.log('Upload response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed with response:', errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Extract the S3 object key from the upload URL
      const url = new URL(uploadUrl);
      const objectKey = url.pathname.substring(1); // Remove leading slash
      
      // Return the public URL (CloudFront or S3 direct)
      const cloudFrontDomain = import.meta.env.VITE_CLOUDFRONT_DOMAIN;
      if (cloudFrontDomain) {
        const publicUrl = `https://${cloudFrontDomain}/${objectKey}`;
        console.log('Generated CloudFront URL:', publicUrl);
        
        // Test if the URL is accessible
        fetch(publicUrl, { method: 'HEAD' })
          .then(response => {
            console.log('CloudFront URL accessibility test:', response.status, response.statusText);
            if (!response.ok) {
              console.warn('CloudFront URL may not be accessible:', publicUrl);
            }
          })
          .catch(error => {
            console.error('CloudFront URL accessibility test failed:', error);
          });
        
        return publicUrl;
      } else {
        const bucketName = import.meta.env.VITE_S3_BUCKET_NAME || 'curacao-sports-week';
        const region = import.meta.env.VITE_S3_REGION || 'us-east-1';
        const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${objectKey}`;
        console.log('Generated S3 URL:', publicUrl);
        return publicUrl;
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

  static async deleteFile(cloudFrontUrl: string): Promise<void> {
    try {
      console.log('Deleting file from S3:', cloudFrontUrl);
      
      // Extract object key from CloudFront URL
      const url = new URL(cloudFrontUrl);
      const objectKey = url.pathname.substring(1); // Remove leading slash
      
      console.log('Extracted object key:', objectKey);
      
      const response = await fetch(`/api/upload/${encodeURIComponent(objectKey)}`, {
        method: 'DELETE',
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status} ${response.statusText}`);
      }

      console.log('Successfully deleted file from S3:', objectKey);
    } catch (error) {
      console.error('S3 delete error:', error);
      throw error;
    }
  }
}
