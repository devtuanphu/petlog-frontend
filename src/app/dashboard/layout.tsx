'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, DoorOpen, ClipboardList, Users, QrCode, Settings, LogOut, MessageSquare, Crown, BookOpen, Menu, X, ScanLine, FileText, Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

type NavItem = { href: string; icon: typeof LayoutDashboard; label: string; roles: ('owner' | 'staff')[] };

const navItems: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Tổng quan', roles: ['owner', 'staff'] },
  { href: '/dashboard/revenue', icon: TrendingUp, label: 'Doanh thu', roles: ['owner'] },
  { href: '/dashboard/rooms', icon: DoorOpen, label: 'Phòng', roles: ['owner'] },
  { href: '/dashboard/bookings', icon: ClipboardList, label: 'Lượt gửi', roles: ['owner', 'staff'] },
  { href: '/dashboard/diary', icon: BookOpen, label: 'Nhật ký', roles: ['owner', 'staff'] },
  { href: '/dashboard/staff', icon: Users, label: 'Nhân viên', roles: ['owner'] },
  { href: '/dashboard/qr-print', icon: QrCode, label: 'In QR', roles: ['owner'] },
  { href: '/dashboard/services', icon: Sparkles, label: 'Dịch vụ & Giá', roles: ['owner'] },
  { href: '/dashboard/feedback', icon: MessageSquare, label: 'Góp ý', roles: ['owner', 'staff'] },
  { href: '/dashboard/pricing', icon: Crown, label: 'Nâng cấp', roles: ['owner'] },
  { href: '/dashboard/guide', icon: FileText, label: 'Hướng dẫn', roles: ['owner', 'staff'] },
  { href: '/dashboard/settings', icon: Settings, label: 'Cài đặt', roles: ['owner'] },
];

const mobileTabItems: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Tổng quan', roles: ['owner', 'staff'] },
  { href: '/dashboard/bookings', icon: ClipboardList, label: 'Lượt gửi', roles: ['owner', 'staff'] },
  { href: '/dashboard/scan', icon: ScanLine, label: 'Quét QR', roles: ['owner', 'staff'] },
  { href: '/dashboard/diary', icon: BookOpen, label: 'Nhật ký', roles: ['owner', 'staff'] },
  { href: '/dashboard/rooms', icon: DoorOpen, label: 'Phòng', roles: ['owner'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, hotel, subscription, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [expiryInfo, setExpiryInfo] = useState<{ daysLeft: number; isExpired: boolean; message: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userRole = user?.role || 'staff';
  const filteredNav = navItems.filter(item => item.roles.includes(userRole));
  const filteredMobileTabs = mobileTabItems.filter(item => item.roles.includes(userRole)).slice(0, 5);

  useEffect(() => {
    if (!subscription) { setExpiryInfo(null); return; }

    if (subscription.plan === 'trial' && subscription.trial_ends_at) {
      const daysLeft = Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      const isExpired = daysLeft === 0;
      setExpiryInfo({
        daysLeft,
        isExpired,
        message: isExpired
          ? 'Hết thời gian dùng thử! Nâng cấp để tiếp tục.'
          : `Còn ${daysLeft} ngày dùng thử.`,
      });
    } else if (subscription.plan !== 'free' && subscription.expires_at) {
      const daysLeft = Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      const isExpired = daysLeft === 0;
      if (isExpired) {
        setExpiryInfo({ daysLeft: 0, isExpired: true, message: 'Gói dịch vụ đã hết hạn! Gia hạn để tiếp tục.' });
      } else if (daysLeft <= 7) {
        setExpiryInfo({ daysLeft, isExpired: false, message: `Gói dịch vụ còn ${daysLeft} ngày.` });
      } else {
        setExpiryInfo(null);
      }
    } else {
      setExpiryInfo(null);
    }
  }, [subscription]);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-teal-400">Loading...</div></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* Desktop Sidebar — hidden on mobile */}
      <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col fixed top-0 left-0 bottom-0 z-30">
        <div className="p-5 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.png" alt="PetLog" width={120} height={40} className="h-8 w-auto" />
          </Link>
          {hotel && <p className="text-xs text-slate-500 mt-1 truncate">{hotel.name}</p>}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${pathname === item.href ? 'bg-teal-500/20 text-teal-300' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-sm">
              {user.full_name?.[0] || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <a href="/PetLog - Huong Dan Su Dung.html" target="_blank"
            className="w-full py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-teal-400 transition-colors flex items-center justify-center gap-2">
            <FileText size={14} />
            Hướng dẫn sử dụng
          </a>
          <button onClick={() => { logout(); router.push('/'); }}
            className="w-full py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors flex items-center justify-center gap-2">
            <LogOut size={14} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Mobile Header — FIXED */}
      <header className="md:hidden fixed top-0 left-0 right-0 w-full flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 z-40">
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <Image src="/logo.png" alt="PetLog" width={100} height={32} className="h-7 w-auto" />
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          {hotel && <span className="text-xs text-slate-500 truncate max-w-[100px]">{hotel.name}</span>}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 shrink-0">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile slide-down menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-30 bg-black/60" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-slate-900 border-b border-slate-800 p-4 space-y-1 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {filteredNav.map((item) => (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${pathname === item.href ? 'bg-teal-500/20 text-teal-300' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            ))}
            <div className="border-t border-slate-800 pt-3 mt-3">
              <div className="flex items-center gap-3 px-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-sm">
                  {user.full_name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.full_name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <button onClick={() => { logout(); router.push('/'); }}
                className="w-full py-2.5 rounded-lg text-sm text-red-400 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                <LogOut size={14} />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content — padding-top for fixed header on mobile, padding-bottom for bottom tab */}
      <main className="w-full md:w-[calc(100%-16rem)] md:ml-64 pt-16 md:pt-8 pb-20 md:pb-8 px-4 md:px-8 overflow-x-hidden box-border">
        {expiryInfo && userRole === 'owner' && (
          <div className={`mb-4 md:mb-6 p-3 md:p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
            expiryInfo.isExpired ? 'bg-red-500/20 border border-red-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'
          }`}>
            <p className={`text-sm ${expiryInfo.isExpired ? 'text-red-300' : 'text-yellow-300'}`}>
              {expiryInfo.message}
            </p>
            <Link href="/dashboard/pricing" className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors shrink-0">
              {expiryInfo.isExpired ? 'Nâng cấp ngay' : 'Xem gói'}
            </Link>
          </div>
        )}
        {children}
      </main>

      {/* Mobile Bottom Tab Bar — FIXED, full width, no overflow */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-slate-900 border-t border-slate-800 z-40 safe-bottom">
        <div className="flex items-center justify-around py-2 px-2 max-w-full">
          {filteredMobileTabs.map((item) => {
            const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center gap-0.5 py-1 px-1 flex-1 max-w-[72px] transition-colors ${
                  isActive ? 'text-teal-400' : 'text-slate-500'
                }`}>
                <item.icon size={20} />
                <span className="text-[10px] leading-tight truncate w-full text-center">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Zalo support floating button — FIXED */}
      <a
        href="https://zalo.me/0383644795"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 group"
        title="Chat Zalo hỗ trợ"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-30" />
          <div className="relative w-11 h-11 md:w-14 md:h-14 bg-blue-500 hover:bg-blue-400 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 transition-transform hover:scale-110">
            <svg width="22" height="22" viewBox="0 0 48 48" fill="white">
              <path d="M24 4C12.95 4 4 12.95 4 24c0 6.35 2.95 12.01 7.56 15.68l-1.86 5.58c-.28.85.57 1.63 1.39 1.27l6.4-2.82C19.9 44.56 21.9 45 24 45c11.05 0 20-8.95 20-20S35.05 4 24 4z"/>
              <text x="12" y="32" fontSize="20" fontWeight="bold" fill="#0068FF">Z</text>
            </svg>
          </div>
        </div>
      </a>
    </div>
  );
}
