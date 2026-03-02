'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PawPrint, Phone, Banknote, CheckCircle2,
  ChevronRight, Search,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Booking } from '@/types';

function formatVND(n: number) {
  return n.toLocaleString('vi-VN') + 'đ';
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function daysBetween(a: string, b?: string) {
  const end = b ? new Date(b) : new Date();
  return Math.max(1, Math.ceil((end.getTime() - new Date(a).getTime()) / 86400000));
}

const FILTERS = [
  { key: '', label: 'Tất cả' },
  { key: 'active', label: 'Đang gửi' },
  { key: 'completed', label: 'Hoàn thành' },
];

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => api.getBookings(filter || undefined).then(setBookings).finally(() => setLoading(false));
  useEffect(() => { setLoading(true); load(); }, [filter]);

  const filtered = bookings.filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.owner_name?.toLowerCase().includes(q) ||
      b.owner_phone?.includes(q) ||
      b.room?.room_name?.toLowerCase().includes(q) ||
      b.pets?.some((p: any) => p.name?.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Lượt gửi</h1>
          <p className="text-xs text-slate-500">{bookings.length} lượt gửi</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.key ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20' : 'bg-slate-800/60 text-slate-400 border border-slate-700 hover:bg-slate-700/50'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text" placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-sm focus:outline-none focus:border-teal-500/50 placeholder:text-slate-600"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center text-slate-500 py-12 text-sm animate-pulse">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-slate-500 py-12 text-sm">Không có lượt gửi nào</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(b => {
            const isActive = b.status === 'active';
            const isPaid = b.payment_status === 'paid';
            const isOverdue = isActive && b.expected_checkout && new Date(b.expected_checkout) < new Date();
            const days = daysBetween(b.check_in_at, b.check_out_at || undefined);

            return (
              <div key={b.id}
                onClick={() => router.push(`/dashboard/bookings/${b.id}`)}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/70 transition-colors cursor-pointer active:scale-[0.99]"
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-green-500/10' : isPaid ? 'bg-teal-500/10' : 'bg-slate-700/50'
                }`}>
                  <PawPrint size={18} className={isActive ? 'text-green-400' : isPaid ? 'text-teal-400' : 'text-slate-500'} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium truncate">{b.pets?.map((p: any) => p.name).join(', ') || 'N/A'}</span>
                    {isOverdue && <span className="text-[10px] text-red-400">⚠</span>}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                    <span>{b.room?.room_name}</span>
                    <span>·</span>
                    <span>{days} ngày</span>
                    <span>·</span>
                    <span>{fmtDate(b.check_in_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                    <Phone size={10} />
                    <span>{b.owner_name}</span>
                    <span>·</span>
                    <span>{b.owner_phone}</span>
                  </div>
                </div>

                {/* Right side */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    isActive ? 'bg-green-500/10 text-green-400' : 'bg-slate-700/50 text-slate-400'
                  }`}>
                    {isActive ? 'Đang gửi' : 'Xong'}
                  </span>
                  {b.status === 'completed' && (
                    isPaid ? (
                      <span className="flex items-center gap-0.5 text-[10px] text-green-400">
                        <CheckCircle2 size={10} /> {b.payment_method === 'bank' ? 'CK' : 'TM'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-[10px] text-red-400">
                        <Banknote size={10} /> Chưa TT
                      </span>
                    )
                  )}
                  {b.grand_total ? (
                    <span className="text-[10px] text-teal-400 font-medium">{formatVND(b.grand_total)}</span>
                  ) : null}
                </div>

                <ChevronRight size={16} className="text-slate-600 shrink-0" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
