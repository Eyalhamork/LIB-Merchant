// app/(dashboard)/reports/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getDashboardStats, getCreditSummary } from '@/lib/supabase/reports';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp,
  Package,
  DollarSign,
  Users,
  ChevronRight,
  Calendar,
  ShoppingCart,
  AlertCircle,
} from 'lucide-react';

export default function ReportsPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Date ranges
  const today = new Date().toISOString().split('T')[0];
  const todayStart = `${today}T00:00:00Z`;
  const todayEnd = `${today}T23:59:59Z`;

  const firstDayOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString().split('T')[0];
  const monthStart = `${firstDayOfMonth}T00:00:00Z`;
  const monthEnd = `${today}T23:59:59Z`;

  // Stats
  const [todayStats, setTodayStats] = useState<any>(null);
  const [monthStats, setMonthStats] = useState<any>(null);
  const [creditSummary, setCreditSummary] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, [profile]);

  const loadStats = async () => {
    if (!profile?.shop_id) return;

    setIsLoading(true);
    try {
      const [todayData, monthData, creditData] = await Promise.all([
        getDashboardStats(profile.shop_id, todayStart, todayEnd),
        getDashboardStats(profile.shop_id, monthStart, monthEnd),
        getCreditSummary(profile.shop_id),
      ]);

      setTodayStats(todayData);
      setMonthStats(monthData);
      setCreditSummary(creditData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
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
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your business performance and insights
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Quick Stats - Today */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Today's Performance</h2>
          </div>
          {todayStats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Today's Sales</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(todayStats.total_sales)}
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
                      {todayStats.total_transactions}
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
                      {formatCurrency(todayStats.average_sale)}
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
                    <p className="text-sm text-gray-600">Cash Sales</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(todayStats.cash_sales)}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Quick Stats - Month */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">This Month</h2>
          </div>
          {monthStats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(monthStats.total_sales)}
                </p>
              </Card>

              <Card className="p-4">
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {monthStats.total_transactions}
                </p>
              </Card>

              <Card className="p-4">
                <p className="text-sm text-gray-600">Mobile Money</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(monthStats.momo_sales)}
                </p>
              </Card>

              <Card className="p-4">
                <p className="text-sm text-gray-600">Credit Sales</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(monthStats.credit_sales)}
                </p>
              </Card>
            </div>
          )}
        </div>

        {/* Credit Summary */}
        {creditSummary && creditSummary.total_outstanding > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <h2 className="font-semibold text-gray-900">Outstanding Credit</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Total Outstanding</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {formatCurrency(creditSummary.total_outstanding)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  From {creditSummary.customer_count} customer
                  {creditSummary.customer_count > 1 ? 's' : ''}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Top Credit Customers</p>
                <div className="space-y-2">
                  {creditSummary.customers.slice(0, 3).map((customer: any) => (
                    <div
                      key={customer.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-700">{customer.name}</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(customer.credit_balance)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Report Categories */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">Detailed Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sales Report */}
            <Card
              className="p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push('/reports/sales')}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Sales Report</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Analyze sales trends, payment methods, top products, and employee
                    performance
                  </p>
                  <ul className="mt-3 space-y-1 text-sm text-gray-600">
                    <li>• Sales by day/week/month</li>
                    <li>• Payment method breakdown</li>
                    <li>• Top selling products</li>
                    <li>• Employee performance</li>
                  </ul>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </div>
            </Card>

            {/* Inventory Report */}
            <Card
              className="p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push('/reports/inventory')}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Package className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Inventory Report</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Track stock levels, valuation, and identify low stock items
                  </p>
                  <ul className="mt-3 space-y-1 text-sm text-gray-600">
                    <li>• Stock valuation</li>
                    <li>• Low stock alerts</li>
                    <li>• Product-wise inventory</li>
                    <li>• Potential profit analysis</li>
                  </ul>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
