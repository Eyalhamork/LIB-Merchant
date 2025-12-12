import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { APP_NAME } from '@/lib/constants';
import { RegisterServiceWorker } from '@/components/offline/register-sw';
import { SyncManager } from '@/components/offline/sync-manager';
import { OfflineIndicator } from '@/components/offline/offline-indicator';
import { ConflictResolutionModal } from '@/components/offline/conflict-resolution-modal';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: 'Cloud-based inventory and sales management system for retail shops in Liberia',
  keywords: ['inventory', 'pos', 'retail', 'liberia', 'shop management', 'sales tracking'],
  authors: [{ name: 'ShopManager Team' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0ea5e9',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={inter.className}>
        {/* Service Worker Registration */}
        <RegisterServiceWorker />

        {/* Offline Sync Manager */}
        <SyncManager />

        {/* Offline Indicator */}
        <OfflineIndicator />

        {/* Conflict Resolution Modal */}
        <ConflictResolutionModal />

        {/* Main Content */}
        {children}

        {/* Toast Notifications */}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
