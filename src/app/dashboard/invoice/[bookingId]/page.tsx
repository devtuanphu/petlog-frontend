'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, CreditCard, Wallet, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

function formatVND(n: number) {
  return n.toLocaleString('vi-VN') + 'đ';
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export default function InvoicePage() {
  const router = useRouter();
  const { bookingId } = useParams<{ bookingId: string }>();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    api.getInvoice(parseInt(bookingId))
      .then(setInvoice)
      .catch(() => setInvoice(null))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const markPaid = async (method: string) => {
    setPaying(true);
    try {
      await api.updatePaymentStatus(parseInt(bookingId), {
        payment_status: 'paid',
        payment_method: method,
        payment_amount: invoice?.grand_total || 0,
      });
      setPaid(true);
    } catch { alert('Lỗi xác nhận thanh toán'); }
    finally { setPaying(false); }
  };

  if (loading) return <div className="animate-pulse text-teal-400 text-center py-12">Đang tải hoá đơn...</div>;
  if (!invoice) return (
    <div className="text-center py-12">
      <p className="text-red-400 mb-4">Không tìm thấy hoá đơn</p>
      <button onClick={() => router.back()} className="text-teal-400 underline">Quay lại</button>
    </div>
  );

  const subtotal = (invoice.room_total || 0) + (invoice.services_total || 0);
  const sttCounter = { value: 0 };
  const nextStt = () => ++sttCounter.value;
  const isPaid = invoice.payment_status === 'paid' || paid;

  return (
    <div className="max-w-[600px] mx-auto">
      {/* On-screen controls */}
      <div className="flex items-center gap-3 mb-4 print:hidden">
        <button onClick={() => router.push(`/dashboard/bookings/${bookingId}`)} className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold flex-1">Hoá đơn</h1>
        <button onClick={() => window.print()}
          className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-sm font-medium transition-colors flex items-center gap-1.5">
          <Printer size={14} /> In hoá đơn
        </button>
      </div>

      {/* ═══ INVOICE DOCUMENT ═══ */}
      <div className="bg-white text-gray-900 rounded-xl shadow-xl print:rounded-none print:shadow-none" id="invoice-content">

        {/* ── HEADER ── */}
        <div className="px-8 pt-8 pb-5 border-b-2 border-gray-800">
          <div className="flex items-start gap-4">
            {/* Logo */}
            {invoice.hotel?.logo_url ? (
              <img src={invoice.hotel.logo_url} alt="Logo" className="w-14 h-14 object-contain" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xl">
                {(invoice.hotel?.name || 'P')[0]}
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">{invoice.hotel?.name || 'Pet Hotel'}</h2>
              {invoice.hotel?.address && <p className="text-xs text-gray-500">{invoice.hotel.address}</p>}
              {invoice.hotel?.phone && <p className="text-xs text-gray-500">SĐT: {invoice.hotel.phone}</p>}
            </div>
          </div>

          <div className="mt-4 text-center">
            <h1 className="text-xl font-bold tracking-widest text-gray-800">HÓA ĐƠN DỊCH VỤ</h1>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">
              {invoice.check_out_at ? fmtDate(invoice.check_out_at) : fmtDate(new Date().toISOString())}
            </p>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{invoice.invoice_number}</p>
          </div>
        </div>

        {/* ── CUSTOMER INFO ── */}
        <div className="px-8 py-4 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-gray-500 text-xs">Khách hàng:</span>
              <p className="font-semibold">{invoice.owner_name}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Điện thoại:</span>
              <p className="font-medium">{invoice.owner_phone}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Thú cưng:</span>
              <p className="font-medium">{invoice.pets?.map((p: any) => `${p.name} (${p.type})`).join(', ')}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Phòng:</span>
              <p className="font-medium">{invoice.room_name} <span className="text-gray-400 text-xs">({invoice.room_type})</span></p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Check-in:</span>
              <p className="font-medium">{fmtDate(invoice.check_in_at)}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Check-out:</span>
              <p className="font-medium">{invoice.check_out_at ? fmtDate(invoice.check_out_at) : '—'}</p>
            </div>
          </div>
        </div>

        {/* ── ITEMS TABLE ── */}
        <div className="px-8 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2 text-gray-500 font-semibold w-8">Stt</th>
                <th className="text-left py-2 text-gray-500 font-semibold">Tên hàng</th>
                <th className="text-center py-2 text-gray-500 font-semibold w-14">SL</th>
                <th className="text-right py-2 text-gray-500 font-semibold w-24">Đơn giá</th>
                <th className="text-right py-2 text-gray-500 font-semibold w-28">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {/* Room charge */}
              <tr className="border-b border-gray-100">
                <td className="py-2 text-center text-gray-500">{nextStt()}</td>
                <td className="py-2">Tiền phòng ({invoice.days} ngày)</td>
                <td className="py-2 text-center">{invoice.days}</td>
                <td className="py-2 text-right">{formatVND(invoice.daily_rate)}</td>
                <td className="py-2 text-right font-semibold">{formatVND(invoice.room_total)}</td>
              </tr>

              {/* Services */}
              {invoice.services?.map((s: any, i: number) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2 text-center text-gray-500">{nextStt()}</td>
                  <td className="py-2">
                    {s.service_name}
                    {s.note && <span className="text-gray-400 text-xs block">{s.note}</span>}
                  </td>
                  <td className="py-2 text-center">{s.quantity}</td>
                  <td className="py-2 text-right">{formatVND(s.unit_price)}</td>
                  <td className="py-2 text-right font-semibold">{formatVND(s.total)}</td>
                </tr>
              ))}

              {/* Empty row separator */}
              <tr><td colSpan={5} className="py-1" /></tr>
            </tbody>
          </table>
        </div>

        {/* ── TOTALS ── */}
        <div className="px-8 pb-6">
          <div className="flex">
            {/* Left: signatures area */}
            <div className="flex-1 pr-4">
              <div className="grid grid-cols-2 gap-8 text-center text-xs text-gray-500 mt-2">
                <div>
                  <p className="font-medium">Khách hàng</p>
                  <p className="italic text-[10px]">(Ký, họ tên)</p>
                  <div className="h-16" />
                </div>
                <div>
                  <p className="font-medium">Người lập phiếu</p>
                  <p className="italic text-[10px]">(Ký, họ tên)</p>
                  <div className="h-16" />
                </div>
              </div>
            </div>

            {/* Right: totals */}
            <div className="w-60 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tổng cộng</span>
                <span className="font-semibold">{formatVND(subtotal)}</span>
              </div>
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Giảm giá {invoice.discount_type === 'percent' ? `(${invoice.discount}%)` : ''}</span>
                  <span>-{formatVND(invoice.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t-2 border-gray-800 pt-2 mt-1">
                <span className="font-bold">Thành tiền</span>
                <span className="font-bold text-lg">{formatVND(invoice.grand_total)}</span>
              </div>
            </div>
          </div>

          {/* Amount in words (optional) */}
          <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
            <p><span className="font-medium">Ghi chú:</span> Cảm ơn quý khách đã sử dụng dịch vụ!</p>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="px-8 py-3 bg-gray-50 border-t border-gray-200 text-center text-[10px] text-gray-400 rounded-b-xl print:rounded-none">
          Powered by PetLog · petlog.vn
        </div>
      </div>

      {/* ═══ PAYMENT CONFIRMATION (print:hidden) ═══ */}
      <div className="mt-4 print:hidden">
        {isPaid ? (
          <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-5 text-center">
            <CheckCircle2 size={32} className="text-green-400 mx-auto mb-2" />
            <p className="text-green-400 font-semibold">Đã xác nhận thanh toán</p>
            <p className="text-xs text-slate-500 mt-1">{invoice.payment_method === 'bank' || paid ? 'Chuyển khoản' : 'Tiền mặt'}</p>
            <button onClick={() => router.push(`/dashboard/bookings/${bookingId}`)}
              className="mt-3 px-6 py-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-sm text-slate-300 transition-colors">
              ← Quay lại booking
            </button>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-5">
            <p className="text-sm text-slate-400 text-center mb-4">Khách đã thanh toán bằng hình thức nào?</p>
            <div className="space-y-2">
              <button onClick={() => markPaid('bank')} disabled={paying}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50">
                <CreditCard size={16} /> Chuyển khoản
              </button>
              <button onClick={() => markPaid('cash')} disabled={paying}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50">
                <Wallet size={16} /> Tiền mặt
              </button>
              <button onClick={() => router.push(`/dashboard/bookings/${bookingId}`)}
                className="w-full py-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-sm text-slate-400">
                Thu sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-content, #invoice-content * { visibility: visible; }
          #invoice-content {
            position: absolute; left: 0; top: 0;
            width: 100%; max-width: 600px; margin: 0 auto;
            background: white; color: black;
            font-size: 11px; border-radius: 0 !important;
            box-shadow: none !important;
          }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
