'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Crown, Check, Zap, Star, Clock, CreditCard, ArrowUp } from 'lucide-react';

type Plan = {
  id: number;
  name: string;
  display_name: string;
  price: number;
  max_rooms: number;
  description: string;
};

type PaymentRecord = {
  id: number;
  order_code: number;
  amount: number;
  plan_name: string;
  months: number;
  status: string;
  created_at: string;
  paid_at: string | null;
};

type UpgradeCalc = {
  type: 'new' | 'upgrade';
  current_plan: string;
  new_plan: string;
  new_plan_display: string;
  new_price: number;
  current_price: number;
  days_remaining: number;
  total_days: number;
  prorated_amount: number;
  amount: number;
  expires_at?: string;
  message: string;
};

const planIcons: Record<string, typeof Crown> = {
  basic: Zap,
  pro: Star,
  unlimited: Crown,
};

export default function PricingPage() {
  const { subscription } = useAuth();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [months, setMonths] = useState(1);
  const [upgradeCalc, setUpgradeCalc] = useState<UpgradeCalc | null>(null);
  const [calcLoading, setCalcLoading] = useState<string | null>(null);
  const status = searchParams.get('status');

  const isPaid = subscription?.plan && subscription.plan !== 'trial' && subscription.plan !== 'free';

  useEffect(() => {
    Promise.all([api.getPlans(), api.getPayments()])
      .then(([p, h]) => { setPlans(p); setPayments(h); })
      .finally(() => setLoading(false));
  }, []);

  // Check payment return
  useEffect(() => {
    const orderCode = searchParams.get('orderCode');
    if (orderCode) {
      api.checkPayment(orderCode).catch(() => {});
    }
  }, [searchParams]);

  // Calculate upgrade cost when hovering/selecting a plan (for paid users)
  const calcUpgrade = useCallback(async (planName: string) => {
    if (!isPaid || planName === subscription?.plan) return;
    setCalcLoading(planName);
    try {
      const calc = await api.calculateUpgrade(planName);
      setUpgradeCalc(calc);
    } catch {
      setUpgradeCalc(null);
    } finally {
      setCalcLoading(null);
    }
  }, [isPaid, subscription?.plan]);

  const handlePay = async (planName: string) => {
    setPaying(planName);
    try {
      if (isPaid && planName !== subscription?.plan) {
        // Upgrade flow
        const res = await api.createPayment(planName, 0, true);
        if (res.amount === 0) {
          // Free upgrade
          window.location.href = res.checkoutUrl;
        } else {
          window.location.href = res.checkoutUrl;
        }
      } else {
        // Normal purchase
        const res = await api.createPayment(planName, months);
        window.location.href = res.checkoutUrl;
      }
    } catch (err: unknown) {
      const e = err as Error;
      alert(e.message || 'Lỗi tạo thanh toán');
      setPaying(null);
    }
  };

  const isTrialExpired = subscription?.plan === 'trial' &&
    subscription?.trial_ends_at &&
    new Date(subscription.trial_ends_at) < new Date();

  const trialDaysLeft = subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  if (loading) return <div className="animate-pulse text-teal-400">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Nâng cấp gói</h1>
      <p className="text-slate-400 mb-6">Chọn gói phù hợp với cửa hàng của bạn</p>

      {/* Status banner */}
      {status === 'success' && (
        <div className="mb-6 p-4 rounded-xl bg-green-500/20 border border-green-500/30 text-green-300 flex items-center gap-3">
          <Check size={20} /> Thanh toán thành công! Gói của bạn đã được kích hoạt.
        </div>
      )}
      {status === 'cancel' && (
        <div className="mb-6 p-4 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 flex items-center gap-3">
          <Clock size={20} /> Thanh toán bị huỷ. Bạn có thể thử lại.
        </div>
      )}

      {/* Current plan info */}
      <div className="mb-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Gói hiện tại</p>
            <p className="text-lg font-bold text-teal-300">
              {isPaid ? plans.find(p => p.name === subscription?.plan)?.display_name || subscription?.plan : 'Dùng thử'}
            </p>
          </div>
          <div className="text-right">
            {subscription?.plan === 'trial' && !isTrialExpired && (
              <p className="text-sm text-yellow-400"><Clock size={14} className="inline mr-1" />Còn {trialDaysLeft} ngày dùng thử</p>
            )}
            {isTrialExpired && (
              <p className="text-sm text-red-400 font-medium">⚠️ Đã hết thời gian dùng thử</p>
            )}
            {isPaid && subscription?.expires_at && (
              <p className="text-sm text-slate-400">Hết hạn: {new Date(subscription.expires_at).toLocaleDateString('vi-VN')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Duration selector — only for new purchases, not upgrades */}
      {!isPaid && (
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-slate-400">Thời hạn:</span>
          {[
            { value: 1, label: '1 tháng' },
            { value: 3, label: '3 tháng' },
            { value: 6, label: '6 tháng' },
            { value: 12, label: '12 tháng', badge: '-10%' },
          ].map(opt => (
            <button key={opt.value} onClick={() => setMonths(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors relative ${
                months === opt.value
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}>
              {opt.label}
              {opt.badge && (
                <span className="absolute -top-2 -right-2 text-[10px] bg-orange-500 text-white px-1.5 rounded-full">{opt.badge}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Upgrade notice for paid users */}
      {isPaid && (
        <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
          <p className="text-sm text-blue-300">
            <ArrowUp size={14} className="inline mr-1" />
            Bạn đang dùng gói trả phí. Khi nâng cấp, bạn chỉ trả <strong>chênh lệch</strong> cho số ngày còn lại. Ngày hết hạn giữ nguyên.
          </p>
        </div>
      )}

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {plans.map((plan) => {
          const Icon = planIcons[plan.name] || Zap;
          const isCurrent = subscription?.plan === plan.name;
          const isLower = isPaid && (plans.findIndex(p => p.name === plan.name) < plans.findIndex(p => p.name === subscription?.plan));
          const discount = months === 12 ? 0.9 : 1;
          const totalPrice = plan.price * months * discount;
          const isPopular = plan.name === 'pro';
          const isUpgradeTarget = isPaid && !isCurrent && !isLower && upgradeCalc?.new_plan === plan.name;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 border transition-all ${
                isPopular ? 'bg-gradient-to-b from-teal-900/30 to-slate-800/50 border-teal-500/50 scale-105' : 'bg-slate-800/50 border-slate-700'
              }`}
              onMouseEnter={() => isPaid && !isCurrent && !isLower && calcUpgrade(plan.name)}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                  PHỔ BIẾN NHẤT
                </div>
              )}

              <div className="text-center mb-6">
                <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 ${
                  isPopular ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-700 text-slate-300'
                }`}>
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-bold">{plan.display_name}</h3>
                <p className="text-sm text-slate-400 mt-1">{plan.description}</p>
              </div>

              <div className="text-center mb-6">
                <p className="text-3xl font-bold">{(plan.price / 1000).toFixed(0)}k</p>
                <p className="text-sm text-slate-400">/tháng</p>
                {!isPaid && months > 1 && (
                  <p className="text-sm text-teal-400 mt-1">
                    Tổng: {(totalPrice / 1000).toFixed(0)}k cho {months} tháng
                  </p>
                )}
                {/* Show prorated upgrade cost */}
                {isUpgradeTarget && upgradeCalc && (
                  <div className="mt-3 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm text-blue-300 font-medium">
                      Chỉ trả: {(upgradeCalc.amount / 1000).toFixed(0)}k
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      ({upgradeCalc.days_remaining} ngày còn lại)
                    </p>
                  </div>
                )}
                {calcLoading === plan.name && (
                  <p className="text-xs text-slate-500 mt-2 animate-pulse">Đang tính...</p>
                )}
              </div>

              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm">
                  <Check size={14} className="text-teal-400" />
                  <span>Tối đa <strong>{plan.max_rooms}</strong> phòng</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check size={14} className="text-teal-400" />
                  <span>Quản lý booking</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check size={14} className="text-teal-400" />
                  <span>QR check-in</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check size={14} className="text-teal-400" />
                  <span>Nhật ký thú cưng</span>
                </li>
              </ul>

              <button
                onClick={() => handlePay(plan.name)}
                disabled={isCurrent || isLower || paying === plan.name}
                className={`w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                  isCurrent
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : isLower
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : isPopular
                        ? 'bg-teal-600 hover:bg-teal-500 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}>
                {paying === plan.name ? (
                  'Đang xử lý...'
                ) : isCurrent ? (
                  'Gói hiện tại'
                ) : isLower ? (
                  'Không thể hạ gói'
                ) : isPaid ? (
                  <><ArrowUp size={16} /> Nâng cấp</>
                ) : (
                  <><CreditCard size={16} /> Thanh toán</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Payment history */}
      {payments.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4">Lịch sử thanh toán</h2>
          <div className="rounded-xl overflow-hidden border border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800">
                  <th className="text-left p-3 text-slate-400">Ngày</th>
                  <th className="text-left p-3 text-slate-400">Gói</th>
                  <th className="text-left p-3 text-slate-400">Loại</th>
                  <th className="text-right p-3 text-slate-400">Số tiền</th>
                  <th className="text-center p-3 text-slate-400">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-t border-slate-800">
                    <td className="p-3">{new Date(p.created_at).toLocaleDateString('vi-VN')}</td>
                    <td className="p-3">{p.plan_name}</td>
                    <td className="p-3">{p.months === 0 ? '↗️ Nâng cấp' : `${p.months} tháng`}</td>
                    <td className="p-3 text-right">{(p.amount / 1000).toFixed(0)}k</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        p.status === 'paid'
                          ? 'bg-green-500/20 text-green-400'
                          : p.status === 'cancelled'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {p.status === 'paid' ? 'Đã TT' : p.status === 'cancelled' ? 'Đã huỷ' : 'Chờ TT'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
