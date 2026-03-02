'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { TrendingUp, DollarSign, Calendar, Clock, Receipt, ArrowUpRight, Sparkles, Users, Home, Filter, X, RefreshCw, BarChart3, PieChart as PieChartIcon, Activity, Banknote, CalendarRange, LayoutGrid } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import dynamic from 'next/dynamic';

/* ═══════════════════════════════════════════════
   RECHARTS DYNAMIC IMPORTS (SSR-safe)
   ═══════════════════════════════════════════════ */

const RechartsArea = dynamic(() => import('recharts').then(m => {
  const { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } = m;
  return function ChartWrapper({ data, dataKey, color, gradientId }: { data: Record<string, any>[]; dataKey: string; color: string; gradientId: string }) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false}
            tickFormatter={(v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}tr` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
          <Tooltip cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }}
            contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(148,163,184,0.15)', borderRadius: '14px', padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: 6, fontWeight: 500 }}
            formatter={(value: any) => [formatVND(Number(value)), 'Doanh thu']}
            itemStyle={{ color: color, fontWeight: 700, fontSize: 14 }} />
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill={`url(#${gradientId})`} dot={false}
            activeDot={{ r: 6, fill: color, stroke: '#0f172a', strokeWidth: 3 }} />
        </AreaChart>
      </ResponsiveContainer>
    );
  };
}), { ssr: false, loading: () => <ChartSkeleton /> });

const RechartsPie = dynamic(() => import('recharts').then(m => {
  const { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } = m;
  return function PieWrapper({ data, colors }: { data: { name: string; value: number }[]; colors: string[] }) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={4} dataKey="value"
            stroke="none" label={(props: Record<string, any>) => `${props.name || ''} ${((props.percent || 0) * 100).toFixed(0)}%`}
            labelLine={{ stroke: '#475569', strokeWidth: 1 }}>
            {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(148,163,184,0.15)', borderRadius: '14px', padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            formatter={(value: any) => [formatVND(Number(value)), '']} />
        </PieChart>
      </ResponsiveContainer>
    );
  };
}), { ssr: false, loading: () => <ChartSkeleton height="h-48" /> });

const RechartsBar = dynamic(() => import('recharts').then(m => {
  const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } = m;
  return function BarWrapper({ data }: { data: Record<string, any>[] }) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false}
            tickFormatter={(v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}tr` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
          <Tooltip cursor={{ fill: 'rgba(148,163,184,0.06)' }}
            contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(148,163,184,0.15)', borderRadius: '14px', padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: 6, fontWeight: 500 }}
            formatter={(value: any, name?: string) => [formatVND(Number(value)), name === 'room' ? 'Phòng' : 'Dịch vụ']}
            itemStyle={{ fontWeight: 600, fontSize: 13 }} />
          <Bar dataKey="room" fill="url(#barGradRoom)" radius={[6, 6, 0, 0]} name="room" stackId="a" />
          <Bar dataKey="services" fill="url(#barGradSvc)" radius={[6, 6, 0, 0]} name="services" stackId="a" />
          <defs>
            <linearGradient id="barGradRoom" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#0d9488" stopOpacity={0.7} />
            </linearGradient>
            <linearGradient id="barGradSvc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#d97706" stopOpacity={0.7} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    );
  };
}), { ssr: false, loading: () => <ChartSkeleton /> });

/* ═══ SKELETON & HELPERS ═══ */
function ChartSkeleton({ height = 'h-52' }: { height?: string }) {
  return <div className={`${height} flex items-center justify-center`}><div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-400 rounded-full animate-spin" /></div>;
}
function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2 opacity-50">
      <Icon size={28} strokeWidth={1.5} className="text-slate-600" />
      <p className="text-xs text-slate-500">{text}</p>
    </div>
  );
}

function formatVND(n: number) { return n.toLocaleString('vi-VN') + 'đ'; }
function shortVND(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'tr';
  if (n >= 1000) return Math.round(n / 1000) + 'k';
  return n.toLocaleString('vi-VN');
}
function toDateStr(d: Date) { return d.toISOString().slice(0, 10); }

type PS = { total: number; room: number; services: number; count: number };
const MN: Record<string, string> = { '01':'Th1','02':'Th2','03':'Th3','04':'Th4','05':'Th5','06':'Th6','07':'Th7','08':'Th8','09':'Th9','10':'Th10','11':'Th11','12':'Th12' };

/* ═══ FILTER PRESETS ═══ */
type FP = 'all' | 'today' | '7d' | '30d' | 'this_month' | 'last_month' | 'this_quarter' | 'custom';
function presetRange(p: FP): { from?: string; to?: string; label: string } {
  const now = new Date(); const td = toDateStr(now);
  switch (p) {
    case 'today': return { from: td, to: td, label: 'Hôm nay' };
    case '7d': { const d = new Date(now); d.setDate(d.getDate() - 6); return { from: toDateStr(d), to: td, label: '7 ngày qua' }; }
    case '30d': { const d = new Date(now); d.setDate(d.getDate() - 29); return { from: toDateStr(d), to: td, label: '30 ngày qua' }; }
    case 'this_month': { const s = new Date(now.getFullYear(), now.getMonth(), 1); return { from: toDateStr(s), to: td, label: 'Tháng này' }; }
    case 'last_month': { const s = new Date(now.getFullYear(), now.getMonth() - 1, 1); const e = new Date(now.getFullYear(), now.getMonth(), 0); return { from: toDateStr(s), to: toDateStr(e), label: 'Tháng trước' }; }
    case 'this_quarter': { const q = Math.floor(now.getMonth() / 3) * 3; const s = new Date(now.getFullYear(), q, 1); return { from: toDateStr(s), to: td, label: 'Quý này' }; }
    default: return { label: 'Tất cả thời gian' };
  }
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function RevenuePage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<FP>('all');
  const [cfrom, setCfrom] = useState('');
  const [cto, setCto] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const fetchData = useCallback((from?: string, to?: string) => {
    setLoading(true);
    api.getRevenueStats(from, to).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const doPreset = (p: FP) => {
    setPreset(p); setShowCustom(p === 'custom');
    if (p === 'custom') return;
    const r = presetRange(p); fetchData(r.from, r.to);
  };
  const doCustom = () => { if (cfrom && cto) { setPreset('custom'); fetchData(cfrom, cto); } };
  const doReset = () => { setPreset('all'); setShowCustom(false); setCfrom(''); setCto(''); fetchData(); };

  const monthly = useMemo(() => {
    if (!data?.monthly) return [];
    return data.monthly.map((m: Record<string, any>) => ({
      label: MN[m.month?.slice(5)] || m.month?.slice(5), total: m.total, room: m.room || 0, services: m.services || 0,
    }));
  }, [data?.monthly]);

  const pie = useMemo(() => {
    if (!data?.all_time || data.all_time.total === 0) return [];
    return [{ name: 'Phòng', value: data.all_time.room }, { name: 'Dịch vụ', value: data.all_time.services }];
  }, [data?.all_time]);

  if (user?.role !== 'owner') return <div className="text-slate-500">Chỉ owner mới truy cập được.</div>;

  const fLabel = preset === 'custom' && cfrom && cto ? `${cfrom} → ${cto}` : presetRange(preset).label;
  const s = data || { today:{total:0,room:0,services:0,count:0}, week:{total:0,room:0,services:0,count:0}, month:{total:0,room:0,services:0,count:0}, all_time:{total:0,room:0,services:0,count:0}, by_room_type:[], top_services:[], monthly:[], recent_bookings:[] };

  return (
    <div className="max-w-[1100px] relative">
      {/* Background glow effects */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-20 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <TrendingUp size={18} className="text-white" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Quản lý doanh thu
            </h1>
          </div>
          <p className="text-xs text-slate-500 ml-[46px]">Thống kê chi tiết doanh thu phòng và dịch vụ phát sinh</p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-xs text-teal-400/70">
            <div className="w-4 h-4 border-2 border-teal-400/40 border-t-teal-400 rounded-full animate-spin" />
            Đang tải...
          </div>
        )}
      </div>

      {/* ═══ FILTER BAR ═══ */}
      <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-r from-slate-800/60 to-slate-800/30 backdrop-blur-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-slate-700/60 flex items-center justify-center">
              <Filter size={12} className="text-slate-400" />
            </div>
            <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Bộ lọc</span>
          </div>
          {preset !== 'all' && (
            <button onClick={doReset} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <X size={11} /> Reset
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            { k: 'all' as FP, l: 'Tất cả', icon: LayoutGrid },
            { k: 'today' as FP, l: 'Hôm nay', icon: Clock },
            { k: '7d' as FP, l: '7 ngày', icon: null },
            { k: '30d' as FP, l: '30 ngày', icon: null },
            { k: 'this_month' as FP, l: 'Tháng này', icon: Calendar },
            { k: 'last_month' as FP, l: 'Tháng trước', icon: null },
            { k: 'this_quarter' as FP, l: 'Quý này', icon: null },
            { k: 'custom' as FP, l: 'Tuỳ chọn', icon: CalendarRange },
          ]).map(f => (
            <button key={f.k} onClick={() => doPreset(f.k)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                preset === f.k
                  ? 'bg-gradient-to-r from-teal-500/25 to-emerald-500/15 text-teal-300 border border-teal-500/30 shadow-lg shadow-teal-500/10'
                  : 'bg-slate-900/40 text-slate-400 border border-slate-700/40 hover:bg-slate-700/40 hover:text-slate-200 hover:border-slate-600'
              }`}>
              {f.icon && <f.icon size={12} className="shrink-0" />} {f.l}
            </button>
          ))}
        </div>
        {showCustom && (
          <div className="flex flex-wrap items-end gap-3 mt-4 pt-4 border-t border-slate-700/40">
            <div>
              <label className="text-[10px] text-slate-500 font-medium mb-1 block">Từ ngày</label>
              <input type="date" value={cfrom} onChange={e => setCfrom(e.target.value)}
                className="bg-slate-900/60 border border-slate-600/50 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-medium mb-1 block">Đến ngày</label>
              <input type="date" value={cto} onChange={e => setCto(e.target.value)}
                className="bg-slate-900/60 border border-slate-600/50 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all" />
            </div>
            <button onClick={doCustom} disabled={!cfrom || !cto}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-teal-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5">
              <RefreshCw size={12} /> Áp dụng
            </button>
          </div>
        )}
        {preset !== 'all' && (
          <div className="mt-3 px-3 py-1.5 rounded-lg bg-teal-500/8 border border-teal-500/15 inline-flex items-center gap-1.5 text-[11px] text-teal-400">
            <Activity size={11} /> Đang xem: <span className="font-semibold">{fLabel}</span>
          </div>
        )}
      </div>

      {/* ═══ KPI CARDS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {[
          { id: 'today', label: 'Hôm nay', stat: s.today as PS, icon: Clock, gradient: 'from-teal-500 to-emerald-600', glow: 'shadow-teal-500/15', accent: 'text-teal-400', ring: 'ring-teal-500/20' },
          { id: 'week', label: 'Tuần này', stat: s.week as PS, icon: Calendar, gradient: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-500/15', accent: 'text-blue-400', ring: 'ring-blue-500/20' },
          { id: 'month', label: 'Tháng này', stat: s.month as PS, icon: BarChart3, gradient: 'from-purple-500 to-violet-600', glow: 'shadow-purple-500/15', accent: 'text-purple-400', ring: 'ring-purple-500/20' },
          { id: 'total', label: preset !== 'all' ? fLabel : 'Tổng cộng', stat: s.all_time as PS, icon: Banknote, gradient: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/15', accent: 'text-amber-400', ring: 'ring-amber-500/20' },
        ].map(({ id, label, stat, icon: Icon, gradient, glow, accent, ring }) => (
          <div key={id} className={`group rounded-2xl border border-slate-700/40 bg-gradient-to-br from-slate-800/80 to-slate-900/60 p-4 md:p-5 transition-all duration-300 hover:border-slate-600/50 hover:shadow-xl ${glow} hover:scale-[1.02] ring-1 ${ring}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] text-slate-500 font-medium tracking-wide">{label}</span>
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${glow} group-hover:scale-110 transition-transform`}>
                <Icon size={14} className="text-white" />
              </div>
            </div>
            <p className={`text-2xl md:text-3xl font-extrabold ${accent} tracking-tight`}>{shortVND(stat.total)}</p>
            <div className="flex items-center gap-3 mt-2.5">
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Users size={9} /> {stat.count} đơn
              </span>
              {stat.services > 0 && (
                <span className="text-[10px] text-amber-400/60 flex items-center gap-1">
                  <Sparkles size={9} /> {shortVND(stat.services)} DV
                </span>
              )}
            </div>
            {/* Mini progress bar */}
            {stat.total > 0 && (
              <div className="mt-3 h-1 rounded-full bg-slate-700/50 overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
                  style={{ width: `${Math.min(100, (stat.room / stat.total) * 100)}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ═══ CHARTS ROW ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        {/* Area Chart — 3/5 */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-700/40 bg-gradient-to-br from-slate-800/60 to-slate-900/40 p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                <Activity size={13} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">Xu hướng doanh thu</h3>
                <p className="text-[10px] text-slate-500">6 tháng gần nhất</p>
              </div>
            </div>
          </div>
          <div className="h-56 md:h-64">
            {monthly.length > 0 ? (
              <RechartsArea data={monthly} dataKey="total" color="#2dd4bf" gradientId="revGrad" />
            ) : <EmptyState icon={TrendingUp} text="Chưa có dữ liệu doanh thu" />}
          </div>
        </div>

        {/* Pie Chart — 2/5 */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-700/40 bg-gradient-to-br from-slate-800/60 to-slate-900/40 p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
              <PieChartIcon size={13} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">Cơ cấu doanh thu</h3>
              <p className="text-[10px] text-slate-500">Phòng vs Dịch vụ</p>
            </div>
          </div>
          <div className="h-48">
            {pie.length > 0 ? (
              <RechartsPie data={pie} colors={['#2dd4bf', '#fbbf24']} />
            ) : <EmptyState icon={PieChartIcon} text="Chưa có dữ liệu" />}
          </div>
          {s.all_time.total > 0 && (
            <div className="flex justify-center gap-5 mt-3">
              {[
                { label: 'Phòng', color: 'bg-teal-400', pct: Math.round((s.all_time.room / s.all_time.total) * 100) },
                { label: 'Dịch vụ', color: 'bg-amber-400', pct: Math.round((s.all_time.services / s.all_time.total) * 100) },
              ].map(x => (
                <div key={x.label} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${x.color}`} />
                  <span className="text-[11px] text-slate-400">{x.label} <span className="font-semibold text-slate-300">{x.pct}%</span></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ STACKED BAR ═══ */}
      {monthly.length > 0 && (
        <div className="rounded-2xl border border-slate-700/40 bg-gradient-to-br from-slate-800/60 to-slate-900/40 p-5 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <BarChart3 size={13} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">So sánh Phòng vs Dịch vụ</h3>
                <p className="text-[10px] text-slate-500">Phân bổ doanh thu theo tháng</p>
              </div>
            </div>
            <div className="flex gap-4">
              {[
                { label: 'Tiền phòng', color: 'bg-teal-400' },
                { label: 'Dịch vụ', color: 'bg-amber-400' },
              ].map(x => (
                <div key={x.label} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-sm ${x.color}`} />
                  <span className="text-[10px] text-slate-500">{x.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-52 md:h-60"><RechartsBar data={monthly} /></div>
        </div>
      )}

      {/* ═══ BOTTOM GRID ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Room Types */}
        <div className="rounded-2xl border border-slate-700/40 bg-gradient-to-br from-slate-800/60 to-slate-900/40 p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Home size={13} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">Theo loại phòng</h3>
          </div>
          {s.by_room_type?.length > 0 ? (
            <div className="space-y-3">
              {s.by_room_type.map((r: Record<string, any>) => {
                const max = Math.max(...s.by_room_type.map((x: Record<string, any>) => x.total), 1);
                return (
                  <div key={r.room_type}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-300 capitalize">{r.room_type}</span>
                      <span className="text-xs text-teal-400 font-bold">{formatVND(r.total)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-700/40 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-teal-400 transition-all duration-700 ease-out"
                        style={{ width: `${(r.total / max) * 100}%` }} />
                    </div>
                    <p className="text-[9px] text-slate-600 mt-1">{r.count} đơn hoàn thành</p>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState icon={Home} text="Chưa có dữ liệu phòng" />}
        </div>

        {/* Top Services */}
        <div className="rounded-2xl border border-slate-700/40 bg-gradient-to-br from-slate-800/60 to-slate-900/40 p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Sparkles size={13} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">Top dịch vụ</h3>
          </div>
          {s.top_services?.length > 0 ? (
            <div className="space-y-2.5">
              {s.top_services.slice(0, 6).map((sv: Record<string, any>, i: number) => (
                <div key={sv.name} className="flex items-center gap-3 group">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                    i === 0 ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-amber-900'
                    : i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800'
                    : i === 2 ? 'bg-gradient-to-br from-orange-400 to-amber-500 text-orange-900'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate group-hover:text-amber-300 transition-colors">{sv.name}</p>
                    <p className="text-[9px] text-slate-600">×{sv.count} lần sử dụng</p>
                  </div>
                  <span className="text-xs text-amber-300 font-bold shrink-0">{shortVND(sv.total)}</span>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={Sparkles} text="Chưa có dịch vụ phát sinh" />}
        </div>

        {/* Recent Invoices */}
        <div className="rounded-2xl border border-slate-700/40 bg-gradient-to-br from-slate-800/60 to-slate-900/40 p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Receipt size={13} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">Hoá đơn gần đây</h3>
          </div>
          {s.recent_bookings?.length > 0 ? (
            <div className="space-y-1">
              {s.recent_bookings.slice(0, 6).map((b: Record<string, any>) => (
                <Link key={b.id} href={`/dashboard/invoice/${b.id}`}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-700/30 transition-all group">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate group-hover:text-teal-300 transition-colors">{b.room_name} — {b.pets}</p>
                    <p className="text-[9px] text-slate-600">{b.check_out_at ? new Date(b.check_out_at).toLocaleDateString('vi-VN') : ''}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <p className="text-xs font-bold text-teal-300">{shortVND(b.grand_total)}</p>
                    <ArrowUpRight size={11} className="text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          ) : <EmptyState icon={Receipt} text="Chưa có hoá đơn nào" />}
        </div>
      </div>
    </div>
  );
}
