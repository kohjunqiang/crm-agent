import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from './logout-button';

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
        <nav className="flex flex-1 flex-col gap-1 px-3">
          <Link
            href="/dashboard"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Dashboard
          </Link>
          <Link
            href="/settings"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Settings
          </Link>
        </nav>
        <div className="border-t p-3">
          <LogoutButton />
        </div>
      </aside>
      <main className="ml-64 flex-1 p-6">{children}</main>
    </div>
  );
}
