'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UtensilsCrossed, Pill, Footprints, Camera, StickyNote, DoorOpen, PawPrint, AlertTriangle, Check, ImagePlus, X } from 'lucide-react';
import { api } from '@/lib/api';

const actions = [
  { type: 'FEEDING', Icon: UtensilsCrossed, label: 'Cho ăn', color: 'bg-amber-500/20 border-amber-500/30 text-amber-300' },
  { type: 'MEDICINE', Icon: Pill, label: 'Thuốc', color: 'bg-red-500/20 border-red-500/30 text-red-300' },
  { type: 'WALKING', Icon: Footprints, label: 'Đi dạo', color: 'bg-green-500/20 border-green-500/30 text-green-300' },
  { type: 'PHOTO', Icon: Camera, label: 'Chụp ảnh', color: 'bg-blue-500/20 border-blue-500/30 text-blue-300' },
  { type: 'NOTE', Icon: StickyNote, label: 'Ghi chú', color: 'bg-teal-500/20 border-teal-500/30 text-teal-300' },
];

export default function StaffRoomPage() {
  const { qrToken } = useParams<{ qrToken: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [showLogForm, setShowLogForm] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => api.getOperationRoom(qrToken).then((d) => {
    setData(d);
    if (d.booking?.pets?.length) setSelectedPetId(d.booking.pets[0].id);
  }).finally(() => setLoading(false));

  useEffect(() => { load(); }, [qrToken]);

  const submitLog = async () => {
    if (!data?.booking || !showLogForm) return;
    setSaving(true);
    try {
      let imageUrl: string | undefined;
      // Upload photo first if selected
      if (selectedFile) {
        const uploadRes = await api.uploadFile(selectedFile);
        imageUrl = uploadRes.url;
      }
      await api.createLog({
        booking_id: data.booking.id,
        pet_id: selectedPetId ?? undefined,
        action_type: showLogForm,
        description: description || undefined,
        image_url: imageUrl,
      });
      setShowLogForm(null);
      setDescription('');
      const actionLabel = actions.find(a => a.type === showLogForm)?.label;
      setSuccess(`Đã ghi ${actionLabel}`);
      setSelectedFile(null);
      setPreviewUrl(null);
      setTimeout(() => setSuccess(''), 2000);
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-teal-400">Loading...</div></div>;

  if (!data?.booking) {
    return (
      <div className="px-4 pt-12 text-center">
        <DoorOpen size={40} className="text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">{data?.room?.room_name || 'Phòng'}</h2>
        <p className="text-slate-400">Không có pet nào đang gửi ở phòng này</p>
        <button onClick={() => router.push('/staff')} className="mt-6 px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors">
          ← Quay lại
        </button>
      </div>
    );
  }

  const booking = data.booking;
  const activeAction = actions.find(a => a.type === showLogForm);

  return (
    <div className="px-4 pt-4 pb-8">
      {/* Room + Pet Info */}
      <div className="text-center mb-6">
        <p className="text-sm text-slate-500">{data.room.room_name}</p>

        {/* Pet selector */}
        <div className="flex justify-center gap-4 mt-4">
          {booking.pets?.map((pet: any) => (
            <button key={pet.id} onClick={() => setSelectedPetId(pet.id)}
              className={`text-center p-3 rounded-xl transition-all ${selectedPetId === pet.id ? 'bg-teal-500/20 border border-teal-500/50 scale-105' : 'border border-transparent'}`}>
              <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-1">
                {pet.image_url ? <img src={pet.image_url} alt={pet.name} className="w-full h-full rounded-full object-cover" /> : <PawPrint size={24} className="text-teal-400" />}
              </div>
              <p className="text-sm font-medium">{pet.name}</p>
              <p className="text-xs text-slate-500">{pet.type}</p>
            </button>
          ))}
        </div>

        {/* Special notes warning */}
        {booking.pets?.find((p: any) => p.id === selectedPetId)?.special_notes && (
          <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-center gap-2 justify-center">
            <AlertTriangle size={16} /> {booking.pets.find((p: any) => p.id === selectedPetId).special_notes}
          </div>
        )}
      </div>

      {/* Success toast */}
      {success && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 font-medium z-50 animate-bounce flex items-center gap-2">
          <Check size={18} /> {success}
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {actions.map((action) => (
          <button key={action.type} onClick={() => { setShowLogForm(action.type); setDescription(''); }}
            className={`p-5 rounded-2xl border-2 ${action.color} hover:scale-105 active:scale-95 transition-all flex flex-col items-center gap-2`}>
            <action.Icon size={28} />
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Log form bottom sheet */}
      {showLogForm && activeAction && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowLogForm(null)}>
          <div className="absolute bottom-0 left-0 right-0 bg-slate-800 rounded-t-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1.5 rounded-full bg-slate-600 mx-auto" />
            <h3 className="text-lg font-semibold text-center flex items-center justify-center gap-2">
              <activeAction.Icon size={20} /> {activeAction.label}
            </h3>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Mô tả (tùy chọn)..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-teal-500 focus:outline-none resize-none" />

            {/* Photo upload */}
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedFile(file);
                  setPreviewUrl(URL.createObjectURL(file));
                }
              }} />

            {previewUrl ? (
              <div className="relative">
                <img src={previewUrl} alt="Preview" className="w-full h-32 rounded-xl object-cover border border-slate-600" />
                <button onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 rounded-xl border-2 border-dashed border-slate-600 text-slate-400 hover:border-teal-500 hover:text-teal-400 transition-colors flex items-center justify-center gap-2">
                <ImagePlus size={18} /> Đính kèm ảnh
              </button>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowLogForm(null)} className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 font-medium transition-colors">Hủy</button>
              <button onClick={submitLog} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 font-medium transition-colors">
                {saving ? 'Đang ghi...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent logs */}
      {booking.logs?.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Nhật ký gần đây</h3>
          <div className="space-y-2">
            {booking.logs.slice(0, 10).map((log: any) => {
              const logAction = actions.find(a => a.type === log.action_type);
              const LogIcon = logAction?.Icon || StickyNote;
              return (
                <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <LogIcon size={18} className="text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{log.description || logAction?.label}</p>
                    {log.image_url && (
                      <img src={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/api$/, '')}${log.image_url}`}
                        alt="" className="rounded-lg max-h-24 object-cover mt-1 border border-slate-700" />
                    )}
                    <p className="text-xs text-slate-500">{log.pet_name} · {new Date(log.created_at).toLocaleString('vi-VN')} · {log.staff_name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
