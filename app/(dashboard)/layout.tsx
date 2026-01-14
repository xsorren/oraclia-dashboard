import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Profile } from '@/types/database';
import { redirect } from 'next/navigation';

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', session.user.id)
    .single() as { data: Profile | null };

  if (!profile || profile.role !== 'admin') {
    redirect('/unauthorized');
  }

  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
