// components/layout/header.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    role: string;
  } | null;
  shopName?: string;
}

export default function Header({ user, shopName }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname.startsWith('/pos')) return 'Point of Sale';
    if (pathname.startsWith('/products')) return 'Products';
    if (pathname.startsWith('/inventory')) return 'Inventory';
    if (pathname.startsWith('/customers')) return 'Customers';
    if (pathname.startsWith('/transactions')) return 'Transactions';
    if (pathname.startsWith('/reports')) return 'Reports';
    if (pathname.startsWith('/employees')) return 'Employees';
    if (pathname.startsWith('/settings')) return 'Settings';
    return 'ShopManager';
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 safe-top">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left: Page Title or Shop Name */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">
            {getPageTitle()}
          </h1>
          {shopName && (
            <span className="hidden sm:inline-block text-sm text-gray-500">
              · {shopName}
            </span>
          )}
        </div>

        {/* Right: User Menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* User Avatar */}
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              
              {/* User Name (hidden on mobile) */}
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {user.name}
              </span>
              
              {/* Dropdown Icon */}
              <svg
                className={cn(
                  'w-4 h-4 text-gray-500 transition-transform',
                  showUserMenu && 'rotate-180'
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                {/* Overlay to close menu */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                
                {/* Menu */}
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <p className="text-xs text-primary-600 mt-1 capitalize">{user.role}</p>
                  </div>

                  {/* Menu Items */}
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Settings
                  </Link>
                  
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-danger-600 hover:bg-gray-100"
                    onClick={() => {
                      setShowUserMenu(false);
                      // TODO: Implement logout
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
