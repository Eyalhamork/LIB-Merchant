// components/shared/image-preview.tsx
'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface ImagePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
  title?: string;
  onDelete?: () => void;
  onDownload?: () => void;
}

export function ImagePreview({
  isOpen,
  onClose,
  imageUrl,
  alt = 'Image preview',
  title,
  onDelete,
  onDownload,
}: ImagePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setHasError(false);
      setZoom(1);
    }
  }, [isOpen, imageUrl]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  const handleDownload = () => {
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = title || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onDownload?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Image Preview'}
      size="xl"
    >
      <div className="space-y-4">
        {/* Image container */}
        <div className="relative bg-gray-100 rounded-lg overflow-hidden min-h-[400px] flex items-center justify-center">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          )}

          {hasError && (
            <div className="text-center py-12">
              <div className="text-4xl mb-2">🖼️</div>
              <p className="text-gray-600">Failed to load image</p>
            </div>
          )}

          {!hasError && (
            <img
              src={imageUrl}
              alt={alt}
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{
                transform: `scale(${zoom})`,
                transition: 'transform 0.2s ease',
              }}
              className="max-w-full max-h-[500px] object-contain"
            />
          )}
        </div>

        {/* Zoom controls */}
        {!hasError && !isLoading && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              −
            </Button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              +
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetZoom}>
              Reset
            </Button>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          {onDownload && !hasError && (
            <Button variant="outline" onClick={handleDownload} className="flex-1">
              Download
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" onClick={onDelete} className="flex-1">
              Delete
            </Button>
          )}
          <Button variant="primary" onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
