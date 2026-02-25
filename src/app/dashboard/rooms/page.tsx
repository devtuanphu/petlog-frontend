'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, X, Copy, Check, Share2, Trash2, Plus, BookOpen } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { copyToClipboard } from '@/lib/clipboard';
import { api } from '@/lib/api';
import { Room } from '@/types';

export default function RoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

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

  const loadRooms = () => api.getRooms().then(setRooms).finally(() => setLoading(false));
  useEffect(() => { loadRooms(); }, []);

  const addRoom = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await api.createRoom(newName.trim());
      setNewName('');
      loadRooms();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi';
      alert(message);
    } finally {
      setAdding(false);
    }
  };

  const deleteRoom = async (id: number) => {
    if (!confirm('Xóa phòng này?')) return;
    try {
      await api.deleteRoom(id);
      loadRooms();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi';
      alert(message);
    }
  };

  if (loading) return <div className="animate-pulse text-teal-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Quản lý phòng</h1>
        <span className="text-sm text-slate-400">{rooms.length} phòng</span>
      </div>

      {/* Add room */}
      <div className="flex gap-2 md:gap-3 mb-4 md:mb-6">
        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Tên phòng mới..."
          className="flex-1 px-3 md:px-4 py-2.5 md:py-3 rounded-lg bg-slate-800 border border-slate-600 focus:border-teal-500 focus:outline-none text-sm md:text-base"
          onKeyDown={(e) => e.key === 'Enter' && addRoom()} />
        <button onClick={addRoom} disabled={adding}
          className="px-4 md:px-6 py-2.5 md:py-3 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 font-medium transition-colors text-sm md:text-base flex items-center gap-1 shrink-0">
          <Plus size={16} /> <span className="hidden sm:inline">Thêm phòng</span><span className="sm:hidden">Thêm</span>
        </button>
      </div>

      {/* Room list */}
      <div className="space-y-2 md:space-y-3">
        {rooms.map((room) => (
          <div key={room.id}
            onClick={() => {
              if (room.status === 'free') setQrRoom(room);
              else if (room.active_booking?.diary_token) router.push(`/dashboard/diary/${room.active_booking.diary_token}`);
            }}
            className={`flex items-center justify-between p-3 md:p-4 rounded-xl bg-slate-800/50 border border-slate-700 transition-all cursor-pointer active:scale-[0.99] ${
              room.status === 'free' ? 'hover:border-green-500/50' : 'hover:border-blue-500/50'
            }`}>
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
              <span className={`w-3 h-3 rounded-full shrink-0 ${room.status === 'occupied' ? 'bg-blue-400' : 'bg-green-400'}`} />
              <div className="min-w-0">
                <p className="font-medium text-sm md:text-base">{room.room_name}</p>
                <p className="text-[10px] md:text-xs text-slate-500 font-mono truncate">{room.qr_token}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              {room.status === 'occupied' && room.active_booking ? (
                <span className="text-xs md:text-sm text-blue-400 truncate max-w-[100px] flex items-center gap-1">
                  <BookOpen size={12} /> {room.active_booking.pets?.map(p => p.name).join(', ')}
                </span>
              ) : (
                <QrCode size={16} className="text-green-400/50" />
              )}
              <button onClick={(e) => { e.stopPropagation(); deleteRoom(room.id); }} disabled={room.status === 'occupied'}
                className="p-1.5 md:p-2 rounded-lg text-red-400 hover:bg-red-500/20 disabled:opacity-20 transition-colors"
                title="Xóa phòng">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
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
    </div>
  );
}
