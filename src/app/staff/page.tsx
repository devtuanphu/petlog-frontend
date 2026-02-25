'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PawPrint, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

export default function StaffHomePage() {
  const [qrInput, setQrInput] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => { api.getBookings('active').then(setBookings).finally(() => setLoading(false)); }, []);

  const scanQr = () => {
    if (qrInput.trim()) router.push(`/staff/room/${qrInput.trim()}`);
  };

  return (
    <div className="px-4 pt-6">
      {/* QR Input */}
      <div className="mb-8">
        <h1 className="text-xl font-bold mb-4">Quét QR phòng</h1>
        <div className="flex gap-3">
          <input type="text" value={qrInput} onChange={(e) => setQrInput(e.target.value)} placeholder="Nhập mã QR phòng..."
            className="flex-1 px-4 py-4 rounded-xl bg-slate-800 border border-slate-600 focus:border-teal-500 focus:outline-none text-lg"
            onKeyDown={(e) => e.key === 'Enter' && scanQr()} />
          <button onClick={scanQr} className="px-6 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 font-medium text-lg transition-colors">
            →
          </button>
        </div>
      </div>

      {/* Active bookings */}
      <h2 className="font-semibold text-lg mb-4">Pet đang gửi</h2>
      {loading ? <div className="animate-pulse text-teal-400">Loading...</div> : (
        <div className="space-y-3">
          {bookings.length === 0 && <p className="text-slate-500 text-center py-8">Không có pet nào đang gửi</p>}
          {bookings.map((b) => (
            <button key={b.id} onClick={() => {
              const room = b.room;
              if (room?.qr_token) router.push(`/staff/room/${room.qr_token}`);
            }}
              className="w-full text-left p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-teal-500/30 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{b.room?.room_name}</p>
                  <p className="text-sm text-slate-300 flex items-center gap-1"><PawPrint size={14} /> {b.pets?.map((p: any) => p.name).join(', ')}</p>
                  <p className="text-xs text-slate-500">{b.owner_name}</p>
                </div>
                <ArrowRight size={20} className="text-slate-400" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
