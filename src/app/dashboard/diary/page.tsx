'use client';

import { useEffect, useState, useCallback } from 'react';
import { PawPrint, Send, Clock, Paperclip, X, History, PlusCircle } from 'lucide-react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Booking, LogEntry } from '@/types';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/api$/, '');

type MediaItem = { url: string; type: 'image' | 'video' };

const actionTypes = [
  { value: 'feed', label: '🍖 Cho ăn' },
  { value: 'walk', label: '🚶 Dắt đi dạo' },
  { value: 'bath', label: '🛁 Tắm rửa' },
  { value: 'play', label: '🎾 Chơi đùa' },
  { value: 'health', label: '💊 Sức khoẻ' },
  { value: 'sleep', label: '😴 Nghỉ ngơi' },
  { value: 'note', label: '📝 Ghi chú khác' },
];

const actionLabels: Record<string, string> = {
  feed: '🍖 Cho ăn', walk: '🚶 Đi dạo', bath: '🛁 Tắm rửa',
  play: '🎾 Chơi đùa', health: '💊 Sức khoẻ', sleep: '😴 Nghỉ ngơi', note: '📝 Ghi chú',
};

function fullUrl(path: string) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
}

function isMediaUrl(str: string) {
  return /\.(jpg|jpeg|png|gif|webp|mp4|mov|webm|avi|mkv)$/i.test(str.trim());
}

function isVideoUrl(str: string) {
  return /\.(mp4|mov|webm|avi|mkv)$/i.test(str.trim());
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins}p trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h trước`;
  return `${Math.floor(hours / 24)}d trước`;
}

function parseLogMedia(log: LogEntry): { text: string; mediaUrls: string[] } {
  const mediaUrls: string[] = [];
  // image_url can contain multiple URLs separated by newlines
  if (log.image_url) {
    for (const part of log.image_url.split('\n')) {
      const trimmed = part.trim();
      if (trimmed) mediaUrls.push(fullUrl(trimmed));
    }
  }
  // Also check description for legacy logs that had URLs mixed in
  const textLines: string[] = [];
  if (log.description) {
    for (const line of log.description.split('\n')) {
      if (isMediaUrl(line.trim())) mediaUrls.push(line.trim());
      else if (line.trim()) textLines.push(line);
    }
  }
  return { text: textLines.join('\n'), mediaUrls };
}

export default function DiaryPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<number | null>(null);
  const [tab, setTab] = useState<'history' | 'add'>('history');

  // Add form state
  const [actionType, setActionType] = useState('feed');
  const [description, setDescription] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [success, setSuccess] = useState(false);

  // Logs state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    api.getBookings('active').then(setBookings).finally(() => setLoading(false));
  }, []);

  const loadLogs = useCallback(async (bookingId: number) => {
    setLogsLoading(true);
    try {
      const data = await api.getLogs(bookingId);
      setLogs(data);
    } catch { setLogs([]); }
    setLogsLoading(false);
  }, []);

  const selectBooking = (id: number) => {
    setSelectedBooking(id);
    loadLogs(id);
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(prev => prev + files.length);
    for (const file of Array.from(files)) {
      if (file.size > 50 * 1024 * 1024) { alert(`${file.name} quá 50MB`); setUploading(p => p - 1); continue; }
      try {
        const res = await api.uploadFile(file);
        const type: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
        setMedia(prev => [...prev, { url: res.url, type }]);
      } catch { alert(`Upload ${file.name} thất bại`); }
      setUploading(p => p - 1);
    }
    e.target.value = '';
  };

  const removeMedia = (idx: number) => setMedia(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!selectedBooking) return;
    setSubmitting(true);
    try {
      const allMediaUrls = media.map(m => m.url).join('\n');
      await api.createLog({
        booking_id: selectedBooking,
        action_type: actionType,
        description: description || undefined,
        image_url: allMediaUrls || undefined,
      });
      setSuccess(true);
      setDescription('');
      setMedia([]);
      loadLogs(selectedBooking);
      setTab('history');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      alert((err as Error).message || 'Lỗi tạo nhật ký');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="animate-pulse text-teal-400">Loading...</div>;

  const selectedData = bookings.find(b => b.id === selectedBooking);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Nhật ký chăm sóc</h1>

      {bookings.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <PawPrint size={48} className="mx-auto mb-4 opacity-30" />
          <p>Chưa có thú cưng nào đang gửi</p>
        </div>
      ) : (
        <>
          {/* Pet selector - horizontal scroll */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {bookings.map(b => (
              <button key={b.id} onClick={() => selectBooking(b.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border whitespace-nowrap transition-all shrink-0 ${
                  selectedBooking === b.id ? 'bg-teal-500/10 border-teal-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                }`}>
                <PawPrint size={16} className="text-teal-400" />
                <div className="text-left">
                  <p className="font-medium text-sm">{b.pets?.[0]?.name || 'Thú cưng'}</p>
                  <p className="text-xs text-slate-500">Phòng {b.room?.room_name}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse ml-2" />
              </button>
            ))}
          </div>

          {!selectedBooking ? (
            <div className="text-center py-16 text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700 border-dashed">
              <PawPrint size={36} className="mx-auto mb-3 opacity-30" />
              <p>Chọn thú cưng ở trên để xem và ghi nhật ký</p>
            </div>
          ) : (
            <>
              {/* Info bar */}
              {selectedData && (
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="text-sm text-slate-400">
                    <span className="font-medium text-white">{selectedData.pets?.[0]?.name}</span>
                    {selectedData.pets?.[0]?.type && <span> ({selectedData.pets[0].type})</span>}
                    <span> • {selectedData.room?.room_name} • Chủ: {selectedData.owner_name}</span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={10} /> Từ {new Date(selectedData.check_in_at).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              )}

              {/* Tab buttons */}
              <div className="flex gap-1 mb-6 bg-slate-800/50 rounded-xl p-1">
                <button onClick={() => setTab('history')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    tab === 'history' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}>
                  <History size={16} /> Lịch sử ({logs.length})
                </button>
                <button onClick={() => setTab('add')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    tab === 'add' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}>
                  <PlusCircle size={16} /> Thêm nhật ký
                </button>
              </div>

              {success && (
                <div className="p-3 mb-4 rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 text-sm">
                  ✅ Đã ghi nhật ký thành công!
                </div>
              )}

              {/* ===== HISTORY TAB ===== */}
              {tab === 'history' && (
                logsLoading ? (
                  <div className="animate-pulse text-teal-400 text-center py-12">Đang tải...</div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700 border-dashed">
                    <p className="mb-2">Chưa có nhật ký nào</p>
                    <button onClick={() => setTab('add')} className="text-teal-400 hover:underline text-sm">+ Thêm nhật ký đầu tiên</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.map(log => {
                      const { text, mediaUrls } = parseLogMedia(log);
                      return (
                        <div key={log.id} className="rounded-xl bg-slate-800/50 border border-slate-700 overflow-hidden">
                          {/* Header */}
                          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{actionLabels[log.action_type] || log.action_type}</span>
                              {log.pet_name && <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full">{log.pet_name}</span>}
                            </div>
                            <span className="text-xs text-slate-500">{timeAgo(log.created_at)}</span>
                          </div>

                          {/* Text */}
                          {text && <p className="px-4 pb-2 text-sm text-slate-300 whitespace-pre-line">{text}</p>}

                          {/* Media thumbnails */}
                          {mediaUrls.length > 0 && (
                            <div className="px-4 pb-3">
                              <div className={`grid gap-2 ${mediaUrls.length === 1 ? 'grid-cols-1 max-w-[200px]' : mediaUrls.length === 2 ? 'grid-cols-2 max-w-[320px]' : 'grid-cols-3 max-w-[400px]'}`}>
                                {mediaUrls.map((url, idx) => (
                                  <div key={idx} className="rounded-lg overflow-hidden border border-slate-600 bg-black/20 aspect-square">
                                    {isVideoUrl(url) ? (
                                      <video src={url} controls playsInline className="w-full h-full object-cover" />
                                    ) : (
                                      <Image src={url} alt="" width={150} height={150}
                                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                        unoptimized
                                        onClick={() => window.open(url, '_blank')} />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Footer */}
                          <div className="px-4 py-2 flex items-center gap-3 text-xs text-slate-500 border-t border-slate-700/50">
                            {log.staff_name && <span>👤 {log.staff_name}</span>}
                            <span>{new Date(log.created_at).toLocaleString('vi-VN')}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {/* ===== ADD TAB ===== */}
              {tab === 'add' && (
                <div className="max-w-xl space-y-5">
                  {/* Action type */}
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Hoạt động</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {actionTypes.map(a => (
                        <button key={a.value} onClick={() => setActionType(a.value)}
                          className={`p-2.5 rounded-lg text-sm text-center transition-colors ${
                            actionType === a.value
                              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                              : 'bg-slate-800/50 text-slate-300 border border-slate-700 hover:bg-slate-700'
                          }`}>
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Mô tả</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)}
                      placeholder="Ví dụ: Bé ăn hết 1 bát cơm, uống nước đầy đủ..."
                      className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-sm resize-none focus:outline-none focus:border-teal-500"
                      rows={3} />
                  </div>

                  {/* Media */}
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">
                      Media {media.length > 0 && <span className="text-teal-400">({media.length} file)</span>}
                    </label>
                    {media.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        {media.map((m, i) => (
                          <div key={i} className="relative rounded-lg overflow-hidden bg-slate-900 aspect-square">
                            {m.type === 'video' ? (
                              <video src={fullUrl(m.url)} className="w-full h-full object-cover" muted />
                            ) : (
                              <Image src={fullUrl(m.url)} alt="" width={100} height={100} className="w-full h-full object-cover" unoptimized />
                            )}
                            {m.type === 'video' && (
                              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white">▶</div>
                            )}
                            <button onClick={() => removeMedia(i)}
                              className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 text-white"><X size={10} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="flex items-center gap-2 p-3 rounded-lg bg-slate-900 border border-slate-700 border-dashed cursor-pointer hover:border-slate-500">
                      <Paperclip size={14} className="text-slate-500" />
                      <span className="text-sm text-slate-500">{uploading > 0 ? `Đang tải ${uploading} file...` : 'Thêm ảnh / video'}</span>
                      <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFiles} disabled={uploading > 0} />
                    </label>
                  </div>

                  {/* Submit */}
                  <button onClick={handleSubmit} disabled={submitting || uploading > 0}
                    className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 font-semibold transition-colors flex items-center justify-center gap-2 text-base">
                    {submitting ? 'Đang gửi...' : <><Send size={18} /> Ghi nhật ký</>}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
