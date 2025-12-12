// components/dashboard/summary-cards.tsx
'use client';

import { formatCurrency } from '@/lib/utils';
import { DollarSign, TrendingUp, CreditCard, ShoppingCart } from 'lucide-react';

interface SummaryCardsProps {
  totalSales: number;
  totalTransactions: number;
  cashSales: number;
  creditSales: number;
  currency?: string;
  isLoading?: boolean;
}

export default function SummaryCards({
  totalSales,
  totalTransactions,
  cashSales,
  creditSales,
  currency = 'LRD',
  isLoading = false,
}: SummaryCardsProps) {
  const cards = [
    {
      title: "Today's Sales",
      value: formatCurrency(totalSales, currency),
      icon: DollarSign,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Transactions',
      value: totalTransactions.toString(),
      icon: ShoppingCart,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Cash Sales',
      value: formatCurrency(cashSales, currency),
      icon: TrendingUp,
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Credit Sales',
      value: formatCurrency(creditSales, currency),
      icon: CreditCard,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">{card.title}</span>
              <div className={`${card.bgColor} p-2 rounded-lg`}>
                <Icon className={`h-5 w-5 ${card.textColor}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
          </div>
        );
      })}
    </div>
  );
}
