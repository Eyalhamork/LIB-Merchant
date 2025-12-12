// components/products/low-stock-badge.tsx

'use client';

import Badge from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface LowStockBadgeProps {
  currentQuantity: number;
  reorderLevel: number;
  unit?: string;
}

export function LowStockBadge({
  currentQuantity,
  reorderLevel,
  unit = 'units',
}: LowStockBadgeProps) {
  if (currentQuantity === 0) {
    return (
      <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Out of Stock
      </Badge>
    );
  }

  if (currentQuantity <= reorderLevel) {
    return (
      <Badge className="bg-amber-100 text-amber-800 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Low Stock ({currentQuantity} {unit})
      </Badge>
    );
  }

  return null;
}
