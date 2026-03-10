'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DoorOpen, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function RoomSetupPage() {
  const [value, setValue] = useState('3');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { subscription } = useAuth();
  const needsPlan = subscription ? ['none', 'free', 'trial'].includes(subscription.plan) : false;
  const maxRooms = subscription?.max_rooms || 0;

  const parsedCount = parseInt(value) || 0;
  const isValid = parsedCount >= 1 && parsedCount <= 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setValue(raw);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (needsPlan) {
      setError('Vui lòng chọn gói trước khi tạo phòng.');
      return;
    }
    if (!isValid) {
      setError('Số phòng phải từ 1 đến 100');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.createRoomsBulk(parsedCount);
      router.push('/dashboard/qr-print');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md text-center">
        <DoorOpen size={48} className="text-teal-400" />
        <h1 className="text-2xl font-bold mt-4 mb-2">Thiết lập phòng</h1>
        <p className="text-slate-400 mb-8">Bạn có bao nhiêu phòng? Hệ thống sẽ sinh QR cho mỗi phòng.</p>

        {needsPlan && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400 shrink-0" />
              <p className="text-sm text-amber-300">Bạn cần chọn gói trước khi tạo phòng</p>
            </div>
            <Link href="/dashboard/pricing" className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors">
              Chọn gói ngay
            </Link>
          </div>
        )}

        {error && <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Số phòng</label>
            <input
              type="text"
              inputMode="numeric"
              value={value}
              onChange={handleChange}
              placeholder="Nhập số phòng"
              disabled={needsPlan}
              className={`w-full px-4 py-4 rounded-xl bg-slate-800 border focus:outline-none text-center text-3xl font-bold transition-colors disabled:opacity-50 ${
                value && !isValid ? 'border-red-500 focus:border-red-500' : 'border-slate-600 focus:border-teal-500'
              }`}
            />
            <p className={`text-xs mt-2 ${value && !isValid ? 'text-red-400' : 'text-slate-500'}`}>
              {needsPlan ? 'Chọn gói để bắt đầu tạo phòng' : value && !isValid ? 'Nhập số từ 1 đến 100' : `Gói hiện tại: tối đa ${maxRooms} phòng`}
            </p>
          </div>

          <button type="submit" disabled={loading || !isValid || !value || needsPlan}
            className="w-full py-4 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 font-semibold text-lg transition-colors">
            {loading ? 'Đang tạo...' : `Tạo ${parsedCount || '?'} phòng & sinh QR`}
          </button>
        </form>
      </div>
    </div>
  );
}
