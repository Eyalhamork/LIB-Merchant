// components/ui/checkbox.tsx
import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-start gap-3">
          <div className="flex items-center h-5">
            <input
              ref={ref}
              type="checkbox"
              id={checkboxId}
              className={cn(
                'w-4 h-4 border-gray-300 rounded text-primary-600',
                'focus:ring-2 focus:ring-primary-500 focus:ring-offset-0',
                'disabled:bg-gray-100 disabled:cursor-not-allowed',
                error && 'border-danger-500',
                className
              )}
              {...props}
            />
          </div>

          {(label || description) && (
            <div className="flex-1">
              {label && (
                <label
                  htmlFor={checkboxId}
                  className="text-sm font-medium text-gray-900 cursor-pointer"
                >
                  {label}
                </label>
              )}
              {description && (
                <p className="text-sm text-gray-500 mt-0.5">{description}</p>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-danger-600 ml-7">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
