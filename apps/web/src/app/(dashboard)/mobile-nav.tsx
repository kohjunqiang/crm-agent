'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { SidebarNav } from './sidebar-nav';

const PAGE_TITLES: { prefix: string; label: string }[] = [
  { prefix: '/overview', label: 'Dashboard' },
  { prefix: '/clients', label: 'Clients' },
  { prefix: '/products', label: 'Products' },
  { prefix: '/orders', label: 'Orders' },
  { prefix: '/settings', label: 'Settings' },
];

function getPageTitle(pathname: string): string {
  return PAGE_TITLES.find((p) => pathname.startsWith(p.prefix))?.label ?? '';
}

export function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center border-b border-sidebar-border bg-sidebar px-4 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-accent">
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-full flex-col">
            {children}
          </div>
        </SheetContent>
      </Sheet>
      <span className="ml-2 text-base font-semibold text-foreground">
        Drapeworks
      </span>
      {pageTitle && (
        <span className="ml-auto text-sm font-medium text-muted-foreground">
          {pageTitle}
        </span>
      )}
    </header>
  );
}
