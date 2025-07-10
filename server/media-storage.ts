import { randomBytes } from 'crypto';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface MediaFile {
  id: string;
  originalName: string;
  type: 'image' | 'video';
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
}

class MediaStorageService {
  private readonly uploadsDir = join(process.cwd(), 'uploads');
  private readonly thumbnailsDir = join(process.cwd(), 'uploads', 'thumbnails');

  constructor() {
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    try {
      if (!existsSync(this.uploadsDir)) {
        await mkdir(this.uploadsDir, { recursive: true });
      }
      if (!existsSync(this.thumbnailsDir)) {
        await mkdir(this.thumbnailsDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create upload directories:', error);
    }
  }

  /**
   * Generate a short, unique media ID
   */
  private generateMediaId(): string {
    return randomBytes(8).toString('hex');
  }

  /**
   * Store media file and return optimized URL
   */
  async storeMedia(dataUrl: string, originalName: string, mimeType: string): Promise<MediaFile> {
    const mediaId = this.generateMediaId();
    const isImage = mimeType.startsWith('image/');
    const isVideo = mimeType.startsWith('video/');
    
    // Extract base64 data
    const base64Data = dataUrl.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Determine file extension
    const ext = this.getFileExtension(mimeType);
    const fileName = `${mediaId}.${ext}`;
    const filePath = join(this.uploadsDir, fileName);
    
    // Store the file
    await writeFile(filePath, buffer);
    
    const mediaFile: MediaFile = {
      id: mediaId,
      originalName,
      type: isImage ? 'image' : 'video',
      mimeType,
      size: buffer.length,
      url: `/uploads/${fileName}`,
    };

    // Generate thumbnail for videos
    if (isVideo) {
      const thumbnailId = `${mediaId}_thumb`;
      const thumbnailPath = join(this.thumbnailsDir, `${thumbnailId}.jpg`);
      // For now, we'll use a placeholder. In production, you'd generate actual video thumbnails
      mediaFile.thumbnailUrl = `/uploads/thumbnails/${thumbnailId}.jpg`;
    }

    return mediaFile;
  }

  /**
   * Get media file by ID
   */
  async getMedia(mediaId: string): Promise<Buffer | null> {
    try {
      const files = await this.findMediaFile(mediaId);
      if (!files.length) return null;
      
      const filePath = join(this.uploadsDir, files[0]);
      return await readFile(filePath);
    } catch (error) {
      console.error('Failed to get media:', error);
      return null;
    }
  }

  /**
   * Find media file by ID (handles different extensions)
   */
  private async findMediaFile(mediaId: string): Promise<string[]> {
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mov'];
    const files = [];
    
    for (const ext of extensions) {
      const fileName = `${mediaId}.${ext}`;
      const filePath = join(this.uploadsDir, fileName);
      if (existsSync(filePath)) {
        files.push(fileName);
      }
    }
    
    return files;
  }

  /**
   * Get file extension from MIME type
   */
  private getFileExtension(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/quicktime': 'mov',
    };
    
    return mimeToExt[mimeType] || 'bin';
  }

  /**
   * Convert data URLs to optimized URLs
   */
  async processMediaUrls(mediaUrls: Array<{ type: string; url: string; thumbnailUrl?: string }>): Promise<Array<{ type: string; url: string; thumbnailUrl?: string }>> {
    const optimizedUrls = [];
    
    for (const media of mediaUrls) {
      if (media.url.startsWith('data:')) {
        // Extract MIME type from data URL
        const mimeMatch = media.url.match(/data:([^;]+)/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        
        try {
          const optimizedMedia = await this.storeMedia(media.url, 'upload', mimeType);
          optimizedUrls.push({
            type: optimizedMedia.type,
            url: optimizedMedia.url,
            thumbnailUrl: optimizedMedia.thumbnailUrl,
          });
        } catch (error) {
          console.error('Failed to optimize media URL:', error);
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
}

export const mediaStorage = new MediaStorageService();