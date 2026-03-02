'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Sparkles, Plus, Trash2, Save, Home,
  Tag, Gift, Settings, Palette, Edit3,
  ToggleLeft, ToggleRight, Award, Calendar, Percent,
  BadgeDollarSign, X, Receipt, Eye
} from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

// ─── Types ───
interface RoomType {
  id: number; name: string; daily_rate: number; description: string;
  price_tiers?: { label: string; price: number }[] | null;
  max_pets?: number;
  color: string; icon: string; is_active: boolean; sort_order: number;
  room_count?: number;
}
interface Template {
  id: number; name: string; default_price: number; is_active: boolean; sort_order: number;
}
interface Promotion {
  id: number; name: string; description: string;
  condition_type: string; condition_value: number;
  reward_type: string; reward_service_id: number; reward_value: number;
  reward_label: string; is_active: boolean;
  rewardService?: { id: number; name: string };
}

// ─── VND formatter ───
const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN').format(n) + 'đ';

const formatInputVND = (value: string) => {
  const num = value.replace(/\D/g, '');
  if (!num) return '';
  return new Intl.NumberFormat('vi-VN').format(parseInt(num));
};

const parseVNDInput = (formatted: string): string => {
  return formatted.replace(/\D/g, '');
};

// ─── VND Input Component (no spinner) ───
function VNDInput({ value, onChange, placeholder, className, onKeyDown }: {
  value: string; onChange: (raw: string) => void;
  placeholder?: string; className?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}) {
  const display = value ? formatInputVND(value) : '';
  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={e => onChange(parseVNDInput(e.target.value))}
        onKeyDown={onKeyDown}
        placeholder={placeholder || '0'}
        className={className}
      />
      {display && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">đ</span>
      )}
    </div>
  );
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

type Tab = 'room-types' | 'services' | 'promotions' | 'invoices';

export default function ServicesPage() {
  const [tab, setTab] = useState<Tab>('room-types');
  const [loading, setLoading] = useState(true);

  // ─── Room Types ───
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [rtForm, setRtForm] = useState({ name: '', max_pets: '1', description: '', color: COLORS[0], icon: '🏠' });
  const [rtTiers, setRtTiers] = useState<{ label: string; price: string }[]>([{ label: '', price: '' }]);
  const [rtEditing, setRtEditing] = useState<number | null>(null);
  const [rtSaving, setRtSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState('');

  // ─── Services ───
  const [templates, setTemplates] = useState<Template[]>([]);
  const [svcForm, setSvcForm] = useState({ name: '', default_price: '' });
  const [svcSaving, setSvcSaving] = useState(false);

  // ─── Promotions ───
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [promoForm, setPromoForm] = useState({
    name: '', description: '', condition_type: 'min_days', condition_value: '',
    reward_type: 'free_service', reward_service_id: '', reward_value: '',
  });
  const [promoEditing, setPromoEditing] = useState<number | null>(null);
  const [promoSaving, setPromoSaving] = useState(false);
  const [showPromoForm, setShowPromoForm] = useState(false);

  // ─── Invoices ───
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  // ─── Load data ───
  const loadRoomTypes = useCallback(() => {
    api.getRoomTypes().then(setRoomTypes).catch(() => {});
  }, []);
  const loadTemplates = useCallback(() => {
    api.getServiceTemplates().then(setTemplates).catch(() => {});
  }, []);
  const loadPromos = useCallback(() => {
    api.getPromotions().then(setPromos).catch(() => {});
  }, []);
  const loadInvoices = useCallback(() => {
    setInvoicesLoading(true);
    api.getBookings('completed').then(setInvoices).catch(() => {}).finally(() => setInvoicesLoading(false));
  }, []);

  useEffect(() => {
    Promise.all([api.getRoomTypes(), api.getServiceTemplates(), api.getPromotions()])
      .then(([rt, t, p]) => { setRoomTypes(rt); setTemplates(t); setPromos(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load invoices when tab is activated
  useEffect(() => {
    if (tab === 'invoices' && invoices.length === 0) loadInvoices();
  }, [tab]);

  // ─── Room Type CRUD ───
  const saveRoomType = async () => {
    const validTiers = rtTiers.filter(t => t.label && t.price);
    if (!rtForm.name || validTiers.length === 0) return;
    setRtSaving(true);
    try {
      const tiers = validTiers.map(t => ({ label: t.label, price: parseInt(t.price) || 0 }));
      const data = {
        name: rtForm.name,
        daily_rate: tiers[0]?.price || 0,
        price_tiers: tiers,
        max_pets: parseInt(rtForm.max_pets) || 1,
        description: rtForm.description,
        color: rtForm.color,
        icon: rtForm.icon,
      };
      if (rtEditing) {
        await api.updateRoomType(rtEditing, data);
      } else {
        await api.createRoomType(data);
      }
      setRtForm({ name: '', max_pets: '1', description: '', color: COLORS[0], icon: '🏠' });
      setRtTiers([{ label: '', price: '' }]);
      setRtEditing(null);
      loadRoomTypes();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Lỗi');
    } finally {
      setRtSaving(false);
    }
  };

  const editRoomType = (rt: RoomType) => {
    setRtForm({
      name: rt.name,
      max_pets: String(rt.max_pets ?? 1),
      description: rt.description || '',
      color: rt.color, icon: rt.icon || '🏠',
    });
    if (rt.price_tiers && rt.price_tiers.length > 0) {
      setRtTiers(rt.price_tiers.map(t => ({ label: t.label, price: String(t.price) })));
    } else {
      setRtTiers([{ label: 'Mặc định', price: String(rt.daily_rate) }]);
    }
    setRtEditing(rt.id);
  };

  const deleteRoomType = async (id: number) => {
    try {
      await api.deleteRoomType(id);
      setDeleteConfirm(null);
      setDeleteError('');
      loadRoomTypes();
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : 'Không thể xoá loại phòng này');
    }
  };

  const toggleRoomType = async (rt: RoomType) => {
    await api.updateRoomType(rt.id, { is_active: !rt.is_active });
    loadRoomTypes();
  };

  // ─── Service Template CRUD ───
  const addTemplate = async () => {
    if (!svcForm.name || !svcForm.default_price) return;
    setSvcSaving(true);
    try {
      await api.createServiceTemplate({
        name: svcForm.name,
        default_price: parseInt(svcForm.default_price),
        sort_order: templates.length,
      });
      setSvcForm({ name: '', default_price: '' });
      loadTemplates();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Lỗi');
    } finally {
      setSvcSaving(false);
    }
  };

  const deleteTemplate = async (id: number) => {
    if (!confirm('Xoá dịch vụ này?')) return;
    await api.deleteServiceTemplate(id);
    loadTemplates();
  };

  // ─── Promotion CRUD ───
  const savePromo = async () => {
    if (!promoForm.name || !promoForm.condition_value || !promoForm.reward_value) return;
    setPromoSaving(true);
    try {
      const data = {
        name: promoForm.name,
        description: promoForm.description,
        condition_type: promoForm.condition_type,
        condition_value: parseInt(promoForm.condition_value),
        reward_type: promoForm.reward_type,
        reward_service_id: promoForm.reward_service_id ? parseInt(promoForm.reward_service_id) : undefined,
        reward_value: parseInt(promoForm.reward_value),
      };
      if (promoEditing) {
        await api.updatePromotion(promoEditing, data);
      } else {
        await api.createPromotion(data);
      }
      setPromoForm({ name: '', description: '', condition_type: 'min_days', condition_value: '', reward_type: 'free_service', reward_service_id: '', reward_value: '' });
      setPromoEditing(null);
      setShowPromoForm(false);
      loadPromos();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Lỗi');
    } finally {
      setPromoSaving(false);
    }
  };

  const editPromo = (p: Promotion) => {
    setPromoForm({
      name: p.name, description: p.description || '',
      condition_type: p.condition_type, condition_value: String(p.condition_value),
      reward_type: p.reward_type, reward_service_id: p.reward_service_id ? String(p.reward_service_id) : '',
      reward_value: String(p.reward_value),
    });
    setPromoEditing(p.id);
    setShowPromoForm(true);
  };

  const deletePromo = async (id: number) => {
    if (!confirm('Xoá khuyến mãi này?')) return;
    await api.deletePromotion(id);
    loadPromos();
  };

  const togglePromo = async (p: Promotion) => {
    await api.updatePromotion(p.id, { is_active: !p.is_active });
    loadPromos();
  };

  if (loading) return <div className="animate-pulse text-teal-400 p-8">Đang tải...</div>;

  const tabs: { key: Tab; label: string; icon: typeof Home; count: number }[] = [
    { key: 'room-types', label: 'Loại phòng', icon: Home, count: roomTypes.length },
    { key: 'services', label: 'Dịch vụ', icon: Sparkles, count: templates.length },
    { key: 'promotions', label: 'Khuyến mãi', icon: Gift, count: promos.length },
    { key: 'invoices', label: 'Hoá đơn', icon: Receipt, count: invoices.filter((i: any) => i.grand_total > 0).length },
  ];

  // Total revenue from invoices
  const totalRevenue = invoices.reduce((s: number, i: any) => s + (i.grand_total || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Settings size={22} className="text-teal-400" /> Cài đặt dịch vụ & giá
          </h1>
          <p className="text-xs text-slate-400 mt-1">Quản lý loại phòng, dịch vụ, khuyến mãi và hoá đơn</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl mb-5 border border-slate-700/50 overflow-x-auto no-scrollbar">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              tab === t.key
                ? 'bg-teal-600/20 text-teal-300 border border-teal-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
            }`}>
            <t.icon size={14} />
            <span className="hidden sm:inline">{t.label}</span>
            {t.count > 0 && (
              <span className="bg-slate-700/60 text-[10px] px-1.5 py-0.5 rounded-full ml-0.5">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══ TAB 1: Loại phòng ═══ */}
      {tab === 'room-types' && (
        <div className="space-y-4">
          {/* Create/Edit form */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Tag size={14} className="text-teal-400" />
              {rtEditing ? 'Sửa loại phòng' : 'Thêm loại phòng mới'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" value={rtForm.name} onChange={e => setRtForm({ ...rtForm, name: e.target.value })}
                placeholder="Tên loại phòng (VIP, Suite, Standard...)"
                className="px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 focus:border-teal-500 focus:outline-none text-sm" />
              <div>
                <input type="number" min="1" value={rtForm.max_pets} onChange={e => setRtForm({ ...rtForm, max_pets: e.target.value })}
                  placeholder="Số pet tối đa"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 focus:border-teal-500 focus:outline-none text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                <p className="text-[10px] text-slate-500 mt-0.5">Số pet tối đa / phòng</p>
              </div>
            </div>

            {/* Dynamic Price Tiers */}
            <div className="mt-3">
              <p className="text-xs font-medium text-slate-400 mb-2">💰 Bảng giá</p>
              <div className="space-y-2">
                {rtTiers.map((tier, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input type="text" value={tier.label}
                      onChange={e => { const t = [...rtTiers]; t[i] = { ...t[i], label: e.target.value }; setRtTiers(t); }}
                      placeholder="Ví dụ: Chó nhỏ <5kg"
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700 focus:border-teal-500 focus:outline-none text-sm" />
                    <VNDInput value={tier.price}
                      onChange={v => { const t = [...rtTiers]; t[i] = { ...t[i], price: v }; setRtTiers(t); }}
                      placeholder="Giá/ngày"
                      className="w-32 px-3 pr-8 py-2 rounded-lg bg-slate-900/60 border border-slate-700 focus:border-teal-500 focus:outline-none text-sm" />
                    {rtTiers.length > 1 && (
                      <button onClick={() => setRtTiers(rtTiers.filter((_, idx) => idx !== i))}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={() => setRtTiers([...rtTiers, { label: '', price: '' }])}
                  className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 py-1">
                  <Plus size={12} /> Thêm mức giá
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1">
                <Palette size={12} className="text-slate-500" />
                <div className="flex gap-1">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setRtForm({ ...rtForm, color: c })}
                      className={`w-5 h-5 rounded-full border-2 transition-all ${rtForm.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={saveRoomType} disabled={rtSaving || !rtForm.name || !rtTiers.some(t => t.label && t.price)}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-1.5">
                <Save size={14} /> {rtEditing ? 'Cập nhật' : 'Thêm'}
              </button>
              {rtEditing && (
                <button onClick={() => { setRtEditing(null); setRtForm({ name: '', max_pets: '1', description: '', color: COLORS[0], icon: '🏠' }); setRtTiers([{ label: '', price: '' }]); }}
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-medium transition-colors">
                  Huỷ
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="space-y-2">
            {roomTypes.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Home size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Chưa có loại phòng nào. Hãy tạo loại phòng đầu tiên!</p>
              </div>
            ) : roomTypes.map(rt => (
              <div key={rt.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                rt.is_active ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-900/40 border-slate-800/30 opacity-60'
              }`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-3 h-8 rounded-full shrink-0" style={{ backgroundColor: rt.color }} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{rt.icon} {rt.name}</span>
                      {!rt.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">Ẩn</span>}
                    </div>
                    <p className="text-xs text-slate-400">
                      {rt.price_tiers && rt.price_tiers.length > 0 ? (
                        rt.price_tiers.map((t, i) => (
                          <span key={i}>{i > 0 ? ' · ' : ''}{t.label} {formatVND(t.price)}</span>
                        ))
                      ) : (
                        <span>{formatVND(rt.daily_rate)}/ngày</span>
                      )}
                      <span className="text-slate-500"> · {rt.max_pets ?? 1} pet/phòng</span>
                      {rt.room_count !== undefined && <span className="text-slate-500"> · {rt.room_count} phòng</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleRoomType(rt)} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 transition-colors"
                    title={rt.is_active ? 'Ẩn' : 'Hiện'}>
                    {rt.is_active ? <ToggleRight size={16} className="text-teal-400" /> : <ToggleLeft size={16} />}
                  </button>
                  <button onClick={() => editRoomType(rt)} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 transition-colors">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => { setDeleteConfirm({ id: rt.id, name: rt.name }); setDeleteError(''); }} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400/60 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Delete Confirmation Modal */}
          {deleteConfirm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setDeleteConfirm(null); setDeleteError(''); }}>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mx-auto mb-4">
                  <Trash2 size={24} className="text-red-400" />
                </div>
                <h3 className="text-center text-lg font-semibold text-white mb-1">Xoá loại phòng</h3>
                <p className="text-center text-sm text-slate-400 mb-4">
                  Bạn có chắc muốn xoá <span className="text-white font-medium">&ldquo;{deleteConfirm.name}&rdquo;</span>?
                  Hành động này không thể hoàn tác.
                </p>
                {deleteError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                    <p className="text-xs text-red-400">{deleteError}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => { setDeleteConfirm(null); setDeleteError(''); }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-medium transition-colors">
                    Huỷ
                  </button>
                  <button onClick={() => deleteRoomType(deleteConfirm.id)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-medium transition-colors">
                    Xoá
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB 2: Dịch vụ ═══ */}
      {tab === 'services' && (
        <div className="space-y-4">
          {/* Add form */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Sparkles size={14} className="text-teal-400" /> Thêm dịch vụ mới
            </h3>
            <div className="flex gap-2">
              <input type="text" value={svcForm.name} onChange={e => setSvcForm({ ...svcForm, name: e.target.value })}
                placeholder="Tên dịch vụ (Tắm spa, Cắt móng...)"
                className="flex-1 px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 focus:border-teal-500 focus:outline-none text-sm"
                onKeyDown={e => e.key === 'Enter' && addTemplate()} />
              <VNDInput value={svcForm.default_price} onChange={v => setSvcForm({ ...svcForm, default_price: v })}
                placeholder="Giá"
                className="w-32 px-3 pr-8 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 focus:border-teal-500 focus:outline-none text-sm"
                onKeyDown={e => e.key === 'Enter' && addTemplate()} />
              <button onClick={addTemplate} disabled={svcSaving || !svcForm.name || !svcForm.default_price}
                className="px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-1 shrink-0">
                <Plus size={14} /> Thêm
              </button>
            </div>
          </div>

          {/* List */}
          <div className="space-y-2">
            {templates.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Sparkles size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Chưa có dịch vụ nào</p>
              </div>
            ) : templates.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <Sparkles size={14} className="text-amber-400 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-slate-400">{formatVND(t.default_price)}</p>
                  </div>
                </div>
                <button onClick={() => deleteTemplate(t.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400/60 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TAB 3: Khuyến mãi ═══ */}
      {tab === 'promotions' && (
        <div className="space-y-4">
          {/* Add button */}
          {!showPromoForm && (
            <button onClick={() => setShowPromoForm(true)}
              className="w-full py-3 rounded-xl border-2 border-dashed border-slate-700 hover:border-teal-500/40 text-slate-400 hover:text-teal-400 text-sm font-medium transition-all flex items-center justify-center gap-2">
              <Plus size={16} /> Tạo khuyến mãi mới
            </button>
          )}

          {/* Create/Edit form */}
          {showPromoForm && (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Gift size={14} className="text-amber-400" />
                  {promoEditing ? 'Sửa khuyến mãi' : 'Tạo khuyến mãi mới'}
                </h3>
                <button onClick={() => { setShowPromoForm(false); setPromoEditing(null); }}
                  className="text-slate-400 hover:text-white"><X size={16} /></button>
              </div>

              <div className="space-y-3">
                <input type="text" value={promoForm.name} onChange={e => setPromoForm({ ...promoForm, name: e.target.value })}
                  placeholder="Tên khuyến mãi (VD: Gửi 5 ngày tặng 1 lần tắm)"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 focus:border-teal-500 focus:outline-none text-sm" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Condition */}
                  <div>
                    <label className="text-[11px] text-slate-500 mb-1 flex items-center gap-1">
                      <Calendar size={10} /> Điều kiện áp dụng
                    </label>
                    <div className="flex gap-2">
                      <select value={promoForm.condition_type} onChange={e => setPromoForm({ ...promoForm, condition_type: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700 text-sm focus:outline-none focus:border-teal-500">
                        <option value="min_days">Gửi tối thiểu (ngày)</option>
                        <option value="min_amount">Chi tối thiểu (VND)</option>
                        <option value="min_pets">Số pet tối thiểu</option>
                      </select>
                      {promoForm.condition_type === 'min_amount' ? (
                        <VNDInput value={promoForm.condition_value} onChange={v => setPromoForm({ ...promoForm, condition_value: v })}
                          placeholder="500,000"
                          className="w-28 px-3 pr-8 py-2 rounded-lg bg-slate-900/60 border border-slate-700 text-sm focus:outline-none focus:border-teal-500" />
                      ) : (
                        <input type="text" inputMode="numeric" value={promoForm.condition_value}
                          onChange={e => setPromoForm({ ...promoForm, condition_value: e.target.value.replace(/\D/g, '') })}
                          placeholder={promoForm.condition_type === 'min_days' ? '5' : '2'}
                          className="w-20 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700 text-sm focus:outline-none focus:border-teal-500" />
                      )}
                    </div>
                  </div>

                  {/* Reward */}
                  <div>
                    <label className="text-[11px] text-slate-500 mb-1 flex items-center gap-1">
                      <Award size={10} /> Phần thưởng
                    </label>
                    <div className="flex gap-2">
                      <select value={promoForm.reward_type} onChange={e => setPromoForm({ ...promoForm, reward_type: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700 text-sm focus:outline-none focus:border-teal-500">
                        <option value="free_service">Tặng dịch vụ miễn phí</option>
                        <option value="discount_percent">Giảm giá %</option>
                        <option value="discount_fixed">Giảm giá cố định (VND)</option>
                      </select>
                      {promoForm.reward_type === 'discount_fixed' ? (
                        <VNDInput value={promoForm.reward_value} onChange={v => setPromoForm({ ...promoForm, reward_value: v })}
                          placeholder="50,000"
                          className="w-28 px-3 pr-8 py-2 rounded-lg bg-slate-900/60 border border-slate-700 text-sm focus:outline-none focus:border-teal-500" />
                      ) : (
                        <input type="text" inputMode="numeric" value={promoForm.reward_value}
                          onChange={e => setPromoForm({ ...promoForm, reward_value: e.target.value.replace(/\D/g, '') })}
                          placeholder={promoForm.reward_type === 'free_service' ? '1' : '10'}
                          className="w-20 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700 text-sm focus:outline-none focus:border-teal-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Service selection for free_service */}
                {promoForm.reward_type === 'free_service' && templates.length > 0 && (
                  <div>
                    <label className="text-[11px] text-slate-500 mb-1 block">Chọn dịch vụ tặng</label>
                    <select value={promoForm.reward_service_id} onChange={e => setPromoForm({ ...promoForm, reward_service_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700 text-sm focus:outline-none focus:border-teal-500">
                      <option value="">-- Chọn dịch vụ --</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({formatVND(t.default_price)})</option>
                      ))}
                    </select>
                  </div>
                )}

                <input type="text" value={promoForm.description} onChange={e => setPromoForm({ ...promoForm, description: e.target.value })}
                  placeholder="Mô tả chi tiết (tuỳ chọn)"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 focus:border-teal-500 focus:outline-none text-sm" />

                <div className="flex gap-2">
                  <button onClick={savePromo} disabled={promoSaving || !promoForm.name || !promoForm.condition_value || !promoForm.reward_value}
                    className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-1.5">
                    <Save size={14} /> {promoEditing ? 'Cập nhật' : 'Tạo khuyến mãi'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* List */}
          <div className="space-y-2">
            {promos.length === 0 && !showPromoForm ? (
              <div className="text-center py-12 text-slate-500">
                <Gift size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Chưa có khuyến mãi nào</p>
                <p className="text-[11px] mt-1 text-slate-600">VD: Gửi 5 ngày tặng 1 lần tắm spa</p>
              </div>
            ) : promos.map(p => (
              <div key={p.id} className={`p-3 rounded-xl border transition-all ${
                p.is_active ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-900/40 border-slate-800/30 opacity-60'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Gift size={14} className="text-amber-400 shrink-0" />
                      <span className="font-medium text-sm">{p.name}</span>
                      {!p.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">Tắt</span>}
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                      <span className="inline-flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-full">
                        <Calendar size={10} />
                        {p.condition_type === 'min_days' && `≥ ${p.condition_value} ngày`}
                        {p.condition_type === 'min_amount' && `≥ ${formatVND(p.condition_value)}`}
                        {p.condition_type === 'min_pets' && `≥ ${p.condition_value} pet`}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">
                        {p.reward_type === 'free_service' && <><Sparkles size={10} /> Tặng {p.reward_value} lần {p.rewardService?.name || 'DV'}</>}
                        {p.reward_type === 'discount_percent' && <><Percent size={10} /> Giảm {p.reward_value}%</>}
                        {p.reward_type === 'discount_fixed' && <><BadgeDollarSign size={10} /> Giảm {formatVND(p.reward_value)}</>}
                      </span>
                    </div>
                    {p.description && <p className="text-[11px] text-slate-500 mt-1">{p.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => togglePromo(p)} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 transition-colors"
                      title={p.is_active ? 'Tắt' : 'Bật'}>
                      {p.is_active ? <ToggleRight size={16} className="text-teal-400" /> : <ToggleLeft size={16} />}
                    </button>
                    <button onClick={() => editPromo(p)} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 transition-colors">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => deletePromo(p.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400/60 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TAB 4: Hoá đơn ═══ */}
      {tab === 'invoices' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
              <p className="text-[11px] text-slate-500 mb-1">Tổng hoá đơn</p>
              <p className="text-lg font-bold text-teal-400">
                {invoices.filter((i: any) => i.grand_total > 0).length}
              </p>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
              <p className="text-[11px] text-slate-500 mb-1">Tổng doanh thu</p>
              <p className="text-lg font-bold text-teal-400">{formatVND(totalRevenue)}</p>
            </div>
          </div>

          {/* List */}
          {invoicesLoading ? (
            <div className="animate-pulse text-teal-400 text-center py-8">Đang tải hoá đơn...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Receipt size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Chưa có hoá đơn nào</p>
              <p className="text-[11px] mt-1 text-slate-600">Hoá đơn sẽ được tạo tự động khi checkout</p>
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.filter((b: any) => b.grand_total > 0).map((b: any) => (
                <Link key={b.id} href={`/dashboard/invoice/${b.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-teal-500/30 transition-all group">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Receipt size={13} className="text-teal-400 shrink-0" />
                      <span className="font-medium text-sm">{b.owner_name}</span>
                      {b.invoice_number && (
                        <span className="text-[10px] font-mono text-slate-500">{b.invoice_number}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{b.room?.room_name}</span>
                      <span>·</span>
                      <span>{b.pets?.map((p: any) => p.name).join(', ')}</span>
                      <span>·</span>
                      <span>{b.check_out_at ? new Date(b.check_out_at).toLocaleDateString('vi-VN') : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-teal-300">{formatVND(b.grand_total)}</span>
                    <Eye size={14} className="text-slate-500 group-hover:text-teal-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
