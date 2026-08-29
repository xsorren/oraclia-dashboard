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
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verify allowlist
  if (user.email !== ALLOWED_ADMIN_EMAIL) {
    redirect('/unauthorized');
  }

  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
