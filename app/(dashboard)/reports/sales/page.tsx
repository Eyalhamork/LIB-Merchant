// app/(dashboard)/reports/sales/page-enhanced.tsx

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  getSalesByDay,
  getSalesByPaymentMethod,
  getTopSellingProducts,
  getEmployeePerformance,
  getDashboardStats,
} from '@/lib/supabase/reports';
import { DateRangePicker } from '@/components/reports/date-range-picker';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import Spinner from '@/components/ui/spinner';
import { formatCurrency, formatQuantity } from '@/lib/utils';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Download,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const PAYMENT_COLORS = {
  cash: '#10b981',
  mtn_momo: '#3b82f6',
  orange_money: '#f97316',
  credit: '#f59e0b',
};

export default function SalesReportPage() {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Date range
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);

  // Data
  const [stats, setStats] = useState<any>(null);
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [employeePerformance, setEmployeePerformance] = useState<any[]>([]);

  useEffect(() => {
    loadReports();
  }, [profile, startDate, endDate]);

  const loadReports = async () => {
    if (!profile?.shop_id) return;

    setIsLoading(true);
    try {
      const startDateTime = `${startDate}T00:00:00Z`;
      const endDateTime = `${endDate}T23:59:59Z`;

      const [statsData, dailyData, paymentsData, productsData, employeeData] =
        await Promise.all([
          getDashboardStats(profile.shop_id, startDateTime, endDateTime),
          getSalesByDay(profile.shop_id, startDateTime, endDateTime),
          getSalesByPaymentMethod(profile.shop_id, startDateTime, endDateTime),
          getTopSellingProducts(profile.shop_id, startDateTime, endDateTime, 10),
          getEmployeePerformance(profile.shop_id, startDateTime, endDateTime),
        ]);

      setStats(statsData);
      setDailySales(dailyData);
      setPaymentBreakdown(paymentsData);
      setTopProducts(productsData);
      setEmployeePerformance(employeeData);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    try {
      // Prepare comprehensive CSV data
      const sections = [];

      // 1. Summary Stats
      sections.push('SALES SUMMARY');
      sections.push(`Period,${startDate} to ${endDate}`);
      sections.push(`Total Sales,${stats.total_sales}`);
      sections.push(`Total Transactions,${stats.total_transactions}`);
      sections.push(`Average Sale,${stats.average_sale}`);
      sections.push(`Total Discount,${stats.total_discount}`);
      sections.push('');

      // 2. Payment Method Breakdown
      sections.push('PAYMENT METHOD BREAKDOWN');
      sections.push('Method,Amount');
      sections.push(`Cash,${stats.cash_sales}`);
      sections.push(`Mobile Money,${stats.momo_sales}`);
      sections.push(`Credit,${stats.credit_sales}`);
      sections.push('');

      // 3. Daily Sales
      sections.push('DAILY SALES');
      sections.push('Date,Total Sales,Transactions,Average Sale');
      dailySales.forEach((day) => {
        sections.push(
          `${day.date},${day.total_sales},${day.transaction_count},${
            (day.total_sales / day.transaction_count).toFixed(2)
          }`
        );
      });
      sections.push('');

      // 4. Top Products
      sections.push('TOP SELLING PRODUCTS');
      sections.push('Product,Category,Quantity Sold,Times Sold,Total Revenue');
      topProducts.forEach((product) => {
        sections.push(
          `${product.product_name},${product.category},${product.quantity_sold},${
            product.times_sold
          },${product.total_revenue.toFixed(2)}`
        );
      });
      sections.push('');

      // 5. Employee Performance
      if (profile?.role === 'owner' && employeePerformance.length > 0) {
        sections.push('EMPLOYEE PERFORMANCE');
        sections.push('Employee,Role,Total Sales,Transactions,Average Sale');
        employeePerformance.forEach((emp) => {
          sections.push(
            `${emp.employee_name},${emp.role},${emp.total_sales},${
              emp.transaction_count
            },${emp.average_sale.toFixed(2)}`
          );
        });
      }

      const csv = sections.join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-report-${startDate}-to-${endDate}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  // Prepare chart data
  const dailySalesChartData = dailySales.map((day) => ({
    date: new Date(day.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    sales: day.total_sales,
    transactions: day.transaction_count,
  }));

  const paymentPieData = [
    { name: 'Cash', value: stats?.cash_sales || 0, color: PAYMENT_COLORS.cash },
    { name: 'MTN MoMo', value: (stats?.momo_sales || 0) / 2, color: PAYMENT_COLORS.mtn_momo },
    { name: 'Orange Money', value: (stats?.momo_sales || 0) / 2, color: PAYMENT_COLORS.orange_money },
    { name: 'Credit', value: stats?.credit_sales || 0, color: PAYMENT_COLORS.credit },
  ].filter((item) => item.value > 0);

  const topProductsChartData = topProducts.slice(0, 5).map((product) => ({
    name: product.product_name.length > 20
      ? product.product_name.substring(0, 20) + '...'
      : product.product_name,
    revenue: product.total_revenue,
    quantity: product.quantity_sold,
  }));

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
              <h1 className="text-xl font-bold text-gray-900">Sales Report</h1>
              <p className="text-sm text-gray-500">Analyze your sales performance</p>
            </div>
            <Button onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Date Range Picker */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Date Range</h2>
          </div>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </Card>

        {/* Summary Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stats.total_sales)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.total_transactions}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Sale</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stats.average_sale)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Discount</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stats.total_discount)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Sales Line Chart */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-gray-600" />
              <h2 className="font-semibold text-gray-900">Sales Trend</h2>
            </div>
            {dailySalesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailySalesChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: any, name: string) =>
                      name === 'sales'
                        ? formatCurrency(value)
                        : `${value} transactions`
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Sales (LRD)"
                  />
                  <Line
                    type="monotone"
                    dataKey="transactions"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Transactions"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No sales data for this period
              </div>
            )}
          </Card>

          {/* Payment Methods Pie Chart */}
          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Payment Methods</h2>
            {paymentPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No payment data
              </div>
            )}
          </Card>
        </div>

        {/* Top Products Bar Chart */}
        {topProductsChartData.length > 0 && (
          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Top 5 Selling Products
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: any, name: string) =>
                    name === 'revenue'
                      ? formatCurrency(value)
                      : `${value} units`
                  }
                />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue (LRD)" />
                <Bar dataKey="quantity" fill="#3b82f6" name="Quantity Sold" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Payment Method Breakdown */}
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Payment Methods</h2>
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium">Cash</p>
                <p className="text-xl font-bold text-green-900 mt-1">
                  {formatCurrency(stats.cash_sales)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {stats.total_sales > 0
                    ? ((stats.cash_sales / stats.total_sales) * 100).toFixed(1)
                    : 0}
                  % of total
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium">Mobile Money</p>
                <p className="text-xl font-bold text-blue-900 mt-1">
                  {formatCurrency(stats.momo_sales)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {stats.total_sales > 0
                    ? ((stats.momo_sales / stats.total_sales) * 100).toFixed(1)
                    : 0}
                  % of total
                </p>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-700 font-medium">Credit</p>
                <p className="text-xl font-bold text-amber-900 mt-1">
                  {formatCurrency(stats.credit_sales)}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  {stats.total_sales > 0
                    ? ((stats.credit_sales / stats.total_sales) * 100).toFixed(1)
                    : 0}
                  % of total
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Daily Sales Table */}
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Sales by Day</h2>
          {dailySales.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No sales in this period
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Date
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                      Sales
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                      Transactions
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                      Avg Sale
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dailySales.map((day) => (
                    <tr key={day.date} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(day.total_sales)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">
                        {day.transaction_count}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">
                        {formatCurrency(day.total_sales / day.transaction_count)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Top Products */}
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Top Selling Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No products sold in this period
            </p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div
                  key={product.product_id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {product.product_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatQuantity(product.quantity_sold, product.unit)} sold •{' '}
                        {product.times_sold} transactions
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(product.total_revenue)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Employee Performance */}
        {profile?.role === 'owner' && employeePerformance.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-gray-600" />
              <h2 className="font-semibold text-gray-900">Employee Performance</h2>
            </div>
            <div className="space-y-3">
              {employeePerformance.map((employee, index) => (
                <div
                  key={employee.employee_id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-purple-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {employee.employee_name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {employee.role} • {employee.transaction_count} sales • Avg:{' '}
                        {formatCurrency(employee.average_sale)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(employee.total_sales)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}