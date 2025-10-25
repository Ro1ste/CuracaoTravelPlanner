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

      // Extract the object key from the signed URL
      const url = new URL(uploadUrl);
      const objectKey = url.pathname.substring(1); // Remove leading slash
      
      console.log('Upload successful, returning object key for signed URL generation:', objectKey);
      return objectKey;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw error;
    }
  }

  static async uploadMultipleFiles(files: File[]): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  static async deleteFile(storageUrlOrKey: string): Promise<void> {
    try {
      console.log('Deleting file from storage:', storageUrlOrKey);
      
      let objectKey: string;
      
      // Check if it's already an object key (starts with "uploads/") or a full URL
      if (storageUrlOrKey.startsWith('uploads/')) {
        // It's already an object key
        objectKey = storageUrlOrKey;
      } else {
        // It's a URL, extract the object key
        const url = new URL(storageUrlOrKey);
        const pathParts = url.pathname.split('/');
        objectKey = pathParts[pathParts.length - 1];
      }
      
      console.log('Using object key:', objectKey);
      
      const response = await fetch(`/api/upload/${encodeURIComponent(objectKey)}`, {
        method: 'DELETE',
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status} ${response.statusText}`);
      }

      console.log('Successfully deleted file from storage:', objectKey);
    } catch (error) {
      console.error('Storage delete error:', error);
      throw error;
    }
  }
}
