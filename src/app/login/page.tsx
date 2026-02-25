'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center mb-8">
          <Image src="/logo.png" alt="PetLog" width={160} height={56} className="h-12 w-auto" />
        </Link>

        <div className="rounded-2xl bg-slate-800/50 border border-slate-700 p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">Đăng nhập</h1>

          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-teal-500 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Mật khẩu</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-teal-500 focus:outline-none transition-colors" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 font-medium transition-colors">
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="text-teal-400 hover:text-teal-300">Đăng ký miễn phí</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
