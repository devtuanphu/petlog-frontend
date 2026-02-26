'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { ArrowLeft, CreditCard, Check, Package, Plus, Minus, ShieldCheck, Sparkles } from 'lucide-react';

const fmt = (n: number) => n.toLocaleString('vi-VN') + 'đ';

function CheckoutContent() {
  const router = useRouter();
  const { subscription } = useAuth();
  const searchParams = useSearchParams();

  const planName = searchParams.get('plan') || '';
  const months = parseInt(searchParams.get('months') || '1');
  const isUpgrade = searchParams.get('upgrade') === 'true';

  const [plan, setPlan] = useState<{ name: string; display_name: string; price: number; max_rooms: number; description: string } | null>(null);
  const [extraRooms, setExtraRooms] = useState(0);
  const [extraRoomPrice, setExtraRoomPrice] = useState(10000);
  const [upgradeCalc, setUpgradeCalc] = useState<{ amount: number; days_remaining: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  // Fetch plan data, extra room price, and upgrade calc
  useEffect(() => {
    const load = async () => {
      try {
        const [plans, ep] = await Promise.all([
          api.getPlans(),
          api.getExtraRoomPrice(),
        ]);
        const found = plans.find((p: { name: string }) => p.name === planName);
        setPlan(found || null);
        setExtraRoomPrice(ep.price);

        if (isUpgrade && planName) {
          const calc = await api.calculateUpgrade(planName);
          setUpgradeCalc({ amount: calc.amount, days_remaining: calc.days_remaining });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [planName, isUpgrade]);

  // Calculate costs
  const discount = months === 12 ? 0.9 : 1;
  const planCost = isUpgrade
    ? (upgradeCalc?.amount || 0)
    : Math.ceil((plan?.price || 0) * months * discount);

  const daysForExtra = isUpgrade
    ? (upgradeCalc?.days_remaining || 30)
    : months * 30;

  const extraCost = isUpgrade
    ? Math.ceil(extraRooms * extraRoomPrice * (daysForExtra / 30) / 1000) * 1000
    : extraRooms * extraRoomPrice * months;

  const totalAmount = planCost + extraCost;
  const totalRooms = (plan?.max_rooms || 0) + extraRooms;

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await api.createPayment(planName, isUpgrade ? 0 : months, isUpgrade, extraRooms);
      window.location.href = res.checkoutUrl;
    } catch (err: unknown) {
      const e = err as Error;
      alert(e.message || 'Lỗi tạo thanh toán');
      setPaying(false);
    }
  };

  if (!planName) {
    router.push('/dashboard/pricing');
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <div className="animate-pulse text-teal-400">Đang tải...</div>
      </div>
    );
  }

  if (!plan) {
    router.push('/dashboard/pricing');
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <button
        onClick={() => router.push('/dashboard/pricing')}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Quay lại chọn gói
      </button>

      <h1 className="text-2xl font-bold mb-1">Xác nhận đơn hàng</h1>
      <p className="text-slate-400 mb-8 text-sm">Kiểm tra đơn hàng và thêm tuỳ chọn trước khi thanh toán</p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Order items (3 cols) */}
        <div className="lg:col-span-3 space-y-4">

          {/* Selected plan card */}
          <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-teal-400 mb-3">
              <Package size={14} />
              GÓI ĐÃ CHỌN
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">{plan.display_name}</h3>
                <p className="text-sm text-slate-400 mt-0.5">
                  {isUpgrade ? (
                    <>Nâng cấp từ <strong className="text-slate-300">{subscription?.plan}</strong> • {upgradeCalc?.days_remaining || 0} ngày còn lại</>
                  ) : (
                    <>{months} tháng{months === 12 ? ' (giảm 10%)' : ''}</>
                  )}
                </p>
                <p className="text-xs text-slate-500 mt-1">{plan.max_rooms} phòng cơ bản • {plan.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{fmt(planCost)}</p>
                {!isUpgrade && months > 1 && (
                  <p className="text-[11px] text-slate-500">{fmt(plan.price)}/tháng</p>
                )}
              </div>
            </div>
          </div>

          {/* Add-on: Extra Rooms */}
          <div className={`rounded-2xl border p-5 transition-all ${
            extraRooms > 0
              ? 'border-purple-500/40 bg-purple-500/5'
              : 'border-slate-700 bg-slate-800/30'
          }`}>
            <div className="flex items-center gap-2 text-xs font-medium text-purple-400 mb-3">
              <Sparkles size={14} />
              TUỲ CHỌN THÊM
            </div>

            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold">Phòng bổ sung</h3>
                <p className="text-sm text-slate-400 mt-0.5">
                  Mở rộng vượt giới hạn gói • {fmt(extraRoomPrice)}/phòng/tháng
                </p>
              </div>
              {extraRooms > 0 && (
                <div className="text-right">
                  <p className="text-xl font-bold text-purple-400">+{fmt(extraCost)}</p>
                </div>
              )}
            </div>

            {/* Compact input row */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0 flex-1">
                <button
                  onClick={() => setExtraRooms(Math.max(0, extraRooms - 1))}
                  className="h-10 w-10 rounded-l-xl bg-slate-800 border border-slate-600 border-r-0 hover:bg-slate-700 flex items-center justify-center transition-colors"
                >
                  <Minus size={14} className="text-slate-400" />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={extraRooms || ''}
                  onChange={e => {
                    const v = e.target.value.replace(/[^0-9]/g, '');
                    setExtraRooms(parseInt(v) || 0);
                  }}
                  placeholder="0"
                  className="h-10 w-full bg-slate-800 border-y border-slate-600 text-center text-lg font-bold focus:outline-none focus:border-purple-500 transition-colors placeholder:text-slate-600 placeholder:font-normal"
                />
                <button
                  onClick={() => setExtraRooms(extraRooms + 1)}
                  className="h-10 w-10 rounded-r-xl bg-slate-800 border border-slate-600 border-l-0 hover:bg-slate-700 flex items-center justify-center transition-colors"
                >
                  <Plus size={14} className="text-slate-400" />
                </button>
              </div>
              <span className="text-xs text-slate-500 whitespace-nowrap">phòng</span>
            </div>

            {/* Quick select chips */}
            <div className="flex gap-2 mt-3">
              {[0, 5, 10, 20, 50].map(n => (
                <button
                  key={n}
                  onClick={() => setExtraRooms(n)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    extraRooms === n
                      ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {n === 0 ? 'Không' : `+${n}`}
                </button>
              ))}
            </div>

            {extraRooms > 0 && (
              <p className="text-xs text-purple-300/70 mt-3">
                Tổng phòng sau khi mua: <strong className="text-white">{totalRooms} phòng</strong>
                <span className="text-slate-500"> ({plan.max_rooms} gói + {extraRooms} thêm)</span>
              </p>
            )}
          </div>
        </div>

        {/* Right: Order summary (2 cols) */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-700 bg-slate-800/50 overflow-hidden sticky top-6">
            <div className="p-5 border-b border-slate-700">
              <h3 className="font-bold text-sm mb-4">TÓM TẮT ĐƠN HÀNG</h3>

              {/* Line items */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{plan.display_name} {isUpgrade ? '(nâng cấp)' : `× ${months}T`}</span>
                  <span>{fmt(planCost)}</span>
                </div>

                {extraRooms > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-400">+{extraRooms} phòng bổ sung</span>
                    <span className="text-purple-300">{fmt(extraCost)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 bg-slate-900/30">
              {/* Total rooms */}
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Tổng phòng</span>
                <span className="font-semibold">{totalRooms} phòng</span>
              </div>
              {isUpgrade && upgradeCalc && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Còn lại</span>
                  <span>{upgradeCalc.days_remaining} ngày</span>
                </div>
              )}
              {!isUpgrade && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Thời hạn</span>
                  <span>{months} tháng</span>
                </div>
              )}

              {/* Total */}
              <div className="border-t border-slate-700 pt-3 mt-3">
                <div className="flex justify-between items-end">
                  <span className="font-bold">Tổng thanh toán</span>
                  <span className="text-2xl font-bold text-teal-400">{fmt(totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Pay button */}
            <div className="p-5 pt-0 bg-slate-900/30">
              <button
                onClick={handlePay}
                disabled={paying || totalAmount <= 0}
                className="w-full py-4 rounded-xl font-bold text-base bg-teal-600 hover:bg-teal-500 text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-600/20"
              >
                {paying ? (
                  <span className="animate-pulse">Đang chuyển đến PayOS...</span>
                ) : (
                  <><CreditCard size={18} /> Thanh toán {fmt(totalAmount)}</>
                )}
              </button>

              {/* Security */}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-3 justify-center">
                <ShieldCheck size={12} />
                Thanh toán an toàn qua PayOS
              </div>
            </div>
          </div>

          {/* Benefits below summary */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { icon: Check, label: 'Kích hoạt ngay' },
              { icon: ShieldCheck, label: 'Bảo mật' },
              { icon: Sparkles, label: 'Hỗ trợ 24/7' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="text-center p-2.5 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <Icon size={14} className="mx-auto mb-1 text-teal-400" />
                <p className="text-[10px] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-teal-400 py-20 text-center">Đang tải...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
