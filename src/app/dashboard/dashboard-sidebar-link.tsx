'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import * as React from 'react';

interface Props {
  href: string;
  icon: React.ReactNode;
  label: string;
}

export function DashboardSidebarLink({ href, icon, label }: Props) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
        active
          ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/30'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
