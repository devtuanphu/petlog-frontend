'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  PawPrint, User, Phone, BookOpen, LogIn, CalendarClock, LogOut,
  AlertTriangle, DollarSign, Receipt, X, Banknote, CheckCircle2,
  CreditCard, Wallet, ArrowLeft, Calendar,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Booking } from '@/types';

function formatVND(n: number) { return n.toLocaleString('vi-VN') + 'đ'; }
function fmtDateTime(d: string) { return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function daysBetween(a: string, b?: string) { const end = b ? new Date(b) : new Date(); return Math.max(1, Math.ceil((end.getTime() - new Date(a).getTime()) / 86400000)); }

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  useAuth();

  const [b, setB] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Checkout state
  const [checkoutBooking, setCheckoutBooking] = useState<Booking | null>(null);
  const [billing, setBilling] = useState<any>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [discount, setDiscount] = useState('0');
  const [discountType, setDiscountType] = useState('fixed');
  const [checkingOut, setCheckingOut] = useState(false);
  const [customCheckoutTime, setCustomCheckoutTime] = useState('');

  // Extend state
  const [showExtend, setShowExtend] = useState(false);
  const [extendDate, setExtendDate] = useState('');
  const [extending, setExtending] = useState(false);

  // Payment state
  const [paymentModal, setPaymentModal] = useState<{ booking: Booking; total: number } | null>(null);

  const load = () => {
    api.getBooking(parseInt(id)).then(setB).catch(() => setError('Không tìm thấy booking')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);



  const previewDiscount = () => {
    if (!billing) return 0;
    const d = parseInt(discount) || 0;
    if (discountType === 'percent') return Math.round((billing.room_total + billing.services_total) * d / 100);
    return d;
  };
  const previewTotal = () => billing ? Math.max(0, billing.room_total + billing.services_total - previewDiscount()) : 0;

  const openCheckout = async () => {
    if (!b) return;
    setCheckoutBooking(b);
    setBillingLoading(true);
    try { setBilling(await api.getBillingPreview(b.id)); }
    catch { setBilling(null); }
    setBillingLoading(false);
  };

  const confirmCheckout = async () => {
    if (!checkoutBooking) return;
    setCheckingOut(true);
    try {
      const disc = parseInt(discount) || 0;
      const opts: { discount: number; discount_type: string; check_out_at?: string } = { discount: disc, discount_type: discountType };
      if (customCheckoutTime) opts.check_out_at = new Date(customCheckoutTime).toISOString();
      await api.checkoutWithBilling(checkoutBooking.id, opts);
      setCheckoutBooking(null); setBilling(null); setDiscount('0'); setCustomCheckoutTime('');
      router.push(`/dashboard/invoice/${checkoutBooking.id}`);
    } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Lỗi checkout'); }
    setCheckingOut(false);
  };

  const handleExtend = async () => {
    if (!b || !extendDate) return;
    setExtending(true);
    try {
      await api.extendStay(b.id, new Date(extendDate).toISOString());
      setShowExtend(false); setExtendDate('');
      load();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Lỗi gia hạn'); }
    setExtending(false);
  };

  const markPaid = async (bookingId: number, method: string, amount: number) => {
    await api.updatePaymentStatus(bookingId, { payment_status: 'paid', payment_method: method, payment_amount: amount });
    setPaymentModal(null);
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-500">Đang tải...</div>;
  if (error || !b) return <div className="flex items-center justify-center py-20 text-red-400">{error || 'Không tìm thấy'}</div>;

  const isActive = b.status === 'active';
  const isOverdue = isActive && b.expected_checkout && new Date(b.expected_checkout) < new Date();
  const isPaid = b.payment_status === 'paid';
  const days = daysBetween(b.check_in_at, b.check_out_at || undefined);

  return (
    <>
      <div className="w-full max-w-2xl mx-auto">
        {/* Back button */}
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-4 transition-colors">
          <ArrowLeft size={16} /> Quay lại
        </button>

        {/* Header */}
        <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-bold">{b.room?.room_name}</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                isActive ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-slate-600/30 text-slate-400'
              }`}>
                {isActive ? 'Đang gửi' : 'Hoàn thành'}
              </span>
              {b.status === 'completed' && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  isPaid ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                }`}>
                  {isPaid ? (b.payment_method === 'bank' ? '💳 CK · Đã TT' : '💵 TM · Đã TT') : '● Chưa thanh toán'}
                </span>
              )}
            </div>
          </div>
          {isOverdue && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
              <AlertTriangle size={14} /> Đã quá hạn đón
            </div>
          )}
        </div>

        {/* Info sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Thú cưng</p>
            {b.pets?.map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center"><PawPrint size={12} className="text-teal-400" /></div>
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-[10px] text-slate-500">{p.type} {p.breed ? `· ${p.breed}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Chủ pet</p>
            <div className="space-y-1.5">
              <p className="text-sm flex items-center gap-2"><User size={13} className="text-slate-500" /> {b.owner_name}</p>
              <a href={`tel:${b.owner_phone}`} className="text-sm flex items-center gap-2 text-teal-400 hover:text-teal-300">
                <Phone size={13} /> {b.owner_phone}
              </a>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4 mb-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Thời gian · {days} ngày</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-teal-500/10 flex items-center justify-center"><LogIn size={12} className="text-teal-400" /></div>
              <div><p className="text-xs text-slate-500">Check-in</p><p className="text-sm font-medium">{fmtDateTime(b.check_in_at)}</p></div>
            </div>
            {b.expected_checkout && (
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isOverdue ? 'bg-red-500/10' : 'bg-slate-700/50'}`}>
                  <CalendarClock size={12} className={isOverdue ? 'text-red-400' : 'text-slate-400'} />
                </div>
                <div><p className="text-xs text-slate-500">Dự kiến đón</p><p className={`text-sm font-medium ${isOverdue ? 'text-red-400' : ''}`}>{fmtDateTime(b.expected_checkout)}</p></div>
              </div>
            )}
            {b.check_out_at && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center"><LogOut size={12} className="text-green-400" /></div>
                <div><p className="text-xs text-slate-500">Check-out</p><p className="text-sm font-medium text-green-400">{fmtDateTime(b.check_out_at)}</p></div>
              </div>
            )}
          </div>
        </div>

        {/* Billing estimate for active bookings */}
        {isActive && (
          <div className="rounded-xl bg-slate-800/40 border border-teal-500/20 p-4 mb-4">
            <p className="text-[10px] text-teal-400 uppercase tracking-wider mb-3 flex items-center gap-1">
              <DollarSign size={10} /> Ước tính chi phí
            </p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Giá phòng / ngày</span>
                <span>{formatVND(b.daily_rate || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Số ngày (đến hiện tại)</span>
                <span>{days} ngày</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Tiền phòng</span>
                <span>{formatVND(days * (b.daily_rate || 0))}</span>
              </div>
              {(b.services_total ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Dịch vụ</span>
                  <span>{formatVND(b.services_total || 0)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-700/50">
                <span className="text-slate-300">Tạm tính</span>
                <span className="text-teal-300">{formatVND(days * (b.daily_rate || 0) + (b.services_total || 0))}</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">* Số tiền chính xác sẽ tính khi checkout</p>
          </div>
        )}

        {/* Billing - completed */}
        {b.status === 'completed' && (b.grand_total ?? 0) > 0 && (
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4 mb-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Hoá đơn</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Tiền phòng ({days} ngày × {formatVND(b.daily_rate || 0)})</span>
                <span>{formatVND(b.room_total || 0)}</span>
              </div>
              {(b.services_total ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Dịch vụ</span>
                  <span>{formatVND(b.services_total || 0)}</span>
                </div>
              )}
              {(b.discount ?? 0) > 0 && (
                <div className="flex justify-between text-sm text-red-400">
                  <span>Giảm giá {b.discount_type === 'percent' ? `(${b.discount}%)` : ''}</span>
                  <span>-{formatVND(b.discount_type === 'percent' ? Math.round(((b.room_total || 0) + (b.services_total || 0)) * (b.discount || 0) / 100) : (b.discount || 0))}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-700/50">
                <span>Tổng</span>
                <span className="text-teal-300">{formatVND(b.grand_total!)}</span>
              </div>
            </div>
            {b.invoice_number && <p className="text-[10px] text-slate-500 mt-2">{b.invoice_number}</p>}
            {isPaid && b.paid_at && (
              <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                <CheckCircle2 size={12} /> Đã thanh toán {b.payment_method === 'bank' ? 'chuyển khoản' : 'tiền mặt'} · {fmtDateTime(b.paid_at)}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <a href={`/diary/${b.diary_token}`} target="_blank"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-sm text-slate-300 transition-colors">
            <BookOpen size={16} /> Xem Diary
          </a>
          {b.status === 'completed' && b.invoice_number && (
            <a href={`/dashboard/invoice/${b.id}`}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-sm text-blue-300 transition-colors">
              <Receipt size={16} /> Xem hoá đơn
            </a>
          )}
          {isActive && (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowExtend(true)}
                className="py-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-sm font-medium transition-colors flex items-center justify-center gap-1.5">
                <Calendar size={14} /> Gia hạn
              </button>
              <button onClick={openCheckout}
                className="py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors active:scale-[0.98] flex items-center justify-center gap-1.5">
                <LogOut size={14} /> Checkout
              </button>
            </div>
          )}
          {b.status === 'completed' && !isPaid && (
            <button onClick={() => setPaymentModal({ booking: b, total: b.grand_total || 0 })}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 active:scale-[0.98]">
              <Banknote size={16} /> Thu tiền · {formatVND(b.grand_total || 0)}
            </button>
          )}
        </div>
      </div>

      {/* ═══ EXTEND MODAL ═══ */}
      {showExtend && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center z-50" onClick={() => setShowExtend(false)}>
          <div className="bg-slate-800 rounded-t-2xl md:rounded-2xl border border-slate-700 p-5 w-full md:max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4 md:hidden" />
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4"><Calendar size={18} className="text-blue-400" /> Gia hạn ngày đón</h3>
            {b.expected_checkout && (
              <p className="text-xs text-slate-500 mb-2">Dự kiến hiện tại: {fmtDateTime(b.expected_checkout)}</p>
            )}
            <input type="datetime-local" value={extendDate} onChange={e => setExtendDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 focus:border-blue-500 focus:outline-none text-sm mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setShowExtend(false)}
                className="flex-1 py-3 rounded-xl bg-slate-700/50 text-sm text-slate-400">Huỷ</button>
              <button onClick={handleExtend} disabled={extending || !extendDate}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold disabled:opacity-50">
                {extending ? '...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CHECKOUT MODAL ═══ */}
      {checkoutBooking && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center z-50" onClick={() => { setCheckoutBooking(null); setBilling(null); }}>
          <div className="bg-slate-800 rounded-t-2xl md:rounded-2xl border border-slate-700 p-5 w-full md:max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4 md:hidden" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2"><Receipt size={18} className="text-amber-400" /> Checkout & Tính tiền</h3>
              <button onClick={() => { setCheckoutBooking(null); setBilling(null); }} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            {billingLoading ? (
              <div className="animate-pulse text-teal-400 text-center py-8">Đang tính tiền...</div>
            ) : billing ? (
              <>
                <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-slate-900/50">
                  <div className="p-2 rounded-lg bg-teal-500/10"><PawPrint size={16} className="text-teal-400" /></div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{checkoutBooking.pets?.map((p: any) => p.name).join(', ')}</p>
                    <p className="text-[11px] text-slate-500">{checkoutBooking.room?.room_name} · {billing.days} ngày</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Tiền phòng</span><span>{formatVND(billing.room_total)}</span></div>
                  {billing.services_total > 0 && <div className="flex justify-between text-sm"><span className="text-slate-400">Dịch vụ</span><span>{formatVND(billing.services_total)}</span></div>}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50">
                    <span className="text-sm text-slate-400 whitespace-nowrap">Giảm giá</span>
                    <div className="flex bg-slate-900/60 rounded-lg border border-slate-700 overflow-hidden flex-1">
                      <input type="text" inputMode="numeric" pattern="[0-9]*" value={discount} onChange={e => setDiscount(e.target.value.replace(/[^0-9]/g, ''))} className="w-20 px-2 py-1.5 bg-transparent text-sm text-right focus:outline-none" />
                      <select value={discountType} onChange={e => setDiscountType(e.target.value)} className="px-2 py-1.5 bg-transparent text-sm text-slate-400 focus:outline-none border-l border-slate-700">
                        <option value="fixed">đ</option>
                        <option value="percent">%</option>
                      </select>
                    </div>
                    {previewDiscount() > 0 && <span className="text-red-400 text-sm whitespace-nowrap">-{formatVND(previewDiscount())}</span>}
                  </div>
                  <div className="pt-2 border-t border-slate-700/50">
                    <label className="flex items-center gap-2 text-sm text-slate-400 mb-1.5">
                      <CalendarClock size={14} /> Thời gian checkout
                    </label>
                    <input type="datetime-local" value={customCheckoutTime}
                      onChange={e => setCustomCheckoutTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700 focus:border-amber-500 focus:outline-none text-sm" />
                    <p className="text-[10px] text-slate-500 mt-1">Để trống = checkout ngay bây giờ</p>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-700">
                    <span>Tổng</span>
                    <span className="text-teal-300">{formatVND(previewTotal())}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setCheckoutBooking(null); setBilling(null); }}
                    className="flex-1 py-3 rounded-xl bg-slate-700/50 text-sm text-slate-400">Huỷ</button>
                  <button onClick={confirmCheckout} disabled={checkingOut}
                    className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-sm font-semibold active:scale-[0.98] disabled:opacity-50">
                    {checkingOut ? '...' : 'Xác nhận checkout'}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-400 text-sm mb-3">Không tải được billing</p>
                <button onClick={confirmCheckout} disabled={checkingOut}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-sm font-semibold">
                  {checkingOut ? '...' : 'Checkout nhanh'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ PAYMENT MODAL ═══ */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center z-50" onClick={() => setPaymentModal(null)}>
          <div className="bg-slate-800 rounded-t-2xl md:rounded-2xl border border-slate-700 p-5 w-full md:max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4 md:hidden" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2"><DollarSign size={18} className="text-emerald-400" /> Xác nhận thanh toán</h3>
              <button onClick={() => setPaymentModal(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="text-center mb-5">
              <p className="text-xs text-slate-500 mb-1">Số tiền</p>
              <p className="text-3xl font-bold text-teal-300">{formatVND(paymentModal.total)}</p>
              <p className="text-[11px] text-slate-500 mt-1">{paymentModal.booking.owner_name} · {paymentModal.booking.room?.room_name}</p>
            </div>
            <p className="text-xs text-slate-500 text-center mb-4">Khách đã thanh toán bằng hình thức nào?</p>
            <div className="space-y-2">
              <button onClick={() => markPaid(paymentModal.booking.id, 'bank', paymentModal.total)}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98]">
                <CreditCard size={16} /> Chuyển khoản
              </button>
              <button onClick={() => markPaid(paymentModal.booking.id, 'cash', paymentModal.total)}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98]">
                <Wallet size={16} /> Tiền mặt
              </button>
              <button onClick={() => setPaymentModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-sm text-slate-400">Thu sau</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
