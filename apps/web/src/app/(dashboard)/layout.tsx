import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from './logout-button';
import { SidebarNav } from './sidebar-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r bg-white">
        <div className="p-6">
          <span className="text-xl font-bold">AgentCRM</span>
        </div>
        <SidebarNav />
        <div className="border-t p-3">
          <LogoutButton />
        </div>
      </aside>
      <main className="ml-64 flex-1 p-6">{children}</main>
    </div>
  );
}
