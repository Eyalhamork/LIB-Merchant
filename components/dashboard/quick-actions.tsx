// components/dashboard/quick-actions.tsx
'use client';

import Link from 'next/link';
import {
  ShoppingCart,
  Package,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export default function QuickActions() {
  const actions = [
    {
      title: 'New Sale',
      description: 'Start a new transaction',
      href: '/pos',
      icon: ShoppingCart,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
    },
    {
      title: 'Add Product',
      description: 'Add new inventory',
      href: '/products/add',
      icon: Package,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
    },
    {
      title: 'Add Customer',
      description: 'Register new customer',
      href: '/customers/add',
      icon: Users,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
    },
    {
      title: 'View Reports',
      description: 'Sales & inventory reports',
      href: '/reports',
      icon: FileText,
      color: 'bg-amber-500',
      hoverColor: 'hover:bg-amber-600',
    },
    {
      title: 'Record Payment',
      description: 'Log credit payment',
      href: '/customers',
      icon: DollarSign,
      color: 'bg-emerald-500',
      hoverColor: 'hover:bg-emerald-600',
    },
    {
      title: 'Restock',
      description: 'Update inventory levels',
      href: '/inventory/restock',
      icon: TrendingUp,
      color: 'bg-cyan-500',
      hoverColor: 'hover:bg-cyan-600',
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              href={action.href}
              className="group flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
            >
              <div
                className={`${action.color} ${action.hoverColor} p-3 rounded-lg mb-3 transition-colors`}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-medium text-gray-900 text-sm text-center mb-1">
                {action.title}
              </h4>
              <p className="text-xs text-gray-500 text-center line-clamp-2">
                {action.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
