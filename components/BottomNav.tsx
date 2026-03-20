'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const BottomNav = () => {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const linkClasses = (path: string) =>
    `flex flex-col items-center justify-center py-3 px-4 flex-1 ${
      isActive(path)
        ? 'text-env-green border-t-2 border-env-green'
        : 'text-gray-400'
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark border-t border-navy flex">
      <Link href="/dashboard" className={linkClasses('/dashboard')}>
        <span className="text-xl mb-1">🏠</span>
        <span className="text-xs">Home</span>
      </Link>
      <Link href="/log/new" className={linkClasses('/log')}>
        <span className="text-xl mb-1">🌿</span>
        <span className="text-xs">Log Today</span>
      </Link>
      <Link href="/history" className={linkClasses('/history')}>
        <span className="text-xl mb-1">📋</span>
        <span className="text-xs">History</span>
      </Link>
      <Link href="/profile" className={linkClasses('/profile')}>
        <span className="text-xl mb-1">👤</span>
        <span className="text-xs">Profile</span>
      </Link>
    </nav>
  );
};
