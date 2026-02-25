'use client';

import { useEffect, useState } from 'react';
import { PawPrint, User, Phone, BookOpen, Circle, CheckCircle2, List, LogIn, CalendarClock, LogOut, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { Booking } from '@/types';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<string>('active');
  const [loading, setLoading] = useState(true);

  const load = () => api.getBookings(filter || undefined).then(setBookings).finally(() => setLoading(false));
  useEffect(() => { setLoading(true); load(); }, [filter]);

  const checkout = async (id: number) => {
    if (!confirm('Checkout pet khỏi phòng?')) return;
    await api.checkoutBooking(id);
    load();
  };

  return (
    <div className="max-w-full overflow-hidden">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Lượt gửi</h1>

      {/* Filter tabs — scrollable on mobile */}
      <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto no-scrollbar">
        {['active', 'completed', ''].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 md:px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap shrink-0 ${filter === s ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            {s === 'active' ? <span className="flex items-center gap-1"><Circle size={10} className="fill-green-400 text-green-400" /> Đang gửi</span> : s === 'completed' ? <span className="flex items-center gap-1"><CheckCircle2 size={14} /> Đã trả</span> : <span className="flex items-center gap-1"><List size={14} /> Tất cả</span>}
          </button>
        ))}
      </div>

      {loading ? <div className="animate-pulse text-teal-400 text-center py-8">Loading...</div> : (
        <div className="space-y-3 md:space-y-4">
          {bookings.length === 0 && <p className="text-slate-500 text-center py-12">Chưa có lượt gửi nào</p>}

          {bookings.map((b) => (
            <div key={b.id} className="rounded-xl bg-slate-800/50 border border-slate-700 p-3 md:p-5">
              {/* Header: room name + status */}
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm md:text-base">{b.room?.room_name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs ${b.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/50 text-slate-400'}`}>
                  {b.status === 'active' ? 'Đang gửi' : 'Đã trả'}
                </span>
              </div>

              {/* Pet & owner info */}
              <p className="text-sm text-slate-300 flex items-center gap-1 truncate"><PawPrint size={14} className="shrink-0" /> {b.pets?.map(p => `${p.name} (${p.type})`).join(', ')}</p>
              <p className="text-xs md:text-sm text-slate-400 mt-1 flex items-center gap-1 truncate"><User size={12} className="shrink-0" /> {b.owner_name} <span className="text-slate-600 mx-0.5">·</span> <Phone size={10} className="shrink-0" /> {b.owner_phone}</p>

              {/* Dates */}
              <div className="mt-2 space-y-0.5 text-[11px] md:text-xs">
                <p className="text-slate-500 flex items-center gap-1"><LogIn size={10} className="shrink-0" /> Check-in: {new Date(b.check_in_at).toLocaleString('vi-VN')}</p>
                {b.expected_checkout && (
                  <p className={`flex items-center gap-1 flex-wrap ${b.status === 'active' && new Date(b.expected_checkout) < new Date() ? 'text-red-400 font-semibold' : 'text-slate-500'}`}>
                    <CalendarClock size={10} className="shrink-0" /> Dự kiến đón: {new Date(b.expected_checkout).toLocaleString('vi-VN')}
                    {b.status === 'active' && new Date(b.expected_checkout) < new Date() && <span className="flex items-center gap-0.5"><AlertTriangle size={10} /> QUÁ HẠN</span>}
                  </p>
                )}
                {b.check_out_at && (
                  <p className="text-green-400 flex items-center gap-1"><LogOut size={10} className="shrink-0" /> Đã trả: {new Date(b.check_out_at).toLocaleString('vi-VN')}</p>
                )}
              </div>

              {/* Action buttons — full width on mobile */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700/50">
                <a href={`/diary/${b.diary_token}`} target="_blank"
                  className="flex-1 py-2 rounded-lg text-xs md:text-sm bg-slate-700 hover:bg-slate-600 transition-colors text-center flex items-center justify-center gap-1">
                  <BookOpen size={14} /> Diary
                </a>
                {b.status === 'active' && (
                  <button onClick={() => checkout(b.id)}
                    className="flex-1 py-2 rounded-lg text-xs md:text-sm bg-amber-600 hover:bg-amber-500 transition-colors text-center active:scale-[0.98]">
                    Checkout
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
