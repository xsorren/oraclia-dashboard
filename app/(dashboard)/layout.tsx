import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ALLOWED_ADMIN_EMAIL } from '@/lib/constants';
import { createServerSupabaseClient } from '@/lib/supabase/server';
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

  // Verify allowlist
  if (session.user.email !== ALLOWED_ADMIN_EMAIL) {
    redirect('/unauthorized');
  }

  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
