'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/conversations', label: 'Conversations', icon: MessageSquare },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-0.5 px-3">
      {links.map(({ href, label, icon: Icon }) => {
        const isActive =
          pathname === href ||
          (href !== '/overview' &&
            href !== '/dashboard' &&
            pathname.startsWith(href));

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors',
              isActive
                ? 'bg-accent font-medium text-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
