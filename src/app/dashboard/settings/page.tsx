'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Check, Store, Settings2, Crown, Building2, Upload, ImageIcon,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const TABS = [
  { key: 'store', label: 'Cửa hàng', icon: Store },
  { key: 'plan', label: 'Gói dịch vụ', icon: Crown },
];

export default function SettingsPage() {
  const { hotel, refreshHotel } = useAuth();
  const [tab, setTab] = useState('store');

  // Store info
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Subscription
  const [sub, setSub] = useState<any>(null);

  useEffect(() => {
    if (hotel) {
      setForm({ name: hotel.name || '', address: hotel.address || '', phone: hotel.phone || '' });
    }
    api.getSubscription().then(setSub).catch(() => {});
  }, [hotel]);

  const saveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateHotel(form);
      await refreshHotel();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { alert('Lỗi khi lưu'); }
    finally { setSaving(false); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('File tối đa 2MB'); return; }
    setLogoUploading(true);
    try {
      await api.uploadLogo(file);
      await refreshHotel();
    } catch { alert('Lỗi upload logo'); }
    finally { setLogoUploading(false); }
  };

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-teal-500/10">
          <Settings2 size={22} className="text-teal-400" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Cài đặt</h1>
          <p className="text-xs text-slate-500">Quản lý thông tin và cấu hình cửa hàng</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}>
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ═══ TAB: Cửa hàng ═══ */}
      {tab === 'store' && (
        <form onSubmit={saveStore} className="space-y-4">
          {/* Logo upload */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-5">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon size={16} className="text-teal-400" />
              <h2 className="font-semibold">Logo cửa hàng</h2>
              <span className="text-[10px] text-slate-500">(hiển thị trên hoá đơn)</span>
            </div>
            <div className="flex items-center gap-4">
              {hotel?.logo_url ? (
                <img src={hotel.logo_url} alt="Logo" className="w-20 h-20 rounded-xl object-contain bg-white/5 border border-slate-700" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-slate-900/50 border border-dashed border-slate-600 flex items-center justify-center">
                  <Upload size={20} className="text-slate-600" />
                </div>
              )}
              <div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={logoUploading}
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm transition-colors disabled:opacity-50">
                  {logoUploading ? 'Đang upload...' : hotel?.logo_url ? 'Đổi logo' : 'Upload logo'}
                </button>
                <p className="text-[10px] text-slate-500 mt-1">PNG, JPG. Tối đa 2MB</p>
              </div>
            </div>
          </div>

          {/* Store info */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={16} className="text-teal-400" />
              <h2 className="font-semibold">Thông tin cửa hàng</h2>
            </div>
            {[
              { label: 'Tên cửa hàng', key: 'name', type: 'text' },
              { label: 'Địa chỉ', key: 'address', type: 'text' },
              { label: 'Số điện thoại', key: 'phone', type: 'tel' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm text-slate-400 mb-1">{f.label}</label>
                <input type={f.type} value={form[f.key as keyof typeof form]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700 focus:border-teal-500 focus:outline-none text-sm" />
              </div>
            ))}
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 font-medium transition-colors text-sm">
            {saved ? <span className="flex items-center justify-center gap-1"><Check size={16} /> Đã lưu</span> : saving ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </form>
      )}

      {/* ═══ TAB: Gói dịch vụ ═══ */}
      {tab === 'plan' && sub && (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Crown size={16} className="text-teal-400" />
            <h2 className="font-semibold">Gói dịch vụ</h2>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <span className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 font-bold text-lg capitalize">{sub.plan}</span>
            <span className="text-slate-400 text-sm">Tối đa {sub.max_rooms} phòng</span>
          </div>
          {sub.plan === 'trial' && sub.trial_ends_at && (() => {
            const d = Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / 86400000));
            const expired = d === 0;
            return (
              <div className={`text-sm flex items-center justify-between p-3 rounded-xl ${expired ? 'bg-red-500/10 border border-red-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'}`}>
                <span className={expired ? 'text-red-400' : 'text-yellow-400'}>
                  {expired ? 'Hết thời gian dùng thử!' : `Còn ${d} ngày dùng thử`}
                </span>
                <a href="/dashboard/pricing" className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium transition-colors">Nâng cấp</a>
              </div>
            );
          })()}
          {sub.plan !== 'trial' && sub.plan !== 'free' && sub.expires_at && (() => {
            const d = Math.max(0, Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / 86400000));
            const expired = d === 0;
            return (
              <div className={`text-sm flex items-center justify-between p-3 rounded-xl ${expired ? 'bg-red-500/10 border border-red-500/30' : 'bg-green-500/10 border border-green-500/30'}`}>
                <span className={expired ? 'text-red-400' : 'text-green-400'}>
                  {expired ? 'Gói đã hết hạn!' : `Hết hạn: ${new Date(sub.expires_at).toLocaleDateString('vi-VN')} (còn ${d} ngày)`}
                </span>
                <a href="/dashboard/pricing" className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium transition-colors">{expired ? 'Gia hạn' : 'Xem gói'}</a>
              </div>
            );
          })()}
          {sub.plan === 'free' && (
            <div className="text-sm flex items-center justify-between p-3 rounded-xl bg-slate-700/50 border border-slate-600">
              <span className="text-slate-400">Gói miễn phí — giới hạn tính năng</span>
              <a href="/dashboard/pricing" className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium transition-colors">Nâng cấp</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
