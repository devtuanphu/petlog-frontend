'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-teal-400">Loading...</div></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen pb-20">
      {/* Top bar */}
      <div className="sticky top-0 z-50 glass px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="PetLog" width={100} height={32} className="h-7 w-auto" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">{user.full_name}</span>
          <button onClick={() => { logout(); router.push('/'); }} className="text-xs text-slate-500 hover:text-red-400">Đăng xuất</button>
        </div>
      </div>
      {children}
    </div>
  );
}
