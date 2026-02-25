'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PawPrint, Share2, ClipboardList, LogIn, CalendarClock, LogOut, AlertTriangle, Clock } from 'lucide-react';
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
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

// Parse description to separate text and media URLs
function parseLogMedia(imageUrl?: string, desc?: string): { text: string; mediaUrls: string[] } {
  const mediaUrls: string[] = [];
  // image_url can contain multiple URLs separated by newlines
  if (imageUrl) {
    for (const part of imageUrl.split('\n')) {
      const trimmed = part.trim();
      if (trimmed) mediaUrls.push(fullUrl(trimmed));
    }
  }
  // Also check description for legacy logs that had URLs mixed in
  const textLines: string[] = [];
  if (desc) {
    for (const line of desc.split('\n')) {
      if (isMediaUrl(line.trim())) mediaUrls.push(line.trim());
      else if (line.trim()) textLines.push(line);
    }
  }
  return { text: textLines.join('\n'), mediaUrls };
}

export default function DiaryPage() {
  const { diaryToken } = useParams<{ diaryToken: string }>();
  const [diary, setDiary] = useState<DiaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDiary(diaryToken).then(setDiary).catch(() => setError('Diary không tìm thấy')).finally(() => setLoading(false));
  }, [diaryToken]);

  const share = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `Diary của ${diary?.pets[0]?.name}`, url });
    } else {
      copyToClipboard(url).then(() => alert('Đã copy link!'));
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-teal-400 text-xl">Đang tải diary...</div></div>;
  if (error || !diary) return <div className="min-h-screen flex items-center justify-center text-red-400">{error || 'Not found'}</div>;

  return (
    <div className="min-h-screen pb-12">      {/* Header */}
      <div className="bg-linear-to-b from-teal-900/50 to-transparent pt-8 pb-12 px-4">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-sm text-slate-400 mb-1">{diary.hotel_name}</p>
          <p className="text-sm text-slate-500 mb-4">{diary.room_name}</p>

          {/* Pet cards */}
          <div className="flex justify-center gap-4 mb-4">
            {diary.pets.map((pet) => (
              <div key={pet.id} className="text-center">
                <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center mb-2 mx-auto border-2 border-teal-500/30">
                  {pet.image_url ? (
                    <Image src={fullUrl(pet.image_url)} alt={pet.name} width={80} height={80} className="w-full h-full rounded-full object-cover" unoptimized />
                  ) : (
                    <PawPrint size={28} className="text-teal-400" />
                  )}
                </div>
                <p className="font-semibold">{pet.name}</p>
                <p className="text-xs text-slate-400">{pet.type}</p>
              </div>
            ))}
          </div>

          {/* Status badge */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${diary.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/50 text-slate-300'}`}>
            <span className={`w-2 h-2 rounded-full ${diary.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`} />
            {diary.status === 'active' ? 'Đang gửi' : 'Đã trả'}
          </div>

          <p className="text-xs text-slate-500 mt-2 flex items-center justify-center gap-1"><LogIn size={12} /> Check-in: {new Date(diary.check_in_at).toLocaleString('vi-VN')}</p>
          {diary.expected_checkout && (
            <p className={`text-xs mt-1 flex items-center justify-center gap-1 ${diary.status === 'active' && new Date(diary.expected_checkout) < new Date() ? 'text-red-400 font-semibold' : 'text-slate-500'}`}>
              <CalendarClock size={12} /> Dự kiến đón: {new Date(diary.expected_checkout).toLocaleString('vi-VN')}
            </p>
          )}
          {diary.check_out_at && (
            <p className="text-xs text-green-400 mt-1 flex items-center justify-center gap-1"><LogOut size={12} /> Đã trả: {new Date(diary.check_out_at).toLocaleString('vi-VN')}</p>
          )}

          {/* Overdue alert */}
          {diary.status === 'active' && diary.expected_checkout && new Date(diary.expected_checkout) < new Date() && (() => {
            const overdueDays = Math.ceil((new Date().getTime() - new Date(diary.expected_checkout).getTime()) / (1000 * 60 * 60 * 24));
            return (
              <div className="mt-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-left">
                <p className="text-red-400 font-semibold text-sm flex items-center gap-1"><AlertTriangle size={14} /> Đã quá hạn đón!</p>
                <p className="text-red-300/70 text-xs mt-0.5">
                  Dự kiến đón lúc {new Date(diary.expected_checkout).toLocaleString('vi-VN')} — đã trễ {overdueDays} ngày. Vui lòng liên hệ hotel.
                </p>
              </div>
            );
          })()}

          {/* Special notes */}
          {diary.pets.some(p => p.special_notes) && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm text-left">
              <p className="font-medium mb-1 flex items-center gap-1"><AlertTriangle size={14} /> Lưu ý đặc biệt:</p>
              {diary.pets.filter(p => p.special_notes).map(p => (
                <p key={p.id} className="text-xs">{p.name}: {p.special_notes}</p>
              ))}
            </div>
          )}

          {/* Share */}
          <button onClick={share} className="mt-4 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-sm transition-colors flex items-center gap-1.5 mx-auto">
            <Share2 size={14} /> Chia sẻ diary
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-lg mx-auto px-4">
        <h2 className="font-semibold text-lg mb-6">Nhật ký chăm sóc</h2>

        {diary.logs.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <ClipboardList size={36} className="mx-auto mb-2 text-slate-600" />
            <p>Chưa có nhật ký nào</p>
            <p className="text-sm">Nhân viên sẽ cập nhật tại đây</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-700" />

            <div className="space-y-6">
              {diary.logs.map((log) => {
                const { text, mediaUrls: logMedia } = parseLogMedia(log.image_url, log.description);

                return (
                  <div key={log.id} className="relative flex gap-4">
                    {/* Timeline dot */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 bg-slate-800 border-2 border-slate-600">
                      <span className="text-lg">{(actionLabels[log.action_type] || '📝').slice(0, 2)}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{actionLabels[log.action_type] || log.action_type}</span>
                          {log.pet_name && <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full text-slate-300">{log.pet_name}</span>}
                        </div>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock size={10} /> {timeAgo(log.created_at)}
                        </span>
                      </div>

                      {/* Text description */}
                      {text && <p className="text-sm text-slate-300 mb-2 whitespace-pre-line">{text}</p>}

                      {/* Media thumbnails */}
                      {logMedia.length > 0 && (
                        <div className={`mb-2 grid gap-2 ${logMedia.length === 1 ? 'grid-cols-1 max-w-[180px]' : 'grid-cols-2 max-w-[280px]'}`}>
                          {logMedia.map((url, idx) => (
                            <div key={idx} className="rounded-lg overflow-hidden border border-slate-700 aspect-square">
                              {isVideoUrl(url) ? (
                                <video src={url} controls className="w-full h-full object-cover" playsInline />
                              ) : (
                                <Image src={url} alt="" width={150} height={150}
                                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  unoptimized
                                  onClick={() => window.open(url, '_blank')}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{new Date(log.created_at).toLocaleString('vi-VN')}</span>
                        {log.staff_name && <span>bởi {log.staff_name}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
