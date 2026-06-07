'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const links = [
  { href: '/',         label: '⚡ Dashboard' },
  { href: '/zones',    label: '🗺 Zones' },
  { href: '/about',    label: 'ℹ️ About' },
  { href: '/settings', label: '⚙️ Settings' },
];

export function Navbar() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-panel border-t border-border safe-bottom">
      <div className="max-w-lg lg:max-w-2xl mx-auto flex">
        {links.map((l) => (
          <Link key={l.href} href={l.href}
            className={clsx(
              'flex-1 flex flex-col items-center justify-center py-3 min-h-[52px] text-xs transition-colors',
              path === l.href
                ? 'text-accent font-semibold'
                : 'text-muted hover:text-content',
            )}>
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
