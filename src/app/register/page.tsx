'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { Shield, Zap, BookOpen, BarChart3 } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    hotel_name: '',
    hotel_address: '',
    hotel_phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Always register with free plan — user will choose plan in dashboard
      await register({ ...form });
      // Clear dismissed flag so popup shows in dashboard
      sessionStorage.removeItem('petlog_plan_modal_dismissed');
      router.push('/dashboard');
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  const features = [
    { icon: Shield, text: 'Quản lý phòng & loại phòng' },
    { icon: Zap, text: 'QR check-in + hoá đơn tự động' },
    { icon: BookOpen, text: 'Nhật ký chăm sóc real-time' },
    { icon: BarChart3, text: 'Thống kê doanh thu & biểu đồ' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <Link href="/" className="flex items-center justify-center mb-8">
          <Image src="/logo.png" alt="PetLog" width={160} height={56} className="h-12 w-auto" />
        </Link>

        <div className="rounded-2xl bg-slate-800/50 border border-slate-700 p-6 sm:p-8">
          <h1 className="text-2xl font-bold mb-2 text-center">Đăng ký tài khoản</h1>
          <p className="text-slate-400 text-sm text-center mb-6">Tạo tài khoản miễn phí và bắt đầu ngay</p>

          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">{error}</div>}

          {/* Feature highlights */}
          <div className="mb-6 grid grid-cols-2 gap-2">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                <f.icon size={14} className="text-teal-400 shrink-0" />
                <span className="text-xs text-slate-300">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Họ tên</label>
                <input type="text" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} required
                  placeholder="Nguyễn Văn A"
                  className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-teal-500 focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-teal-500 focus:outline-none transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Mật khẩu</label>
              <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required minLength={6}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-teal-500 focus:outline-none transition-colors" />
            </div>

            <hr className="border-slate-700 my-2" />

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Tên cửa hàng / Pet Hotel</label>
              <input type="text" value={form.hotel_name} onChange={(e) => update('hotel_name', e.target.value)} required
                placeholder="PetLog Hotel"
                className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-teal-500 focus:outline-none transition-colors" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Địa chỉ <span className="text-slate-500">(tuỳ chọn)</span></label>
                <input type="text" value={form.hotel_address} onChange={(e) => update('hotel_address', e.target.value)}
                  placeholder="123 Nguyễn Huệ, Q1, HCM"
                  className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-teal-500 focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Số điện thoại <span className="text-slate-500">(tuỳ chọn)</span></label>
                <input type="tel" value={form.hotel_phone} onChange={(e) => update('hotel_phone', e.target.value)}
                  placeholder="0901 234 567"
                  className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-teal-500 focus:outline-none transition-colors" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 font-medium transition-colors">
              {loading ? 'Đang tạo tài khoản...' : 'Đăng ký miễn phí'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            Bạn sẽ được chọn gói phù hợp ngay sau khi đăng ký
          </p>

          <p className="mt-4 text-center text-sm text-slate-400">
            Đã có tài khoản?{' '}
            <Link href="/login" className="text-teal-400 hover:text-teal-300">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
