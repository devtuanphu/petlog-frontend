'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PartyPopper, PawPrint, Copy, ExternalLink, CheckCircle, AlertTriangle, Plus, X, Camera, Loader2, CalendarClock, Sparkles, Gift, DollarSign } from 'lucide-react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { copyToClipboard } from '@/lib/clipboard';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/api$/, '');

function fullUrl(path: string) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
}

export default function CheckinPage() {
  const { qrToken } = useParams<{ qrToken: string }>();
  const router = useRouter();
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [expectedCheckout, setExpectedCheckout] = useState('');
  const [pets, setPets] = useState([{ name: '', type: 'Chó', image_url: '', special_notes: '' }]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [uploadingPet, setUploadingPet] = useState<number | null>(null);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);

  useEffect(() => {
    api.getRoomInfo(qrToken).then((info) => {
      setRoomInfo(info);

      // If room is occupied and has an active booking, redirect to diary
      if (!info.is_available && info.active_booking?.diary_token) {
        const hasToken = !!localStorage.getItem('petlog_token');
        if (hasToken) {
          // Staff/hotel owner → editable diary
          router.replace(`/dashboard/diary/${info.active_booking.diary_token}`);
        } else {
          // Pet owner → read-only diary
          router.replace(`/diary/${info.active_booking.diary_token}`);
        }
        return;
      }
    }).catch(() => setError('Phòng không tồn tại')).finally(() => setLoading(false));
  }, [qrToken, router]);

  const lookupCustomer = async () => {
    if (ownerPhone.length < 10) return;
    try {
      const data = await api.customerLookup(ownerPhone);
      if (data.found) setOwnerName(data.owner_name);
    } catch {}
  };

  const addPet = () => setPets([...pets, { name: '', type: 'Chó', image_url: '', special_notes: '' }]);
  const removePet = (i: number) => { if (pets.length > 1) setPets(pets.filter((_, idx) => idx !== i)); };
  const updatePet = (i: number, key: string, val: string) => {
    const updated = [...pets];
    (updated[i] as any)[key] = val;
    setPets(updated);
  };

  const handlePetImage = async (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('Ảnh quá 10MB'); return; }
    setUploadingPet(i);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${API_URL}/public/upload`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload thất bại');
      const data = await res.json();
      updatePet(i, 'image_url', data.url);
    } catch { alert('Upload ảnh thất bại'); }
    setUploadingPet(null);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await api.checkin(qrToken, {
        owner_name: ownerName,
        owner_phone: ownerPhone,
        expected_checkout: expectedCheckout || undefined,
        pets,
        selected_services: selectedServices.length > 0 ? selectedServices : undefined,
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-teal-400 text-xl">Đang tải...</div></div>;

  // Success screen
  if (result) {
    const diaryUrl = `${window.location.origin}/diary/${result.diary_token}`;
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <PartyPopper size={48} className="text-teal-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Check-in thành công!</h1>
          <p className="text-slate-400 mb-8">Lưu link bên dưới để theo dõi bé nhé</p>

          <div className="rounded-2xl bg-slate-800/50 border border-slate-700 p-6 mb-6">
            <p className="text-sm text-slate-400 mb-2">Link diary của bé</p>
            <p className="text-teal-400 font-mono text-sm break-all mb-4">{diaryUrl}</p>
            <div className="flex gap-3">
              <button onClick={() => copyToClipboard(diaryUrl)}
                className="flex-1 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 font-medium transition-colors">
                <Copy size={16} className="inline mr-1" /> Copy link
              </button>
              <a href={diaryUrl} className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 font-medium transition-colors text-center">
                <ExternalLink size={16} className="inline mr-1" /> Xem diary
              </a>
            </div>
          </div>

          <p className="text-xs text-slate-500">Mở link này bất kỳ lúc nào để xem quá trình chăm sóc bé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Hotel header */}
        {roomInfo && (
          <div className="text-center mb-8">
            <PawPrint size={36} className="text-teal-400 mx-auto" />
            <h1 className="text-xl font-bold mt-2">{roomInfo.hotel.name}</h1>
            <p className="text-slate-400">{roomInfo.room.room_name}</p>
            {roomInfo.room.room_type && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full mt-1 font-medium"
                style={{ backgroundColor: roomInfo.room.room_type.color + '20', color: roomInfo.room.room_type.color }}>
                {roomInfo.room.room_type.icon} {roomInfo.room.room_type.name}
                {roomInfo.room.daily_rate > 0 && ` — ${new Intl.NumberFormat('vi-VN').format(roomInfo.room.daily_rate)}đ/ngày`}
              </span>
            )}
            {!roomInfo.is_available && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                <span className="flex items-center justify-center gap-1"><AlertTriangle size={16} /> Phòng này đang có pet, không thể check-in</span>
              </div>
            )}
          </div>
        )}

        {error && <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">{error}</div>}

        {roomInfo?.is_available && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Owner info */}
            <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-5 space-y-4">
              <h2 className="font-semibold">Thông tin chủ pet</h2>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Số điện thoại</label>
                <input type="tel" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} onBlur={lookupCustomer} required
                  className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-teal-500 focus:outline-none" placeholder="0901234567" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Họ tên</label>
                <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required
                  className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-teal-500 focus:outline-none" placeholder="Nguyễn Văn A" />
              </div>
            </div>

            {/* Expected checkout */}
            <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-5 space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><CalendarClock size={16} className="text-teal-400" /> Ngày dự kiến đón về</h2>
              <input type="datetime-local" value={expectedCheckout} onChange={(e) => setExpectedCheckout(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-teal-500 focus:outline-none" />
              <p className="text-xs text-slate-500">Để trống nếu chưa biết ngày đón</p>
            </div>

            {/* Pets */}
            {pets.map((pet, i) => (
              <div key={i} className="rounded-xl bg-slate-800/50 border border-slate-700 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold flex items-center gap-1"><PawPrint size={16} /> Pet {pets.length > 1 ? `#${i + 1}` : ''}</h2>
                  {pets.length > 1 && (
                    <button type="button" onClick={() => removePet(i)} className="text-red-400 text-sm hover:text-red-300">Xóa</button>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Tên bé</label>
                  <input type="text" value={pet.name} onChange={(e) => updatePet(i, 'name', e.target.value)} required
                    className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-teal-500 focus:outline-none" placeholder="Mochi" />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Loại</label>
                  <select value={pet.type} onChange={(e) => updatePet(i, 'type', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-teal-500 focus:outline-none">
                    <option>Chó</option><option>Mèo</option><option>Hamster</option><option>Thỏ</option><option>Khác</option>
                  </select>
                </div>

                {/* Pet Image Upload */}
                <div>
                  <label className="text-sm text-slate-300 mb-2 flex items-center gap-1"><Camera size={14} /> Ảnh bé</label>
                  {pet.image_url ? (
                    <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-teal-500/30">
                      <Image src={fullUrl(pet.image_url)} alt={pet.name || 'Pet'} fill className="object-cover" unoptimized />
                      <button type="button" onClick={() => updatePet(i, 'image_url', '')}
                        className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 text-white"><X size={12} /></button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 w-32 h-32 rounded-xl border-2 border-dashed border-slate-600 cursor-pointer hover:border-teal-500 transition-colors">
                      {uploadingPet === i ? (
                        <Loader2 size={20} className="animate-spin text-teal-400" />
                      ) : (
                        <div className="text-center">
                          <Camera size={24} className="mx-auto text-slate-500 mb-1" />
                          <span className="text-xs text-slate-500">Thêm ảnh</span>
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePetImage(i, e)} disabled={uploadingPet !== null} />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Ghi chú đặc biệt <span className="text-slate-500">(dị ứng, thuốc...)</span></label>
                  <textarea value={pet.special_notes} onChange={(e) => updatePet(i, 'special_notes', e.target.value)} rows={2}
                    className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-teal-500 focus:outline-none resize-none" />
                </div>
              </div>
            ))}

            <button type="button" onClick={addPet}
              className="w-full py-3 rounded-lg border-2 border-dashed border-slate-600 text-slate-400 hover:border-teal-500 hover:text-teal-400 transition-colors flex items-center justify-center gap-1">
              <Plus size={16} /> Thêm pet
            </button>



            {/* Services selection */}
            {roomInfo.services?.length > 0 && (
              <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-5 space-y-3">
                <h2 className="font-semibold flex items-center gap-2"><Sparkles size={16} className="text-amber-400" /> Chọn dịch vụ</h2>
                <p className="text-xs text-slate-500">Chọn các dịch vụ bạn muốn sử dụng cho bé</p>
                <div className="space-y-2">
                  {roomInfo.services.map((svc: any) => (
                    <label key={svc.id} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                      selectedServices.includes(svc.id) ? 'bg-teal-600/15 border border-teal-500/30' : 'bg-slate-900/40 border border-slate-700/50 hover:border-slate-600'
                    }`}>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={selectedServices.includes(svc.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedServices([...selectedServices, svc.id]);
                            else setSelectedServices(selectedServices.filter(id => id !== svc.id));
                          }}
                          className="accent-teal-500 w-4 h-4" />
                        <span className="text-sm font-medium">{svc.name}</span>
                      </div>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <DollarSign size={10} />
                        {new Intl.NumberFormat('vi-VN').format(svc.default_price)}đ
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Promotions info */}
            {roomInfo.promotions?.length > 0 && (
              <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-5 space-y-3">
                <h2 className="font-semibold flex items-center gap-2 text-amber-400"><Gift size={16} /> Khuyến mãi đang áp dụng</h2>
                <div className="space-y-2">
                  {roomInfo.promotions.map((p: any) => (
                    <div key={p.id} className="flex items-start gap-2 text-sm">
                      <Gift size={12} className="text-amber-400/60 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-slate-200">{p.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {p.condition_type === 'min_days' && `Gửi ≥ ${p.condition_value} ngày`}
                          {p.condition_type === 'min_amount' && `Chi ≥ ${new Intl.NumberFormat('vi-VN').format(p.condition_value)}đ`}
                          {p.condition_type === 'min_pets' && `≥ ${p.condition_value} pet`}
                          {' → '}
                          {p.reward_label || p.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full py-4 rounded-xl bg-linear-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 disabled:opacity-50 font-semibold text-lg transition-all shadow-lg shadow-teal-500/25">
              {submitting ? 'Đang check-in...' : <span className="flex items-center justify-center gap-1"><CheckCircle size={18} /> Check-in</span>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
