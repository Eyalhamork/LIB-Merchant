// app/(dashboard)/layout.tsx
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import BottomNav from '@/components/layout/bottom-nav';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role, shop_id')
    .eq('id', user.id)
    .single();

  // Get shop info
  const { data: shop } = profile?.shop_id
    ? await supabase
        .from('shops')
        .select('name')
        .eq('id', profile.shop_id)
        .single()
    : { data: null };

  const userData = profile
    ? {
        name: profile.name,
        email: user.email || '',
        role: profile.role,
      }
    : null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Desktop Only */}
      <Sidebar userRole={profile?.role} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header user={userData} shopName={shop?.name} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 pb-16 md:pb-0">
          {children}
        </main>

        {/* Bottom Navigation - Mobile Only */}
        <BottomNav />
      </div>
    </div>
  );
}
