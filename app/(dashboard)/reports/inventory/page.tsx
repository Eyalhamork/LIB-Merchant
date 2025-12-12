// app/(dashboard)/reports/inventory/page-enhanced.tsx

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  getInventoryReport,
  getInventoryValuation,
  getLowStockProducts,
} from '@/lib/supabase/reports';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import Input from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import { formatCurrency, formatQuantity } from '@/lib/utils';
import {
  Package,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Download,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

export default function InventoryReportPage() {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'value'>('name');
  const [inventory, setInventory] = useState<any[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<any[]>([]);
  const [valuation, setValuation] = useState<any>(null);
  const [lowStock, setLowStock] = useState<any[]>([]);

  useEffect(() => {
    loadReports();
  }, [profile]);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchQuery, sortBy]);

  const loadReports = async () => {
    if (!profile?.shop_id) return;

    setIsLoading(true);
    try {
      const [inventoryData, valuationData, lowStockData] = await Promise.all([
        getInventoryReport(profile.shop_id),
        getInventoryValuation(profile.shop_id),
        getLowStockProducts(profile.shop_id),
      ]);

      setInventory(inventoryData);
      setValuation(valuationData);
      setLowStock(lowStockData);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const filterInventory = () => {
    let filtered = [...inventory];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.product_name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.product_name.localeCompare(b.product_name);
      } else if (sortBy === 'quantity') {
        return a.current_quantity - b.current_quantity;
      } else if (sortBy === 'value') {
        return b.stock_value - a.stock_value;
      }
      return 0;
    });

    setFilteredInventory(filtered);
  };

  const exportToCSV = () => {
    try {
      const sections = [];

      // 1. Summary Statistics
      sections.push('INVENTORY SUMMARY');
      sections.push(`Generated,${new Date().toISOString()}`);
      sections.push(`Total Products,${valuation.total_items}`);
      sections.push(`Total Quantity,${valuation.total_quantity}`);
      sections.push(`Total Stock Value,${valuation.total_cost_value.toFixed(2)}`);
      sections.push(`Total Potential Revenue,${valuation.total_potential_revenue.toFixed(2)}`);
      sections.push(`Potential Profit,${valuation.potential_profit.toFixed(2)}`);
      sections.push(`Low Stock Items,${valuation.low_stock_items}`);
      sections.push('');

      // 2. Low Stock Items
      if (lowStock.length > 0) {
        sections.push('LOW STOCK ITEMS');
        sections.push('Product,Category,Current Quantity,Reorder Level,Unit');
        lowStock.forEach((item) => {
          sections.push(
            `${item.product.name},${item.product.category},${item.current_quantity},${
              item.reorder_level
            },${item.product.unit}`
          );
        });
        sections.push('');
      }

      // 3. Full Inventory Details
      sections.push('COMPLETE INVENTORY');
      if (profile?.role === 'owner') {
        sections.push(
          'Product,Category,Quantity,Unit,Cost Price,Selling Price,Stock Value,Potential Revenue,Potential Profit,Status'
        );
        filteredInventory.forEach((item) => {
          const profit = item.potential_revenue - item.stock_value;
          sections.push(
            `${item.product_name},${item.category},${item.current_quantity},${
              item.unit
            },${item.cost_price.toFixed(2)},${item.selling_price.toFixed(2)},${
              item.stock_value.toFixed(2)
            },${item.potential_revenue.toFixed(2)},${profit.toFixed(2)},${
              item.is_low_stock ? 'Low Stock' : 'In Stock'
            }`
          );
        });
      } else {
        sections.push('Product,Category,Quantity,Unit,Selling Price,Status');
        filteredInventory.forEach((item) => {
          sections.push(
            `${item.product_name},${item.category},${item.current_quantity},${item.unit},${
              item.selling_price.toFixed(2)
            },${item.is_low_stock ? 'Low Stock' : 'In Stock'}`
          );
        });
      }

      const csv = sections.join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success('Inventory report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Inventory Report</h1>
              <p className="text-sm text-gray-500">Stock levels and valuation</p>
            </div>
            <Button onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Valuation Summary */}
        {valuation && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {valuation.total_items}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Package className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Stock Value</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(valuation.total_cost_value)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Cost price basis</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Potential Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(valuation.total_potential_revenue)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Profit: {formatCurrency(valuation.potential_profit)}
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Low Stock Items</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {valuation.low_stock_items}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Low Stock Alert */}
        {lowStock.length > 0 && (
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">
                  {lowStock.length} product{lowStock.length > 1 ? 's' : ''} running low
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {lowStock.slice(0, 5).map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800"
                    >
                      {item.product.name}
                    </span>
                  ))}
                  {lowStock.length > 5 && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                      +{lowStock.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Search and Sort */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('name')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  sortBy === 'name'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Name
              </button>
              <button
                onClick={() => setSortBy('quantity')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  sortBy === 'quantity'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Quantity
              </button>
              <button
                onClick={() => setSortBy('value')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  sortBy === 'value'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Value
              </button>
            </div>
          </div>
        </Card>

        {/* Inventory Table */}
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">All Products</h2>
          {filteredInventory.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No products found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Product
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Category
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                      Quantity
                    </th>
                    {profile?.role === 'owner' && (
                      <>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                          Cost Price
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                          Stock Value
                        </th>
                      </>
                    )}
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                      Selling Price
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item) => (
                    <tr key={item.product_id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {item.product_name}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {item.category}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">
                        {formatQuantity(item.current_quantity, item.unit)}
                      </td>
                      {profile?.role === 'owner' && (
                        <>
                          <td className="py-3 px-4 text-sm text-gray-900 text-right">
                            {formatCurrency(item.cost_price)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                            {formatCurrency(item.stock_value)}
                          </td>
                        </>
                      )}
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">
                        {formatCurrency(item.selling_price)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.is_low_stock ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            In Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}