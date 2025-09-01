import React, { useRef, useState } from 'react';
import { Upload, Music, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UploadSectionProps {
  onFileUpload: (files: FileList) => Promise<void>;
  isUploading?: boolean;
  layout?: 'mobile' | 'desktop';
  className?: string;
}

export function UploadSection({
  onFileUpload,
  isUploading = false,
  layout = 'desktop',
  className = ''
}: UploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const isMobile = layout === 'mobile';

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      await onFileUpload(files);
    } catch (error) {
      toast.error('Failed to upload files');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    if (files.length === 0) return;

    // Filter audio files
    const audioFiles = Array.from(files).filter(file => 
      file.type.startsWith('audio/')
    );

    if (audioFiles.length === 0) {
      toast.error('Please select audio files only');
      return;
    }

    if (audioFiles.length !== files.length) {
      toast.warning(`${files.length - audioFiles.length} non-audio files were ignored`);
    }

    // Create FileList-like object
    const fileList = {
      length: audioFiles.length,
      item: (index: number) => audioFiles[index],
      [Symbol.iterator]: function* () {
        for (let i = 0; i < audioFiles.length; i++) {
          yield audioFiles[i];
        }
      }
    } as FileList;

    try {
      await onFileUpload(fileList);
    } catch (error) {
      toast.error('Failed to upload files');
    }
  };

  if (isMobile) {
    return (
      <div className={cn("w-full", className)}>
        <Button
          onClick={handleFileSelect}
          disabled={isUploading}
          className="w-full h-12"
          variant="outline"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Music
            </>
          )}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/20",
          isUploading && "pointer-events-none opacity-50"
        )}
        onClick={handleFileSelect}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            <div className="text-sm text-muted-foreground">Uploading files...</div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-muted/20 p-3">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <div className="font-medium mb-1">
                {isDragOver ? 'Drop files here' : 'Upload Audio Files'}
              </div>
              <div className="text-sm text-muted-foreground">
                {isDragOver 
                  ? 'Release to upload' 
                  : 'Drag & drop audio files or click to browse'
                }
              </div>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}