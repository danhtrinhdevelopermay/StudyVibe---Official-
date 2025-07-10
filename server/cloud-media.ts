import { FormData } from 'formdata-node';

export interface CloudMediaResult {
  url: string;
  thumbnailUrl?: string;
  deleteUrl?: string;
  id: string;
}

class CloudMediaService {
  private readonly imgbbApiKey = process.env.IMGBB_API_KEY;
  private readonly imgbbBaseUrl = 'https://api.imgbb.com/1/upload';

  async uploadImage(dataUrl: string, name?: string): Promise<CloudMediaResult> {
    if (!this.imgbbApiKey) {
      throw new Error('IMGBB_API_KEY not configured');
    }

    try {
      // Extract base64 data from data URL
      const base64Data = dataUrl.split(',')[1];
      
      // Create form data
      const formData = new FormData();
      formData.append('key', this.imgbbApiKey);
      formData.append('image', base64Data);
      if (name) {
        formData.append('name', name);
      }

      const response = await fetch(this.imgbbBaseUrl, {
        method: 'POST',
        body: formData as any,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ImgBB upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`ImgBB API error: ${result.error?.message || 'Upload failed'}`);
      }

      return {
        url: result.data.url,
        thumbnailUrl: result.data.thumb?.url || result.data.medium?.url,
        deleteUrl: result.data.delete_url,
        id: result.data.id,
      };
    } catch (error) {
      console.error('ImgBB upload error:', error);
      throw error;
    }
  }

  async uploadVideo(dataUrl: string): Promise<CloudMediaResult> {
    // For videos, we'll fall back to local storage since ImgBB doesn't support videos
    // In production, you could use Cloudinary or similar services that support videos
    throw new Error('Video upload to cloud not implemented - using local storage');
  }

  /**
   * Process media URLs by uploading data URLs to cloud storage
   */
  async processMediaUrls(mediaUrls: Array<{ type: string; url: string; thumbnailUrl?: string }>): Promise<Array<{ type: string; url: string; thumbnailUrl?: string }>> {
    const optimizedUrls = [];
    
    for (const media of mediaUrls) {
      if (media.url.startsWith('data:')) {
        try {
          if (media.type === 'image') {
            const cloudResult = await this.uploadImage(media.url);
            optimizedUrls.push({
              type: media.type,
              url: cloudResult.url,
              thumbnailUrl: cloudResult.thumbnailUrl,
            });
          } else {
            // For videos, keep original for now (could implement Cloudinary later)
            optimizedUrls.push(media);
          }
        } catch (error) {
          console.error('Failed to upload media to cloud:', error);
          // Keep original URL as fallback
          optimizedUrls.push(media);
        }
      } else {
        // URL is already optimized
        optimizedUrls.push(media);
      }
    }
    
    return optimizedUrls;
  }

  /**
   * Convert a single data URL to cloud URL
   */
  async optimizeUrl(dataUrl: string, type: 'image' | 'video'): Promise<string> {
    if (!dataUrl.startsWith('data:')) {
      return dataUrl; // Already optimized
    }

    if (type === 'image') {
      const result = await this.uploadImage(dataUrl);
      return result.url;
    } else {
      // For videos, return original for now
      return dataUrl;
    }
  }
}

export const cloudMedia = new CloudMediaService();