'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  const { hotel } = useAuth();
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const [sub, setSub] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (hotel) setForm({ name: hotel.name || '', address: hotel.address || '', phone: hotel.phone || '' });
    api.getSubscription().then(setSub).catch(() => {});
  }, [hotel]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateHotel(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">Cài đặt</h1>

      {/* Hotel info */}
      <form onSubmit={save} className="rounded-xl bg-slate-800/50 border border-slate-700 p-6 mb-6 space-y-4">
        <h2 className="font-semibold text-lg">Thông tin Hotel</h2>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Tên Hotel</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-teal-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Địa chỉ</label>
          <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-teal-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Số điện thoại</label>
          <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-teal-500 focus:outline-none" />
        </div>
        <button type="submit" disabled={saving}
          className="px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 font-medium transition-colors">
          {saved ? <span className="flex items-center justify-center gap-1"><Check size={16} /> Đã lưu!</span> : saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>

      {/* Subscription */}
      {sub && (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <h2 className="font-semibold text-lg mb-4">Gói dịch vụ</h2>
          <div className="flex items-center gap-4 mb-4">
            <span className="px-4 py-2 rounded-lg bg-teal-500/20 text-teal-300 font-semibold text-lg capitalize">{sub.plan}</span>
            <span className="text-slate-400">Tối đa {sub.max_rooms} phòng</span>
          </div>
          {sub.plan === 'trial' && sub.trial_ends_at && (() => {
            const d = Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / 86400000));
            const expired = d === 0;
            return (
              <div className={`text-sm flex items-center justify-between p-3 rounded-lg ${expired ? 'bg-red-500/10 border border-red-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'}`}>
                <span className={expired ? 'text-red-400' : 'text-yellow-400'}>
                  {expired ? '⚠️ Hết thời gian dùng thử!' : `⏳ Còn ${d} ngày dùng thử (hết hạn ${new Date(sub.trial_ends_at).toLocaleDateString('vi-VN')})`}
                </span>
                <a href="/dashboard/pricing" className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium transition-colors">Nâng cấp</a>
              </div>
            );
          })()}
          {sub.plan !== 'trial' && sub.plan !== 'free' && sub.expires_at && (() => {
            const d = Math.max(0, Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / 86400000));
            const expired = d === 0;
            return (
              <div className={`text-sm flex items-center justify-between p-3 rounded-lg ${expired ? 'bg-red-500/10 border border-red-500/30' : 'bg-green-500/10 border border-green-500/30'}`}>
                <span className={expired ? 'text-red-400' : 'text-green-400'}>
                  {expired ? '⚠️ Gói đã hết hạn!' : `✓ Hết hạn: ${new Date(sub.expires_at).toLocaleDateString('vi-VN')} (còn ${d} ngày)`}
                </span>
                <a href="/dashboard/pricing" className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium transition-colors">{expired ? 'Gia hạn' : 'Xem gói'}</a>
              </div>
            );
          })()}
          {sub.plan === 'free' && (
            <div className="text-sm flex items-center justify-between p-3 rounded-lg bg-slate-700/50 border border-slate-600">
              <span className="text-slate-400">Gói miễn phí — giới hạn tính năng</span>
              <a href="/dashboard/pricing" className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium transition-colors">Nâng cấp</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
