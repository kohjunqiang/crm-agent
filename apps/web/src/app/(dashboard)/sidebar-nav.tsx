'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/settings', label: 'Settings' },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'rounded-md px-3 py-2 text-sm',
            pathname === href
              ? 'bg-accent font-medium text-primary'
              : 'text-muted-foreground hover:bg-accent/50',
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
