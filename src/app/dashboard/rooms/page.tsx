'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, X, Copy, Check, Share2, Trash2, Plus, BookOpen, Tag, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { copyToClipboard } from '@/lib/clipboard';
import { api } from '@/lib/api';
import { Room } from '@/types';

interface RoomType {
  id: number; name: string; daily_rate: number; color: string; icon: string; is_active: boolean;
  price_tiers?: { label: string; price: number }[] | null;
}

const formatVND = (n: number) => n ? new Intl.NumberFormat('vi-VN').format(n) + 'đ' : '';

export default function RoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newTypeId, setNewTypeId] = useState<number | ''>('');
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<number | 'all'>('all');

  // QR popup for free rooms
  const [qrRoom, setQrRoom] = useState<Room | null>(null);
  const [copied, setCopied] = useState(false);

  // Edit room type popup
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editTypeId, setEditTypeId] = useState<string>('');

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

  const loadRooms = useCallback(() => {
    api.getRooms().then(setRooms).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    Promise.all([api.getRooms(), api.getRoomTypes()])
      .then(([r, rt]) => { setRooms(r); setRoomTypes(rt.filter((t: RoomType) => t.is_active)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addRoom = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await api.createRoom(newName.trim());
      // If room type selected, update it after creation
      if (newTypeId) {
        const rooms = await api.getRooms();
        const newest = rooms.find((r: Room) => r.room_name === newName.trim());
        if (newest) await api.updateRoom(newest.id, { room_type_id: Number(newTypeId) });
      }
      setNewName('');
      setNewTypeId('');
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

  const assignRoomType = async () => {
    if (!editingRoom) return;
    try {
      await api.updateRoom(editingRoom.id, { room_type_id: editTypeId ? Number(editTypeId) : null } as Record<string, unknown>);
      setEditingRoom(null);
      setEditTypeId('');
      loadRooms();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi');
    }
  };

  const filteredRooms = filter === 'all' ? rooms : rooms.filter(r => r.room_type_id === filter);

  if (loading) return <div className="animate-pulse text-teal-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Quản lý phòng</h1>
        <span className="text-sm text-slate-400">{rooms.length} phòng</span>
      </div>

      {/* Filter by room type */}
      {roomTypes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'all' ? 'bg-teal-600/20 text-teal-300 border border-teal-500/30' : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/40'
            }`}>
            Tất cả ({rooms.length})
          </button>
          {roomTypes.map(rt => {
            const count = rooms.filter(r => r.room_type_id === rt.id).length;
            return (
              <button key={rt.id} onClick={() => setFilter(rt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  filter === rt.id ? 'text-white border shadow-sm' : 'text-slate-400 border border-slate-700/50 hover:bg-slate-700/40'
                }`}
                style={filter === rt.id ? { backgroundColor: rt.color + '25', borderColor: rt.color + '50', color: rt.color } : {}}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: rt.color }} />
                {rt.icon} {rt.name} ({count})
              </button>
            );
          })}
          {rooms.filter(r => !r.room_type_id).length > 0 && (
            <button onClick={() => setFilter(0 as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-slate-400 border border-slate-700/50 hover:bg-slate-700/40`}>
              Chưa gán ({rooms.filter(r => !r.room_type_id).length})
            </button>
          )}
        </div>
      )}

      {/* Add room */}
      <div className="flex gap-2 md:gap-3 mb-4 md:mb-6">
        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Tên phòng mới..."
          className="flex-1 px-3 md:px-4 py-2.5 md:py-3 rounded-lg bg-slate-800 border border-slate-600 focus:border-teal-500 focus:outline-none text-sm md:text-base"
          onKeyDown={(e) => e.key === 'Enter' && addRoom()} />
        {roomTypes.length > 0 && (
          <select value={newTypeId} onChange={(e) => setNewTypeId(e.target.value ? Number(e.target.value) : '')}
            className="px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-600 focus:border-teal-500 focus:outline-none text-sm text-slate-300 min-w-[100px]">
            <option value="">Loại phòng</option>
            {roomTypes.map(rt => (
              <option key={rt.id} value={rt.id}>{rt.icon} {rt.name}</option>
            ))}
          </select>
        )}
        <button onClick={addRoom} disabled={adding}
          className="px-4 md:px-6 py-2.5 md:py-3 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 font-medium transition-colors text-sm md:text-base flex items-center gap-1 shrink-0">
          <Plus size={16} /> <span className="hidden sm:inline">Thêm phòng</span><span className="sm:hidden">Thêm</span>
        </button>
      </div>

      {/* Warning for unassigned rooms */}
      {roomTypes.length > 0 && rooms.filter(r => !r.room_type_id).length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-300">
              {rooms.filter(r => !r.room_type_id).length} phòng chưa được gán loại phòng
            </p>
            <p className="text-[11px] text-amber-400/60 mt-0.5">
              Bấm vào nút <span className="font-semibold">&ldquo;Gán loại&rdquo;</span> trên mỗi phòng để gán loại phòng và giá tương ứng
            </p>
          </div>
        </div>
      )}

      {/* Room list */}
      <div className="space-y-2 md:space-y-3">
        {filteredRooms.map((room) => (
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
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm md:text-base">{room.room_name}</p>
                  {/* Room type tag */}
                  {room.roomType ? (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: room.roomType.color + '20', color: room.roomType.color, border: `1px solid ${room.roomType.color}40` }}>
                      {room.roomType.icon} {room.roomType.name}
                    </span>
                  ) : roomTypes.length > 0 ? (
                    <button onClick={(e) => { e.stopPropagation(); setEditingRoom(room); setEditTypeId(''); }}
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25 transition-colors font-medium animate-pulse"
                      title="Gán loại phòng">
                      <AlertTriangle size={10} /> Gán loại
                    </button>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-500">
                  <span className="font-mono">{room.qr_token}</span>
                  {room.roomType && <span>· {formatVND(room.roomType.daily_rate)}/ngày</span>}
                </div>
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
              {/* Change type button — shows for all free rooms */}
              {room.status === 'free' && (
                <button onClick={(e) => { e.stopPropagation(); setEditingRoom(room); setEditTypeId(room.room_type_id ? String(room.room_type_id) : ''); }}
                  className={`p-1.5 rounded-lg transition-colors ${room.roomType ? 'text-slate-400 hover:bg-slate-700/50' : 'text-amber-400 hover:bg-amber-500/20'}`}
                  title={room.roomType ? 'Đổi loại phòng' : 'Gán loại phòng'}>
                  <Tag size={13} />
                </button>
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
            {qrRoom.roomType && (
              <div className="text-center mb-3">
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium"
                  style={{ backgroundColor: qrRoom.roomType.color + '20', color: qrRoom.roomType.color }}>
                  {qrRoom.roomType.icon} {qrRoom.roomType.name} — {formatVND(qrRoom.roomType.daily_rate)}/ngày
                </span>
              </div>
            )}
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

      {/* Edit room type popup */}
      {editingRoom && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 px-0 md:px-4" onClick={() => setEditingRoom(null)}>
          <div className="bg-slate-800 rounded-t-2xl md:rounded-2xl border border-slate-700 p-5 md:p-6 w-full md:max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4 md:hidden" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base flex items-center gap-2"><Tag size={16} className="text-teal-400" /> Gán loại phòng — {editingRoom.room_name}</h3>
              <button onClick={() => setEditingRoom(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <select value={editTypeId} onChange={(e) => setEditTypeId(e.target.value)}
              className="w-full px-3 py-3 rounded-xl bg-slate-900/60 border border-slate-700 focus:border-teal-500 focus:outline-none text-sm mb-4">
              <option value="">-- Không gán loại phòng --</option>
              {roomTypes.map(rt => {
                const priceLabel = rt.price_tiers && rt.price_tiers.length > 0
                  ? rt.price_tiers.map(t => `${t.label} ${formatVND(t.price)}`).join(', ')
                  : formatVND(rt.daily_rate) + '/ngày';
                return (
                  <option key={rt.id} value={String(rt.id)}>{rt.icon} {rt.name} — {priceLabel}</option>
                );
              })}
            </select>
            <button onClick={assignRoomType}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-sm font-medium transition-colors">
              Lưu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
