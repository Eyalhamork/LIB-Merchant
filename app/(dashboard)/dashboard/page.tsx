// app/(dashboard)/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  getTodaysSummary,
  getRecentTransactions,
  getLowStockProducts,
  getOutstandingCredit,
} from '@/lib/supabase/dashboard';
import SummaryCards from '@/components/dashboard/summary-cards';
import RecentTransactions from '@/components/dashboard/recent-transactions';
import CreditSummary from '@/components/dashboard/credit-summary';
import LowStockAlert from '@/components/dashboard/low-stock-alert';
import QuickActions from '@/components/dashboard/quick-actions';
import SessionStatus from '@/components/dashboard/session-status';
import { RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Dashboard data state
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalDiscount: 0,
    totalTransactions: 0,
    cashSales: 0,
    momoSales: 0,
    orangeMoneySales: 0,
    creditSales: 0,
    activeSession: null,
  });
  
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [creditData, setCreditData] = useState<{
    totalOutstanding: number;
    customersWithCredit: number;
    topCustomers: any[];
  }>({
    totalOutstanding: 0,
    customersWithCredit: 0,
    topCustomers: [],
  });

  const currency = 'LRD'; // TODO: Get from shop settings

  const loadDashboardData = async () => {
    if (!profile?.shop_id) return;

    try {
      setRefreshing(true);

      // Load all data in parallel
      const [summaryData, transactionsData, lowStockData, creditDataResult] = await Promise.all([
        getTodaysSummary(profile.shop_id),
        getRecentTransactions(profile.shop_id, 10),
        getLowStockProducts(profile.shop_id),
        getOutstandingCredit(profile.shop_id),
      ]);

      setSummary(summaryData);
      setRecentTransactions(transactionsData);
      setLowStockProducts(lowStockData);
      setCreditData(creditDataResult);
    } catch (error) {
      console.error('Load dashboard data error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [profile?.shop_id]);

  const handleRefresh = () => {
    loadDashboardData();
  };

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {profile.name}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6">
        <SummaryCards
          totalSales={summary.totalSales}
          totalTransactions={summary.totalTransactions}
          cashSales={summary.cashSales}
          creditSales={summary.creditSales}
          currency={currency}
          isLoading={loading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          <RecentTransactions
            transactions={recentTransactions}
            currency={currency}
            isLoading={loading}
          />
          
          <QuickActions />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          <SessionStatus
            session={summary.activeSession}
            currency={currency}
            isLoading={loading}
          />

          <CreditSummary
            totalOutstanding={creditData.totalOutstanding}
            customersWithCredit={creditData.customersWithCredit}
            topCustomers={creditData.topCustomers}
            currency={currency}
            isLoading={loading}
          />
        </div>
      </div>

      {/* Low Stock Alert - Full Width */}
      <div className="mb-6">
        <LowStockAlert
          products={lowStockProducts}
          isLoading={loading}
        />
      </div>
    </div>
  );
}
