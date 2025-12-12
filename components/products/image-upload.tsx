// components/products/image-upload.tsx

'use client';

import { useState, useRef } from 'react';
import Button from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import { uploadProductImage } from '@/lib/supabase/products';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
}

export function ImageUpload({ value, onChange, onRemove }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const url = await uploadProductImage(file);
      onChange(url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    } else {
      onChange('');
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Current Image */}
      {value && (
        <div className="relative w-full h-48 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
          <img
            src={value}
            alt="Product"
            className="w-full h-full object-contain"
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={isUploading}
            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload Button */}
      {!value && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Spinner size="lg" />
              <p className="text-sm text-gray-600">Uploading image...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  PNG, JPG up to 5MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
