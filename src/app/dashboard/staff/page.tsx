'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const [adding, setAdding] = useState(false);

  const load = () => api.getStaff().then(setStaff).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const addStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.createStaff(form);
      setForm({ email: '', password: '', full_name: '' });
      setShowForm(false);
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  const deleteStaff = async (id: number) => {
    if (!confirm('Xóa nhân viên này?')) return;
    await api.deleteStaff(id);
    load();
  };

  if (loading) return <div className="animate-pulse text-teal-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý nhân viên</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 font-medium transition-colors">
          + Thêm nhân viên
        </button>
      </div>

      {showForm && (
        <form onSubmit={addStaff} className="rounded-xl bg-slate-800/50 border border-slate-700 p-5 mb-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required
              placeholder="Họ tên" className="px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-teal-500 focus:outline-none" />
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
              placeholder="Email" className="px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-teal-500 focus:outline-none" />
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6}
              placeholder="Mật khẩu" className="px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-teal-500 focus:outline-none" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={adding} className="px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 font-medium transition-colors">
              {adding ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors">Hủy</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {staff.length === 0 && <p className="text-slate-500 text-center py-12">Chưa có nhân viên nào</p>}
        {staff.map((s) => (
          <div key={s.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center font-medium">{s.full_name?.[0]}</div>
              <div>
                <p className="font-medium">{s.full_name}</p>
                <p className="text-sm text-slate-400">{s.email}</p>
              </div>
            </div>
            <button onClick={() => deleteStaff(s.id)} className="px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-colors">Xóa</button>
          </div>
        ))}
      </div>
    </div>
  );
}
