// components/ui/empty-state.tsx
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-gray-400">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-gray-500 mb-6 max-w-sm">
          {description}
        </p>
      )}
      
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
}
