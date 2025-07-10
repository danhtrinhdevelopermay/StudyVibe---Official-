import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Image, Video, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaFile {
  type: "image" | "video";
  url: string;
  thumbnailUrl?: string;
  file: File;
}

interface MediaUploadProps {
  onMediaSelect: (media: MediaFile[]) => void;
  selectedMedia: MediaFile[];
  maxFiles?: number;
  acceptedTypes?: string[];
}

export function MediaUpload({ 
  onMediaSelect, 
  selectedMedia, 
  maxFiles = 5,
  acceptedTypes = ["image/*", "video/*"]
}: MediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    const newMediaFiles: MediaFile[] = [];

    for (const file of files) {
      if (selectedMedia.length + newMediaFiles.length >= maxFiles) break;

      try {
        const mediaFile = await processFile(file);
        if (mediaFile) {
          newMediaFiles.push(mediaFile);
        }
      } catch (error) {
        console.error("Error processing file:", error);
      }
    }

    onMediaSelect([...selectedMedia, ...newMediaFiles]);
    setIsUploading(false);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processFile = (file: File): Promise<MediaFile | null> => {
    return new Promise((resolve) => {
      // Compress large images
      if (file.type.startsWith("image/") && file.size > 1024 * 1024) { // > 1MB
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          // Calculate new dimensions (max 800px)
          const maxWidth = 800;
          const maxHeight = 800;
          let { width, height } = img;
          
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          resolve({
            type: "image",
            url: compressedDataUrl,
            file,
          });
        };
        
        img.onerror = () => resolve(null);
        img.src = URL.createObjectURL(file);
      } else {
        // Regular processing for small images and videos
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (!result) {
            resolve(null);
            return;
          }

          const mediaFile: MediaFile = {
            type: file.type.startsWith("image/") ? "image" : "video",
            url: result,
            file,
          };

          if (mediaFile.type === "video") {
            mediaFile.thumbnailUrl = result;
          }

          resolve(mediaFile);
        };

        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      }
    });
  };

  const removeMedia = (index: number) => {
    const newMedia = selectedMedia.filter((_, i) => i !== index);
    onMediaSelect(newMedia);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(",")}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Button */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openFileDialog}
          disabled={isUploading || selectedMedia.length >= maxFiles}
          className="flex items-center gap-2"
        >
          <Image className="w-4 h-4" />
          {isUploading ? "Uploading..." : "Add Photos"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openFileDialog}
          disabled={isUploading || selectedMedia.length >= maxFiles}
          className="flex items-center gap-2"
        >
          <Video className="w-4 h-4" />
          {isUploading ? "Uploading..." : "Add Videos"}
        </Button>
      </div>

      {/* Selected Media Preview */}
      {selectedMedia.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {selectedMedia.map((media, index) => (
            <Card key={index} className="relative group">
              <CardContent className="p-0">
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  {media.type === "image" ? (
                    <img
                      src={media.url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Video className="w-8 h-8 text-muted-foreground" />
                      <div className="absolute inset-0 flex items-end p-2">
                        <span className="text-xs bg-black/50 text-white px-2 py-1 rounded">
                          {media.file.name}
                        </span>
                      </div>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeMedia(index)}
                    className="absolute top-2 right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedMedia.length >= maxFiles && (
        <p className="text-sm text-muted-foreground">
          Maximum {maxFiles} files allowed
        </p>
      )}
    </div>
  );
}