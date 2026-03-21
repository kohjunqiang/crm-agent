'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Tag,
  ClipboardList,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProducts } from '@/app/actions/products';

function ProductsBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    getProducts()
      .then((products) => setCount(products.length))
      .catch(() => setCount(null));
  }, []);

  if (count === null || count === 0) return null;

  return (
    <span className="ml-auto text-xs font-medium bg-accent text-muted-foreground rounded-full px-1.5 py-0.5">
      {count}
    </span>
  );
}

const links = [
  { href: '/overview', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/products', label: 'Products', icon: Tag },
  { href: '/orders', label: 'Orders', icon: ClipboardList },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarNavProps {
  activeOrderCount?: number;
}

export function SidebarNav({ activeOrderCount = 0 }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-0.5 px-3">
      {links.map(({ href, label, icon: Icon }) => {
        const isActive =
          pathname === href ||
          (href !== '/overview' &&
            href !== '/dashboard' &&
            pathname.startsWith(href));

        const badge = href === '/orders' && activeOrderCount > 0 ? activeOrderCount : null;

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
            {badge !== null && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
                {badge}
              </span>
            )}
            {href === '/products' && <ProductsBadge />}
          </Link>
        );
      })}
    </nav>
  );
}
