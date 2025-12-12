// components/shared/search-bar.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { debounce } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  isLoading?: boolean;
  showClearButton?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  debounceMs = 300,
  isLoading = false,
  showClearButton = true,
  autoFocus = false,
  className = '',
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Create debounced search function
  const debouncedSearch = useRef(
    debounce((searchValue: string) => {
      onSearch?.(searchValue);
    }, debounceMs)
  ).current;

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange(newValue);
    debouncedSearch(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    onSearch?.('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch?.(localValue);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {/* Search icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          🔍
        </div>

        {/* Input */}
        <Input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />

        {/* Loading spinner or clear button */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Spinner size="sm" />
          ) : (
            showClearButton &&
            localValue && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                ✕
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
