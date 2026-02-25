'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DoorOpen, AlertTriangle, Clock, CalendarPlus, X, Siren, QrCode, Share2, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { copyToClipboard } from '@/lib/clipboard';
import { api } from '@/lib/api';
import { Room } from '@/types';

function isOverdue(room: Room): boolean {
  if (!room.active_booking?.expected_checkout) return false;
  return new Date(room.active_booking.expected_checkout) < new Date();
}

function daysOverdue(date: string): number {
  return Math.ceil((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

export default function DashboardPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Extend modal state
  const [extendModal, setExtendModal] = useState<{ bookingId: number; roomName: string; current?: string } | null>(null);
  const [extendDate, setExtendDate] = useState('');
  const [extending, setExtending] = useState(false);

  // QR popup for free rooms
  const [qrRoom, setQrRoom] = useState<Room | null>(null);
  const [copied, setCopied] = useState(false);

  const getCheckinUrl = (qrToken: string) => {
    if (typeof window !== 'undefined') return `${window.location.origin}/room/${qrToken}`;
    return `/room/${qrToken}`;
  };

  const copyLink = (url: string) => {
    copyToClipboard(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    api.getRooms().then(setRooms).finally(() => setLoading(false));
  }, []);

  const freeRooms = rooms.filter((r) => r.status === 'free');
  const occupiedRooms = rooms.filter((r) => r.status === 'occupied');
  const overdueRooms = rooms.filter(isOverdue);

  const handleExtend = async () => {
    if (!extendModal || !extendDate) return;
    setExtending(true);
    try {
      await api.extendBooking(extendModal.bookingId, extendDate);
      const updated = await api.getRooms();
      setRooms(updated);
      setExtendModal(null);
      setExtendDate('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi gia hạn';
      alert(message);
    } finally {
      setExtending(false);
    }
  };

  if (loading) return <div className="animate-pulse text-teal-400 text-center py-12">Loading...</div>;

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <DoorOpen size={48} className="text-teal-400 mb-4" />
        <h1 className="text-xl md:text-2xl font-bold mb-2">Chào mừng đến PetLog!</h1>
        <p className="text-slate-400 mb-6 text-sm md:text-base">Bắt đầu bằng cách tạo phòng cho hotel của bạn</p>
        <Link href="/dashboard/rooms/setup" className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 font-medium transition-colors">
          Tạo phòng ngay →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-8">Tổng quan</h1>

      {/* Overdue alert banner */}
      {overdueRooms.length > 0 && (
        <div className="mb-4 md:mb-6 p-3 md:p-4 rounded-xl bg-red-500/15 border border-red-500/30 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-400 mt-0.5 shrink-0 animate-pulse" />
          <div className="min-w-0">
            <p className="font-semibold text-red-300 text-sm md:text-base">{overdueRooms.length} phòng quá hạn chưa đón!</p>
            <p className="text-xs md:text-sm text-red-300/70 mt-0.5 truncate">
              {overdueRooms.map(r => r.room_name).join(', ')} — đã quá ngày dự kiến đón về
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 mb-5 md:mb-8">
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-3 md:p-5">
          <p className="text-xs md:text-sm text-slate-400">Tổng phòng</p>
          <p className="text-2xl md:text-3xl font-bold mt-1">{rooms.length}</p>
        </div>
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 md:p-5">
          <p className="text-xs md:text-sm text-green-400">Phòng trống</p>
          <p className="text-2xl md:text-3xl font-bold text-green-400 mt-1">{freeRooms.length}</p>
        </div>
        <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 md:p-5">
          <p className="text-xs md:text-sm text-blue-400">Đang có pet</p>
          <p className="text-2xl md:text-3xl font-bold text-blue-400 mt-1">{occupiedRooms.length}</p>
        </div>
        <div className={`rounded-xl p-3 md:p-5 ${overdueRooms.length > 0 ? 'bg-red-500/15 border border-red-500/30 animate-pulse' : 'bg-slate-800/50 border border-slate-700'}`}>
          <p className={`text-xs md:text-sm flex items-center gap-1 ${overdueRooms.length > 0 ? 'text-red-400' : 'text-slate-400'}`}><Siren size={14} /> Quá hạn</p>
          <p className={`text-2xl md:text-3xl font-bold mt-1 ${overdueRooms.length > 0 ? 'text-red-400' : 'text-slate-400'}`}>{overdueRooms.length}</p>
        </div>
      </div>

      {/* Room grid */}
      <h2 className="font-semibold text-base md:text-lg mb-3 md:mb-4">Sơ đồ phòng</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {rooms.map((room) => {
          const overdue = isOverdue(room);
          return (
            <div key={room.id}
              onClick={() => {
                if (room.status === 'free') setQrRoom(room);
                else if (room.active_booking?.diary_token) router.push(`/dashboard/diary/${room.active_booking.diary_token}`);
              }}
              className={`rounded-xl border p-3 md:p-4 transition-all cursor-pointer active:scale-[0.98] ${
                overdue
                  ? 'bg-red-500/15 border-red-500/50 ring-2 ring-red-500/30 hover:ring-red-500/50'
                  : room.status === 'occupied'
                    ? 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/50'
                    : 'bg-green-500/10 border-green-500/30 hover:border-green-500/50'
              }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm md:text-base">{room.room_name}</span>
                {overdue ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white animate-pulse">QUÁ HẠN</span>
                ) : (
                  <span className={`w-3 h-3 rounded-full ${room.status === 'occupied' ? 'bg-blue-400' : 'bg-green-400'}`} />
                )}
              </div>
              {room.active_booking ? (
                <div>
                  <p className="text-sm text-slate-300 truncate">{room.active_booking.pets?.map(p => p.name).join(', ')}</p>
                  <p className="text-xs text-slate-500 truncate">{room.active_booking.owner_name}</p>

                  {/* Expected checkout date */}
                  {room.active_booking.expected_checkout && (
                    <div className={`flex items-center gap-1 mt-1.5 text-xs ${overdue ? 'text-red-400 font-semibold' : 'text-slate-500'}`}>
                      <Clock size={10} className="shrink-0" />
                      <span className="truncate">
                        Đón: {new Date(room.active_booking.expected_checkout).toLocaleString('vi-VN')}
                        {overdue && ` (trễ ${daysOverdue(room.active_booking.expected_checkout)} ngày)`}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-2">
                    <Link href={`/diary/${room.active_booking.diary_token}`} target="_blank"
                      className="text-xs text-teal-400 hover:text-teal-300">
                      Xem diary →
                    </Link>
                    {room.active_booking.expected_checkout && (
                      <button onClick={() => setExtendModal({
                        bookingId: room.active_booking!.id,
                        roomName: room.room_name,
                        current: room.active_booking!.expected_checkout,
                      })}
                        className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-0.5">
                        <CalendarPlus size={10} /> Gia hạn
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-green-400/70">Trống</p>
                  <QrCode size={14} className="text-green-400/50" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* QR Room popup */}
      {qrRoom && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4" onClick={() => { setQrRoom(null); setCopied(false); }}>
          <div className="bg-slate-800 rounded-t-2xl md:rounded-2xl border border-slate-700 p-5 md:p-6 w-full md:max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4 md:hidden" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2"><QrCode size={20} className="text-teal-400" /> {qrRoom.room_name}</h3>
              <button onClick={() => { setQrRoom(null); setCopied(false); }} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <p className="text-sm text-slate-400 mb-4 text-center">Cho khách quét mã QR bên dưới để check-in pet</p>
            <div className="flex justify-center mb-4 bg-white rounded-xl p-4">
              <QRCodeSVG value={getCheckinUrl(qrRoom.qr_token)} size={200} level="M" includeMargin />
            </div>
            <p className="text-center text-xs text-slate-500 font-mono mb-4">{qrRoom.qr_token}</p>
            <div className="flex gap-2">
              <button onClick={() => copyLink(getCheckinUrl(qrRoom.qr_token))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  copied ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}>
                {copied ? <><Check size={14} /> Đã copy!</> : <><Copy size={14} /> Copy link</>}
              </button>
              <button onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: `Check-in ${qrRoom.room_name}`, url: getCheckinUrl(qrRoom.qr_token) });
                } else {
                  copyLink(getCheckinUrl(qrRoom.qr_token));
                }
              }}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-sm font-medium transition-colors flex items-center justify-center gap-1.5">
                <Share2 size={14} /> Chia sẻ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extend modal */}
      {extendModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4" onClick={() => setExtendModal(null)}>
          <div className="bg-slate-800 rounded-t-2xl md:rounded-2xl border border-slate-700 p-5 md:p-6 w-full md:max-w-sm" onClick={(e) => e.stopPropagation()}>
            {/* Drag handle for mobile */}
            <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4 md:hidden" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base md:text-lg flex items-center gap-2"><CalendarPlus size={20} /> Gia hạn {extendModal.roomName}</h3>
              <button onClick={() => setExtendModal(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            {extendModal.current && (
              <p className="text-sm text-slate-400 mb-3">
                Ngày hiện tại: <span className="text-white">{new Date(extendModal.current).toLocaleString('vi-VN')}</span>
              </p>
            )}
            <label className="text-sm text-slate-300 block mb-2">Ngày đón mới</label>
            <input type="datetime-local" value={extendDate} onChange={(e) => setExtendDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-teal-500 focus:outline-none mb-4 text-base" />
            <button onClick={handleExtend} disabled={!extendDate || extending}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 font-semibold transition-colors active:scale-[0.98]">
              {extending ? 'Đang cập nhật...' : 'Xác nhận gia hạn'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
