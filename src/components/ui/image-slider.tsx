'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Upload, X, RotateCcw, ZoomIn, ZoomOut, Move, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/context';

interface ImageSliderProps {
  images: string[];
  onImagesChange?: (images: string[]) => void;
  onImageUpload?: (files: FileList) => void;
  editable?: boolean;
  maxImages?: number;
  className?: string;
}

export function ImageSlider({ 
  images, 
  onImagesChange, 
  onImageUpload, 
  editable = false, 
  maxImages = 10,
  className 
}: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [alternativeUrls, setAlternativeUrls] = useState<Record<number, string[]>>({});
  const [currentUrlIndex, setCurrentUrlIndex] = useState<Record<number, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [images.length]);

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && onImageUpload) {
      onImageUpload(files);
    }
  }, [onImageUpload]);

  const handleRemoveImage = useCallback((index: number) => {
    if (onImagesChange) {
      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);
      if (currentIndex >= newImages.length) {
        setCurrentIndex(Math.max(0, newImages.length - 1));
      }
    }
  }, [images, onImagesChange, currentIndex]);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (!editable) return;
    setIsDragging(true);
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, [editable]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!editable || draggedIndex === null || !onImagesChange) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    onImagesChange(newImages);
    setIsDragging(false);
    setDraggedIndex(null);
  }, [editable, draggedIndex, images, onImagesChange]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedIndex(null);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Generate alternative URLs for Google Drive images
  const generateAlternativeUrls = useCallback((url: string): string[] => {
    if (!url) return [url];
    
    const alternatives = [url]; // Always include original URL first
    
    // Extract file ID from Google Drive URLs
    let fileId = '';
    
    const patterns = [
      /drive\.usercontent\.google\.com\/download\?id=([a-zA-Z0-9_-]+)/,
      /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
      /drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/,
      /drive\.google\.com\/thumbnail\?id=([a-zA-Z0-9_-]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        fileId = match[1];
        break;
      }
    }
    
    if (fileId) {
      // Add various Google Drive formats to try (ordered by reliability)
      const formats = [
        `https://lh3.googleusercontent.com/d/${fileId}=w1000`,
        `https://lh3.googleusercontent.com/d/${fileId}=w800`,
        `https://lh3.googleusercontent.com/d/${fileId}=w500`,
        `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
        `https://drive.google.com/uc?id=${fileId}&export=view`,
        `https://drive.google.com/uc?id=${fileId}`,
        `https://drive.google.com/file/d/${fileId}/view?usp=sharing`
      ];
      
      // Add unique formats only
      formats.forEach(format => {
        if (!alternatives.includes(format)) {
          alternatives.push(format);
        }
      });
    }
    
    return alternatives;
  }, []);

  const handleImageError = useCallback((index: number) => {
    const currentUrl = images[index];
    const urlIndex = currentUrlIndex[index] || 0;
    
    // Generate alternative URLs if not already done
    if (!alternativeUrls[index]) {
      const alternatives = generateAlternativeUrls(currentUrl);
      setAlternativeUrls(prev => ({ ...prev, [index]: alternatives }));
      setCurrentUrlIndex(prev => ({ ...prev, [index]: 0 }));
    }
    
    const alternatives = alternativeUrls[index] || generateAlternativeUrls(currentUrl);
    const nextUrlIndex = urlIndex + 1;
    
    if (nextUrlIndex < alternatives.length) {
      // Try next alternative URL
      setCurrentUrlIndex(prev => ({ ...prev, [index]: nextUrlIndex }));

      // Force re-render by updating a state that affects the component
      setAlternativeUrls(prev => ({ ...prev, [index]: alternatives }));
    } else {
      // All alternatives failed, mark as error
      setImageErrors(prev => new Set(prev).add(index));
      // showToast(`Failed to load image.`, 'error');
    }
  }, [images, currentUrlIndex, alternativeUrls, generateAlternativeUrls, showToast]);

  const handleImageLoad = useCallback((index: number) => {
    setImageErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  }, []);

  // Reset image errors and alternative URLs when images array changes
  useEffect(() => {
    setImageErrors(new Set());
    setAlternativeUrls({});
    setCurrentUrlIndex({});
    setCurrentIndex(0);
  }, [images]);

  // Get the current URL to display for an image (considering alternatives)
  const getCurrentImageUrl = useCallback((index: number): string => {
    const originalUrl = images[index];
    const urlIndex = currentUrlIndex[index] || 0;
    const alternatives = alternativeUrls[index];
    
    if (alternatives && urlIndex < alternatives.length) {
      return alternatives[urlIndex];
    }
    
    return originalUrl;
  }, [images, currentUrlIndex, alternativeUrls]);

  if (images.length === 0) {
    return (
      <Card className={cn("p-8 border-2 border-dashed border-primary/30 hover:border-primary/50 bg-muted/5 hover:bg-muted/10 transition-all duration-200", className)}>
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center shadow-sm">
            <Upload className="h-7 w-7 text-primary/70" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">No images uploaded</p>
            <p className="text-sm text-muted-foreground">Upload images to create a gallery</p>
          </div>
          {editable && (
            <Button 
              onClick={handleImageUpload} 
              variant="outline" 
              className="gap-2 bg-background/90 hover:bg-background border border-primary/30 hover:border-primary/50 text-primary shadow-sm hover:shadow transition-all duration-200"
            >
              <Upload className="h-4 w-4" />
              Upload Images
            </Button>
          )}
        </div>
        {editable && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        )}
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4 ", className)}>
      {/* Main Image Display */}
      <Card className="relative overflow-hidden bg-muted/10 aspect-square flex items-center justify-center max-w-[400px] border">
        <div 
          ref={containerRef}
          className="relative w-full h-full overflow-hidden cursor-move max-w-[300px] max-h-[300px]"
          style={{ 
            transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
            transition: zoom === 1 ? 'transform 0.3s ease' : 'none'
          }}
        >
          {imageErrors.has(currentIndex) ? (
            // Error placeholder
            <div className="w-full h-full bg-gradient-to-br from-muted/50 to-muted/30 flex flex-col items-center justify-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-2" />
              <p className="text-sm font-medium">Image failed to load</p>
              <p className="text-xs opacity-70 text-center px-4 mb-2">
                {getCurrentImageUrl(currentIndex).length > 50 
                  ? `${getCurrentImageUrl(currentIndex).substring(0, 50)}...` 
                  : getCurrentImageUrl(currentIndex)
                }
              </p>
              {getCurrentImageUrl(currentIndex).includes('drive.google') && (
                <div className="text-xs opacity-60 text-center px-4">
                  <p>💡 Google Drive image detected</p>
                  <p>Make sure the file is publicly accessible</p>
                </div>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 h-7 text-xs"
                onClick={() => {
                  // Reset error state and try again
                  setImageErrors(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(currentIndex);
                    return newSet;
                  });
                  setCurrentUrlIndex(prev => ({ ...prev, [currentIndex]: 0 }));
                  setAlternativeUrls(prev => ({ ...prev, [currentIndex]: generateAlternativeUrls(images[currentIndex]) }));
                }}
              >
                Retry
              </Button>
            </div>
          ) : (
            <img
              src={getCurrentImageUrl(currentIndex)}
              alt={`Product image ${currentIndex + 1}`}
              className="w-full h-full object-cover select-none"
              draggable={false}
              onError={() => handleImageError(currentIndex)}
              onLoad={() => handleImageLoad(currentIndex)}
            />
          )}
        </div>

        {/* Navigation Controls - Enhanced visibility */}
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background"
              onClick={prevImage}
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background"
              onClick={nextImage}
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </Button>
          </>
        )}

        {/* Zoom Controls - Enhanced visibility */}
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-background/90 hover:bg-background"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-3.5 w-3.5 text-gray-700" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-background/90 hover:bg-background"
            onClick={resetZoom}
            disabled={zoom === 1}
          >
            <RotateCcw className="h-3.5 w-3.5 text-gray-700" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-background/90 hover:bg-background"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
          >
            <ZoomIn className="h-3.5 w-3.5 text-gray-700" />
          </Button>
        </div>

        {/* Image Counter - Enhanced visibility */}
        <div className="absolute bottom-2 left-2 bg-background/90">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Remove Button (Edit Mode) - Enhanced visibility */}
        {editable && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 left-2 h-8 w-8 shadow-md border border-red-200"
            onClick={() => handleRemoveImage(currentIndex)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </Card>

      {/* Thumbnail Strip - Enhanced visibility */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {images.map((image, index) => (
          <div
            key={index}
            className={cn(
              "relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer transition-all",
              currentIndex === index 
                ? "border-primary shadow-md scale-105" 
                : "border-muted hover:border-primary/50",
              editable && "cursor-move",
              isDragging && draggedIndex === index && "opacity-50 scale-95"
            )}
            onClick={() => setCurrentIndex(index)}
            draggable={editable}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            {imageErrors.has(index) ? (
              // Thumbnail error placeholder
              <div className="w-full h-full bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            ) : (
              <img
                src={getCurrentImageUrl(index)}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                onError={() => handleImageError(index)}
                onLoad={() => handleImageLoad(index)}
              />
            )}
            {editable && (
              <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center">
                <Move className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity" />
                {/* Subtle indicator for the current position */}
                {currentIndex === index && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Upload Button (Edit Mode) - Enhanced visibility */}
        {editable && images.length < maxImages && (
          <div
            className="flex-shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-primary/30 hover:border-primary/70 bg-muted/5 hover:bg-muted/10 transition-all duration-200 cursor-pointer flex items-center justify-center shadow-sm hover:shadow"
            onClick={handleImageUpload}
          >
            <Upload className="h-4 w-4 text-primary/70 hover:text-primary transition-colors" />
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      )}
    </div>
  );
}
