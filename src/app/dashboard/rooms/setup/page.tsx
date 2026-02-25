'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DoorOpen } from 'lucide-react';
import { api } from '@/lib/api';

export default function RoomSetupPage() {
  const [value, setValue] = useState('3');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const parsedCount = parseInt(value) || 0;
  const isValid = parsedCount >= 1 && parsedCount <= 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits, let user delete freely
    const raw = e.target.value.replace(/\D/g, '');
    setValue(raw);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
              className={`w-full px-4 py-4 rounded-xl bg-slate-800 border focus:outline-none text-center text-3xl font-bold transition-colors ${
                value && !isValid ? 'border-red-500 focus:border-red-500' : 'border-slate-600 focus:border-teal-500'
              }`}
            />
            <p className={`text-xs mt-2 ${value && !isValid ? 'text-red-400' : 'text-slate-500'}`}>
              {value && !isValid ? 'Nhập số từ 1 đến 100' : 'Gói Free: tối đa 3 phòng'}
            </p>
          </div>

          <button type="submit" disabled={loading || !isValid || !value}
            className="w-full py-4 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 font-semibold text-lg transition-colors">
            {loading ? 'Đang tạo...' : `Tạo ${parsedCount || '?'} phòng & sinh QR`}
          </button>
        </form>
      </div>
    </div>
  );
}
