// components/inventory/stock-movements-list.tsx

'use client';

import { useState, useEffect } from 'react';
import { getStockMovements, type StockMovementsFilters } from '@/lib/supabase/inventory';
import type { StockMovementType } from '@/types';
import Button from '@/components/ui/button';
import Select from '@/components/ui/select';
import Input from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import EmptyState from '@/components/ui/empty-state';
import {
  TrendingUp,
  TrendingDown,
  RotateCcw,
  ShoppingCart,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatDate, formatQuantity } from '@/lib/utils';
import { toast } from 'sonner';

interface StockMovementsListProps {
  shopId: string;
  productId?: string;
  limit?: number;
  showFilters?: boolean;
}

const MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  sale: 'Sale',
  restock: 'Restock',
  adjustment: 'Adjustment',
  return: 'Return',
};

const MOVEMENT_TYPE_COLORS: Record<
  StockMovementType,
  { bg: string; text: string; icon: any }
> = {
  sale: { bg: 'bg-red-100', text: 'text-red-700', icon: ShoppingCart },
  restock: { bg: 'bg-green-100', text: 'text-green-700', icon: TrendingUp },
  adjustment: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: RotateCcw },
  return: { bg: 'bg-teal-100', text: 'text-teal-700', icon: TrendingDown },
};

export default function StockMovementsList({
  shopId,
  productId,
  limit = 20,
  showFilters = true,
}: StockMovementsListProps) {
  const [movements, setMovements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [filters, setFilters] = useState<StockMovementsFilters>({
    productId,
    movementType: undefined,
    startDate: undefined,
    endDate: undefined,
  });

  const [showFilterPanel, setShowFilterPanel] = useState(false);

  useEffect(() => {
    loadMovements();
  }, [shopId, currentPage, filters]);

  const loadMovements = async () => {
    setIsLoading(true);
    try {
      const result = await getStockMovements({
        shopId,
        filters,
        page: currentPage,
        limit,
      });

      setMovements(result.movements);
      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading movements:', error);
      toast.error('Failed to load stock movements');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof StockMovementsFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleResetFilters = () => {
    setFilters({
      productId,
      movementType: undefined,
      startDate: undefined,
      endDate: undefined,
    });
    setCurrentPage(1);
  };

  const getMovementIcon = (movementType: StockMovementType) => {
    const config = MOVEMENT_TYPE_COLORS[movementType];
    const Icon = config.icon;
    return <Icon className="h-4 w-4" />;
  };

  const getQuantityDisplay = (quantityChange: number, unit?: string) => {
    const isPositive = quantityChange > 0;
    return (
      <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '+' : ''}
        {formatQuantity(quantityChange, unit)}
      </span>
    );
  };

  if (isLoading && movements.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isLoading && movements.length === 0) {
    return (
      <EmptyState
        icon={<RotateCcw />}
        title="No stock movements found"
        description={
          filters.movementType || filters.startDate || filters.endDate
            ? 'Try adjusting your filters'
            : 'Stock movements will appear here when inventory changes occur'
        }
        action={
          filters.movementType || filters.startDate || filters.endDate ? (
            <Button onClick={handleResetFilters}>Reset Filters</Button>
          ) : undefined
        }
      />
    );
  }

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-4">
      {/* Header with Filters */}
      {showFilters && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {totalCount} movement{totalCount !== 1 ? 's' : ''}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && showFilterPanel && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Movement Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Movement Type
              </label>
              <Select
                value={filters.movementType || ''}
                onChange={(e) =>
                  handleFilterChange(
                    'movementType',
                    e.target.value as StockMovementType
                  )
                }
              >
                <option value="">All Types</option>
                <option value="sale">Sale</option>
                <option value="restock">Restock</option>
                <option value="adjustment">Adjustment</option>
                <option value="return">Return</option>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </div>
        </div>
      )}

      {/* Movements List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Before
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  After
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movements.map((movement) => {
                const typeConfig = MOVEMENT_TYPE_COLORS[movement.movement_type as StockMovementType];
                return (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(movement.created_at, 'long')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-medium">
                        {movement.shop_product?.product?.name || 'Unknown Product'}
                      </div>
                      {movement.notes && (
                        <div className="text-xs text-gray-500 mt-1">
                          {movement.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${typeConfig.bg} ${typeConfig.text}`}
                      >
                        {getMovementIcon(movement.movement_type as StockMovementType)}
                        {MOVEMENT_TYPE_LABELS[movement.movement_type as StockMovementType]}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      {getQuantityDisplay(
                        movement.quantity_change,
                        movement.shop_product?.product?.unit
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                      {formatQuantity(
                        movement.quantity_before,
                        movement.shop_product?.product?.unit
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      {formatQuantity(
                        movement.quantity_after,
                        movement.shop_product?.product?.unit
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {movement.user?.name || 'Unknown'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={!hasMore || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
