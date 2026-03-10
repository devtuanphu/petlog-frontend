'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Crown, Zap, Star, Check, X } from 'lucide-react';

type Plan = {
  id: number;
  name: string;
  display_name: string;
  price: number;
  max_rooms: number;
  description: string;
};

const planIcons: Record<string, typeof Crown> = {
  free: Check,
  basic: Zap,
  pro: Star,
  unlimited: Crown,
};

const fmt = (n: number) => n.toLocaleString('vi-VN') + 'đ';

interface PlanSelectionModalProps {
  onDismiss: () => void;
}

export default function PlanSelectionModal({ onDismiss }: PlanSelectionModalProps) {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    fetch(`${API_URL}/payment/plans`)
      .then(r => r.json())
      .then((data: Plan[]) => {
        setPlans(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [API_URL]);

  const handleSelect = (plan: Plan) => {
    setSelectedPlan(plan.name);
    setError('');
  };

  const handleConfirm = async () => {
    if (!selectedPlan) return;
    const plan = plans.find(p => p.name === selectedPlan);
    if (!plan) return;

    setConfirming(true);
    setError('');

    try {
      if (plan.price === 0) {
        // Free plan — call selectPlan API to activate + create rooms
        const token = api.getToken();
        const res = await fetch(`${API_URL}/payment/select-plan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ plan: plan.name }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Không thể chọn gói');
        window.location.reload();
      } else {
        // Paid plan — go to checkout
        const params = new URLSearchParams({
          plan: plan.name,
          months: '1',
          upgrade: 'false',
        });
        router.push(`/dashboard/pricing/checkout?${params.toString()}`);
      }
    } catch (err: unknown) {
      setError((err as Error).message);
      setConfirming(false);
    }
  };

  const features: Record<string, string[]> = {
    free: ['Quản lý phòng & loại phòng', 'QR check-in', 'Nhật ký chăm sóc', 'Thống kê cơ bản'],
    basic: ['Tất cả tính năng Free', 'Quản lý dịch vụ & giá', 'Xuất hoá đơn', 'Hỗ trợ email'],
    pro: ['Tất cả tính năng Basic', 'Nhân viên không giới hạn', 'Thống kê chi tiết', 'Hỗ trợ ưu tiên'],
    unlimited: ['Tất cả tính năng Pro', 'Phòng không giới hạn', 'API tích hợp', 'Hỗ trợ 24/7'],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full sm:max-w-2xl lg:max-w-3xl bg-slate-900 rounded-t-2xl sm:rounded-2xl border border-slate-700 shadow-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col sm:mx-4">
        {/* Header */}
        <div className="relative px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-slate-800 shrink-0">
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Để sau"
          >
            <X size={18} />
          </button>

          {/* Mobile drag handle */}
          <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-3 sm:hidden" />

          <div className="text-center pr-8 sm:pr-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/15 text-teal-400 text-[11px] sm:text-xs font-medium mb-2 sm:mb-3">
              <Crown size={11} />
              Chọn gói phù hợp
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Chào mừng đến với PetLog! 🐾</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Chọn gói để bắt đầu sử dụng đầy đủ tính năng</p>
          </div>
        </div>

        {/* Scrollable plans */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-teal-400">Đang tải gói...</div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-3 p-2.5 sm:p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-xs sm:text-sm">
                  {error}
                </div>
              )}

              {/* Mobile: 1 column, Tablet: 3 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {plans.map(plan => {
                  const isSelected = selectedPlan === plan.name;
                  const isFree = plan.price === 0;
                  const Icon = planIcons[plan.name] || Zap;
                  const planFeatures = features[plan.name] || features.basic;

                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => handleSelect(plan)}
                      className={`relative text-left p-4 rounded-xl border-2 transition-all duration-200 flex flex-col ${
                        isSelected
                          ? 'border-teal-500 bg-teal-500/10 ring-1 ring-teal-500/30'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-500 active:bg-slate-800'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}

                      {/* Badge row — keep consistent height */}
                      <div className="h-5 mb-2">
                        {isFree && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                            Miễn phí
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-teal-500/20' : 'bg-slate-700'
                        }`}>
                          <Icon size={14} className={isSelected ? 'text-teal-400' : 'text-slate-400'} />
                        </div>
                        <h3 className="font-semibold text-sm">{plan.display_name}</h3>
                      </div>

                      <div className="mb-3">
                        <span className="text-2xl font-bold text-white">{isFree ? '0đ' : fmt(plan.price)}</span>
                        <span className="text-slate-500 text-xs">/tháng</span>
                      </div>

                      <p className="text-xs font-medium text-teal-400 mb-3">
                        {plan.max_rooms >= 999 ? 'Không giới hạn phòng' : `Tối đa ${plan.max_rooms} phòng`}
                      </p>

                      {/* Features — flex-grow to push all cards to same height */}
                      <ul className="space-y-1.5 flex-1">
                        {planFeatures.map((f, i) => (
                          <li key={i} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                            <Check size={10} className="text-green-400 mt-0.5 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer — sticky at bottom */}
        <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-800 bg-slate-900/95">
          <button
            onClick={handleConfirm}
            disabled={!selectedPlan || confirming}
            className="w-full py-3 sm:py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-all"
          >
            {confirming
              ? 'Đang xử lý...'
              : !selectedPlan
                ? 'Vui lòng chọn gói'
                : plans.find(p => p.name === selectedPlan)?.price === 0
                  ? 'Bắt đầu với gói miễn phí'
                  : 'Chọn gói & thanh toán'}
          </button>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] sm:text-xs text-slate-500">
              Nâng cấp hoặc thay đổi gói bất cứ lúc nào
            </p>
            <button
              onClick={onDismiss}
              className="text-[10px] sm:text-xs text-slate-500 hover:text-slate-300 underline transition-colors"
            >
              Để sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
