import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from './logout-button';
import { SidebarNav } from './sidebar-nav';
import { MobileNav } from './mobile-nav';

function UserAvatar({ email }: { email: string }) {
  const initials = email
    .split('@')[0]
    .split(/[._-]/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-foreground">
      {initials || '?'}
    </div>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const userEmail = user.email ?? '';
  const userName = userEmail.split('@')[0] ?? 'User';

  const sidebarBrand = (
    <>
      <div className="px-5 py-5">
        <p className="text-base font-semibold text-foreground">Drapeworks</p>
        <p className="text-[11px] text-muted-foreground">AgentCRM</p>
      </div>
      <div className="mx-4 border-t border-sidebar-border" />
    </>
  );

  const sidebarUser = (
    <div className="border-t border-sidebar-border px-4 py-3">
      <div className="flex items-center gap-2.5">
        <UserAvatar email={userEmail} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium capitalize">
            {userName}
          </span>
          <span className="truncate text-[11px] text-muted-foreground">
            {userEmail}
          </span>
        </div>
        <LogoutButton />
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Mobile top bar + drawer */}
      <MobileNav>
        {sidebarBrand}
        <div className="mt-4 flex-1">
          <SidebarNav />
        </div>
        {sidebarUser}
      </MobileNav>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        {sidebarBrand}
        <div className="mt-4 flex-1">
          <SidebarNav />
        </div>
        {sidebarUser}
      </aside>

      <main className="ml-0 min-h-screen flex-1 p-4 pt-16 md:ml-64 md:p-6">
        {children}
      </main>
    </div>
  );
}
