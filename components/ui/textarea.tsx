// components/ui/textarea.tsx
import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  maxLength?: number;
  showCount?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      fullWidth = false,
      maxLength,
      showCount = false,
      value,
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className={cn('flex flex-col gap-1', fullWidth && 'w-full')}>
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={textareaId}
              className="text-sm font-medium text-gray-700"
            >
              {label}
              {props.required && <span className="text-danger-600 ml-1">*</span>}
            </label>
            {showCount && maxLength && (
              <span className="text-xs text-gray-500">
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          maxLength={maxLength}
          value={value}
          className={cn(
            'w-full px-3 py-2 border rounded-lg text-gray-900 placeholder:text-gray-400 resize-y',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            error && 'border-danger-500 focus:ring-danger-500',
            !error && 'border-gray-300',
            className
          )}
          {...props}
        />

        {error && <p className="text-sm text-danger-600">{error}</p>}

        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
