'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, PawPrint, AlertTriangle, Send, Camera, X, CalendarClock, Share2, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { copyToClipboard } from '@/lib/clipboard';
import { DiaryData } from '@/types';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/api$/, '');

const actionLabels: Record<string, string> = {
  feed: '🍖 Cho ăn', walk: '🚶 Đi dạo', bath: '🛁 Tắm rửa',
  play: '🎾 Chơi đùa', health: '💊 Sức khoẻ', sleep: '😴 Nghỉ ngơi', note: '📝 Ghi chú',
  FEEDING: '🍖 Cho ăn', MEDICINE: '💊 Uống thuốc', WALKING: '🚶 Đi dạo',
  PHOTO: 'Chụp ảnh', NOTE: 'Ghi chú',
};

const quickActions = [
  { value: 'feed', label: '🍖 Cho ăn' },
  { value: 'bath', label: '🛁 Tắm rửa' },
  { value: 'walk', label: '🚶 Đi dạo' },
  { value: 'play', label: '🎾 Chơi đùa' },
  { value: 'health', label: '💊 Sức khoẻ' },
  { value: 'sleep', label: '😴 Nghỉ ngơi' },
  { value: 'note', label: '📝 Khác' },
];

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

function parseLogMedia(imageUrl?: string, desc?: string): { text: string; mediaUrls: string[] } {
  const mediaUrls: string[] = [];
  if (imageUrl) {
    for (const part of imageUrl.split('\n')) {
      const trimmed = part.trim();
      if (trimmed) mediaUrls.push(fullUrl(trimmed));
    }
  }
  const textLines: string[] = [];
  if (desc) {
    for (const line of desc.split('\n')) {
      if (isMediaUrl(line.trim())) mediaUrls.push(line.trim());
      else if (line.trim()) textLines.push(line);
    }
  }
  return { text: textLines.join('\n'), mediaUrls };
}

export default function StaffDiaryPage() {
  const router = useRouter();
  const { diaryToken } = useParams<{ diaryToken: string }>();
  const [diary, setDiary] = useState<DiaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add entry form
  const [actionType, setActionType] = useState('feed');
  const [description, setDescription] = useState('');
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDiary = useCallback(() => {
    api.getDiary(diaryToken).then(setDiary).catch(() => setError('Không tìm thấy')).finally(() => setLoading(false));
  }, [diaryToken]);

  useEffect(() => { loadDiary(); }, [loadDiary]);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(prev => prev + files.length);
    for (const file of Array.from(files)) {
      if (file.size > 50 * 1024 * 1024) { alert(`${file.name} quá 50MB`); setUploading(p => p - 1); continue; }
      try {
        const res = await api.uploadFile(file);
        setUploadedUrls(prev => [...prev, res.url]);
      } catch { alert(`Upload ${file.name} thất bại`); }
      setUploading(p => p - 1);
    }
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!diary) return;
    setSubmitting(true);
    try {
      await api.createLog({
        booking_id: diary.booking_id,
        action_type: actionType,
        description: description || undefined,
        image_url: uploadedUrls.join('\n') || undefined,
      });
      setSuccess(true);
      setDescription('');
      setUploadedUrls([]);
      setActionType('feed');
      loadDiary();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      alert((err as Error).message || 'Lỗi tạo nhật ký');
    } finally {
      setSubmitting(false);
    }
  };

  const shareDiaryLink = () => {
    const url = `${window.location.origin}/diary/${diaryToken}`;
    if (navigator.share) {
      navigator.share({ title: `Diary của ${diary?.pets[0]?.name}`, url });
    } else {
      copyToClipboard(url).then(() => alert('Đã copy link diary!'));
    }
  };

  if (loading) return <div className="animate-pulse text-teal-400">Đang tải...</div>;
  if (error || !diary) return <div className="text-red-400">{error || 'Không tìm thấy'}</div>;

  return (
    <div className="max-w-2xl">
      {/* Success toast */}
      {success && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium shadow-lg">
          ✅ Đã thêm nhật ký thành công!
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-xl font-bold truncate">
            {diary.room_name} — {diary.pets.map(p => p.name).join(', ')}
          </h1>
          <p className="text-xs text-slate-500">Chủ: {diary.owner_name} • Check-in: {new Date(diary.check_in_at).toLocaleDateString('vi-VN')}</p>
        </div>
      </div>

      {/* Special notes alert */}
      {diary.pets.some(p => p.special_notes) && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm mb-4">
          <p className="font-semibold flex items-center gap-1 mb-1"><AlertTriangle size={14} /> Lưu ý đặc biệt:</p>
          {diary.pets.filter(p => p.special_notes).map(p => (
            <p key={p.id} className="text-xs">• <b>{p.name}</b>: {p.special_notes}</p>
          ))}
        </div>
      )}

      {/* Expected checkout / overdue */}
      {diary.expected_checkout && diary.status === 'active' && (() => {
        const isOverdue = new Date(diary.expected_checkout) < new Date();
        return (
          <div className={`p-2.5 rounded-lg flex items-center gap-2 text-xs mb-4 ${isOverdue ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-slate-800/50 text-slate-400 border border-slate-700'}`}>
            <CalendarClock size={14} />
            <span>Dự kiến đón: {new Date(diary.expected_checkout).toLocaleString('vi-VN')}</span>
            {isOverdue && <span className="font-semibold ml-1">(QUÁ HẠN!)</span>}
          </div>
        );
      })()}

      {/* Pet images */}
      {diary.pets.some(p => p.image_url) && (
        <div className="flex gap-3 mb-4">
          {diary.pets.filter(p => p.image_url).map(p => (
            <div key={p.id} className="w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-700">
              <Image src={fullUrl(p.image_url!)} alt={p.name} width={64} height={64} className="w-full h-full object-cover" unoptimized />
            </div>
          ))}
        </div>
      )}

      {/* Share diary link */}
      <div className="flex gap-2 mb-6">
        <button onClick={shareDiaryLink} className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors">
          <Share2 size={12} /> Gửi link diary cho chủ
        </button>
        <a href={`/diary/${diaryToken}`} target="_blank" className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors">
          <ExternalLink size={12} /> Xem diary công khai
        </a>
      </div>

      {/* ===== ADD ENTRY FORM ===== */}
      {diary.status === 'active' && (
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700 p-4 mb-6">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Send size={14} className="text-teal-400" /> Thêm nhật ký</h3>

          {/* Quick action buttons */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {quickActions.map(a => (
              <button key={a.value} onClick={() => setActionType(a.value)}
                className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                  actionType === a.value
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                }`}>
                {a.label}
              </button>
            ))}
          </div>

          {/* Description */}
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Mô tả chi tiết (tuỳ chọn)..."
            className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-sm resize-none focus:outline-none focus:border-teal-500 mb-3"
            rows={2} />

          {/* Media upload */}
          {uploadedUrls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto mb-3 pb-1">
              {uploadedUrls.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-700">
                  <Image src={fullUrl(url)} alt="" width={64} height={64} className="w-full h-full object-cover" unoptimized />
                  <button onClick={() => setUploadedUrls(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-red-500/80 text-white"><X size={10} /></button>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 border-dashed cursor-pointer hover:border-slate-500 text-sm text-slate-400 flex-1">
              <Camera size={16} />
              <span>{uploading > 0 ? `Đang tải ${uploading} file...` : 'Thêm ảnh / video'}</span>
              <input ref={fileInputRef} type="file" accept="image/*,video/*" capture="environment" multiple className="hidden" onChange={handleFiles} disabled={uploading > 0} />
            </label>
            <button onClick={handleSubmit} disabled={submitting || uploading > 0}
              className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 font-semibold transition-colors flex items-center gap-2 shrink-0">
              {submitting ? 'Đang gửi...' : <><Send size={16} /> Ghi</>}
            </button>
          </div>
        </div>
      )}

      {/* ===== LOG HISTORY ===== */}
      <h3 className="font-semibold text-sm mb-3 text-slate-400">Lịch sử nhật ký ({diary.logs.length})</h3>

      {diary.logs.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700 border-dashed">
          <PawPrint size={36} className="mx-auto mb-2 opacity-30" />
          <p>Chưa có nhật ký nào</p>
          <p className="text-xs mt-1">Thêm nhật ký đầu tiên ở form bên trên</p>
        </div>
      ) : (
        <div className="space-y-3">
          {diary.logs.map(log => {
            const { text, mediaUrls: logMedia } = parseLogMedia(log.image_url, log.description);
            return (
              <div key={log.id} className="rounded-xl bg-slate-800/50 border border-slate-700 overflow-hidden">
                <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{actionLabels[log.action_type] || log.action_type}</span>
                    {log.pet_name && <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full">{log.pet_name}</span>}
                  </div>
                  <span className="text-xs text-slate-500">{timeAgo(log.created_at)}</span>
                </div>

                {text && <p className="px-4 pb-2 text-sm text-slate-300 whitespace-pre-line">{text}</p>}

                {logMedia.length > 0 && (
                  <div className="px-4 pb-3">
                    <div className={`grid gap-2 ${logMedia.length === 1 ? 'grid-cols-1 max-w-[200px]' : logMedia.length === 2 ? 'grid-cols-2 max-w-[320px]' : 'grid-cols-3 max-w-[400px]'}`}>
                      {logMedia.map((url, idx) => (
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

                <div className="px-4 py-2 flex items-center gap-3 text-xs text-slate-500 border-t border-slate-700/50">
                  {log.staff_name && <span>👤 {log.staff_name}</span>}
                  <span>{new Date(log.created_at).toLocaleString('vi-VN')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
