'use client';

import { useState } from 'react';
import {
  FileText, BookOpen, Smartphone, QrCode, PawPrint, ClipboardList, Camera,
  DoorOpen, Sparkles, TrendingUp, Users, Settings, Crown, ChevronDown,
  CheckCircle2, ArrowRight, Tag, Receipt, MessageSquare, ScanLine, Printer,
} from 'lucide-react';

/* ═══ Section data ═══ */
type Section = { id: string; icon: typeof FileText; color: string; title: string; content: React.ReactNode };

const sections: Section[] = [
  /* ─── 1. Bắt đầu ─── */
  {
    id: 'start', icon: Smartphone, color: 'text-blue-400',
    title: '1. Bắt đầu sử dụng',
    content: (
      <div className="space-y-3">
        <Step n={1}>Đăng ký tài khoản tại trang chủ → chọn gói (miễn phí 14 ngày)</Step>
        <Step n={2}>Đăng nhập → vào <B>Tổng quan</B> để xem trạng thái phòng</Step>
        <Step n={3}>Vào <B>Phòng</B> → tạo phòng mới hoặc hệ thống đã tạo sẵn khi đăng ký</Step>
        <Step n={4}>Vào <B>In QR</B> → in mã QR cho từng phòng, dán lên cửa chuồng</Step>
        <Tip>Mã QR cố định — in 1 lần, dùng mãi mãi. Không cần in lại khi pet thay đổi.</Tip>
      </div>
    ),
  },

  /* ─── 2. Loại phòng & Bảng giá ─── */
  {
    id: 'room-types', icon: Tag, color: 'text-teal-400',
    title: '2. Thiết lập loại phòng & bảng giá',
    content: (
      <div className="space-y-3">
        <Step n={1}>Vào <B>Dịch vụ & Giá</B> → nhấn <B>+ Tạo loại phòng</B></Step>
        <Step n={2}>Đặt tên (VD: &quot;Phòng VIP&quot;, &quot;Phòng Standard&quot;), chọn icon & màu</Step>
        <Step n={3}>Thêm <B>bảng giá linh hoạt</B> — mỗi mức giá gồm tên + giá tiền</Step>
        <Example>
          <li>Chó dưới 5kg → 200,000đ/ngày</li>
          <li>Chó 5-15kg → 300,000đ/ngày</li>
          <li>Chó trên 15kg → 400,000đ/ngày</li>
          <li>2 bé chung phòng → 350,000đ/ngày</li>
        </Example>
        <Step n={4}>Vào <B>Phòng</B> → gán loại phòng cho từng phòng bằng nút <Tag size={13} className="inline text-teal-400" /></Step>
        <Tip>Bạn có thể tạo bao nhiêu mức giá tuỳ thích. Nhân viên chỉ cần chọn đúng mức giá khi check-in.</Tip>
      </div>
    ),
  },

  /* ─── 3. Check-in ─── */
  {
    id: 'checkin', icon: QrCode, color: 'text-green-400',
    title: '3. Check-in pet',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-slate-400">Có 2 cách check-in:</p>
        <div className="rounded-lg bg-slate-900/50 p-3 border border-slate-700/50">
          <p className="text-xs font-semibold text-green-400 mb-2">Cách 1: Khách tự quét QR</p>
          <Step n={1}>Khách dùng camera quét mã QR trên phòng</Step>
          <Step n={2}>Nhập SĐT, tên chủ, thông tin pet (tên, loại, ảnh, ghi chú dị ứng)</Step>
          <Step n={3}>Chọn mức giá phù hợp → nhấn <B>Check-in</B></Step>
          <Step n={4}>Nhận link diary để theo dõi</Step>
        </div>
        <div className="rounded-lg bg-slate-900/50 p-3 border border-slate-700/50">
          <p className="text-xs font-semibold text-blue-400 mb-2">Cách 2: Nhân viên check-in</p>
          <Step n={1}>Nhân viên vào <B>Quét QR</B> hoặc nhấn vào phòng trống trên <B>Tổng quan</B></Step>
          <Step n={2}>Nhập thông tin pet + chọn mức giá</Step>
          <Step n={3}>Chia sẻ link diary cho khách qua Zalo</Step>
        </div>
        <Tip>Nếu phòng đã có loại phòng → mức giá tự động hiển thị. Nhân viên chỉ cần chọn.</Tip>
      </div>
    ),
  },

  /* ─── 4. Nhật ký chăm sóc ─── */
  {
    id: 'diary', icon: Camera, color: 'text-amber-400',
    title: '4. Ghi nhật ký chăm sóc',
    content: (
      <div className="space-y-3">
        <Step n={1}>Nhấn vào phòng có pet trên <B>Tổng quan</B> hoặc quét QR</Step>
        <Step n={2}>Chọn loại hoạt động: cho ăn, tắm, thuốc, dạo chơi, hoặc tự ghi</Step>
        <Step n={3}>Thêm mô tả + ảnh/video → nhấn <B>Ghi</B></Step>
        <Step n={4}>Chủ pet tự thấy cập nhật ngay lập tức qua link diary</Step>
        <Tip>Nhật ký luôn hiển thị trên <B>Nhật ký</B>, owner có thể xem tất cả hoạt động theo thời gian.</Tip>
      </div>
    ),
  },

  /* ─── 5. Checkout & Hoá đơn ─── */
  {
    id: 'checkout', icon: Receipt, color: 'text-purple-400',
    title: '5. Checkout & Hoá đơn',
    content: (
      <div className="space-y-3">
        <Step n={1}>Vào <B>Lượt gửi</B> → tìm booking cần checkout</Step>
        <Step n={2}>Nhấn <B>Checkout</B> → hệ thống tự tính tiền:</Step>
        <Example>
          <li>Số ngày lưu trú × giá đã chọn lúc check-in</li>
          <li>+ Dịch vụ phát sinh (nếu có)</li>
          <li>− Khuyến mãi (nếu có)</li>
        </Example>
        <Step n={3}>Hoá đơn sinh tự động → có thể xuất PDF</Step>
        <Step n={4}>Phòng tự động trống, sẵn sàng nhận pet mới</Step>
        <Tip>Vào <B>Lượt gửi</B> → nhấn icon hoá đơn để xem lại hoá đơn bất cứ lúc nào.</Tip>
      </div>
    ),
  },

  /* ─── 6. Quản lý phòng ─── */
  {
    id: 'rooms', icon: DoorOpen, color: 'text-cyan-400',
    title: '6. Quản lý phòng',
    content: (
      <div className="space-y-3">
        <Step n={1}><B>Tổng quan</B> — xem nhanh phòng trống/có pet, cảnh báo overdue</Step>
        <Step n={2}><B>Phòng</B> — tạo thêm phòng, gán/đổi loại phòng, xoá phòng trống</Step>
        <Step n={3}><B>In QR</B> — in mã QR cho các phòng mới tạo</Step>
        <div className="rounded-lg bg-slate-900/50 p-3 border border-slate-700/50">
          <p className="text-xs font-semibold text-slate-300 mb-2">Trạng thái phòng:</p>
          <div className="space-y-1 text-sm text-slate-400">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500" /> <span>Trống — sẵn sàng nhận pet</span></div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /> <span>Có pet — đang lưu trú</span></div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /> <span>Overdue — quá hạn checkout</span></div>
          </div>
        </div>
        <Tip>Không thể xoá loại phòng đang có phòng sử dụng hoặc có pet đang lưu trú.</Tip>
      </div>
    ),
  },

  /* ─── 7. Doanh thu ─── */
  {
    id: 'revenue', icon: TrendingUp, color: 'text-emerald-400',
    title: '7. Theo dõi doanh thu',
    content: (
      <div className="space-y-3">
        <Step n={1}>Vào <B>Doanh thu</B> — xem tổng doanh thu, số lượt gửi</Step>
        <Step n={2}>Lọc theo khoảng thời gian: 7 ngày, 30 ngày, tháng này, hoặc tuỳ chọn</Step>
        <Step n={3}>Biểu đồ doanh thu theo thời gian + biểu đồ tỷ lệ (phòng vs dịch vụ)</Step>
        <Tip>Doanh thu tính từ các booking đã checkout. Booking chưa checkout không tính vào.</Tip>
      </div>
    ),
  },

  /* ─── 8. Nhân viên ─── */
  {
    id: 'staff', icon: Users, color: 'text-pink-400',
    title: '8. Quản lý nhân viên',
    content: (
      <div className="space-y-3">
        <Step n={1}>Vào <B>Nhân viên</B> → nhấn <B>+ Thêm</B></Step>
        <Step n={2}>Nhập tên, email, mật khẩu → nhân viên đăng nhập bằng tài khoản riêng</Step>
        <Step n={3}>Nhân viên có thể: xem tổng quan, quét QR, ghi nhật ký, xem lượt gửi</Step>
        <Step n={4}>Owner có thể khoá/xoá nhân viên bất cứ lúc nào</Step>
        <Tip>Nhân viên không truy cập được: Phòng, Dịch vụ & Giá, Doanh thu, Cài đặt.</Tip>
      </div>
    ),
  },

  /* ─── 9. Luồng QR ─── */
  {
    id: 'qr-flow', icon: ScanLine, color: 'text-indigo-400',
    title: '9. Luồng QR thông minh',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-slate-400">Khi quét QR, hệ thống tự nhận biết:</p>
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <span className="shrink-0 mt-0.5 text-green-400">●</span>
            <span className="text-slate-400"><B>Phòng trống</B> → mở form check-in cho pet mới</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <span className="shrink-0 mt-0.5 text-blue-400">●</span>
            <span className="text-slate-400"><B>Có pet + Nhân viên quét</B> → mở diary để cập nhật (cho ăn, tắm...)</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <span className="shrink-0 mt-0.5 text-amber-400">●</span>
            <span className="text-slate-400"><B>Có pet + Khách quét</B> → mở diary chỉ xem, không chỉnh sửa</span>
          </div>
        </div>
        <Tip>Camera quét QR cần HTTPS. Nếu không quét được, có thể nhập mã phòng thủ công.</Tip>
      </div>
    ),
  },

  /* ─── 10. Nâng cấp & Cài đặt ─── */
  {
    id: 'settings', icon: Settings, color: 'text-slate-400',
    title: '10. Nâng cấp & Cài đặt',
    content: (
      <div className="space-y-3">
        <div className="rounded-lg bg-slate-900/50 p-3 border border-slate-700/50">
          <p className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1"><Crown size={13} className="text-amber-400" /> Nâng cấp gói</p>
          <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
            <li>Vào <B>Nâng cấp</B> → chọn gói phù hợp</li>
            <li>Thanh toán qua PayOS (hỗ trợ mọi ngân hàng VN)</li>
            <li>Muốn thêm phòng ngoài gói? Mua bổ sung theo phòng</li>
          </ul>
        </div>
        <div className="rounded-lg bg-slate-900/50 p-3 border border-slate-700/50">
          <p className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1"><Settings size={13} className="text-slate-400" /> Cài đặt</p>
          <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
            <li>Đổi tên khách sạn</li>
            <li>Đổi mật khẩu tài khoản</li>
          </ul>
        </div>
        <div className="rounded-lg bg-slate-900/50 p-3 border border-slate-700/50">
          <p className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1"><MessageSquare size={13} className="text-green-400" /> Góp ý</p>
          <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
            <li>Gửi ý kiến, báo lỗi, đề xuất tính năng mới</li>
            <li>Team PetLog sẽ phản hồi trong 24 giờ</li>
          </ul>
        </div>
      </div>
    ),
  },
];

/* ═══ Sub-components ═══ */
function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <span className="shrink-0 w-5 h-5 rounded-full bg-slate-700 text-[10px] font-bold flex items-center justify-center text-slate-300 mt-0.5">{n}</span>
      <span className="text-slate-400">{children}</span>
    </div>
  );
}
function B({ children }: { children: React.ReactNode }) {
  return <strong className="text-slate-200">{children}</strong>;
}
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 mt-2 px-3 py-2 rounded-lg bg-teal-500/8 border border-teal-500/15 text-xs text-teal-300/80">
      <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-teal-400" />
      <span>{children}</span>
    </div>
  );
}
function Example({ children }: { children: React.ReactNode }) {
  return (
    <ul className="ml-7 text-sm text-slate-400 space-y-0.5 list-disc list-inside bg-slate-900/40 rounded-lg px-3 py-2 border border-slate-700/30">
      {children}
    </ul>
  );
}

/* ═══ Accordion item ═══ */
function AccordionItem({ section, isOpen, toggle }: { section: Section; isOpen: boolean; toggle: () => void }) {
  const Icon = section.icon;
  return (
    <div className={`rounded-xl border transition-colors ${isOpen ? 'bg-slate-800/60 border-slate-600' : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'}`}>
      <button onClick={toggle} className="w-full flex items-center gap-3 p-4 text-left">
        <div className={`w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 ${section.color}`}>
          <Icon size={16} />
        </div>
        <span className="flex-1 font-medium text-sm">{section.title}</span>
        <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[600px] pb-4' : 'max-h-0'}`}>
        <div className="px-4">{section.content}</div>
      </div>
    </div>
  );
}

/* ═══ MAIN PAGE ═══ */
export default function GuidePage() {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(['start']));

  const toggle = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const expandAll = () => setOpenIds(new Set(sections.map(s => s.id)));
  const collapseAll = () => setOpenIds(new Set());

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <FileText size={24} className="text-teal-400" /> Hướng dẫn sử dụng
          </h1>
          <p className="text-sm text-slate-400 mt-1">Hướng dẫn đầy đủ cho chủ khách sạn & nhân viên</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={expandAll} className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors">Mở tất cả</button>
          <button onClick={collapseAll} className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors">Đóng tất cả</button>
        </div>
      </div>

      {/* Quick flow overview */}
      <div className="rounded-xl bg-teal-500/8 border border-teal-500/20 p-4 mb-6">
        <p className="text-xs font-semibold text-teal-400 mb-2">Luồng hoạt động tổng quan</p>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
          <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">Tạo phòng</span>
          <ArrowRight size={12} className="text-teal-500" />
          <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">Thiết lập giá</span>
          <ArrowRight size={12} className="text-teal-500" />
          <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">In QR</span>
          <ArrowRight size={12} className="text-teal-500" />
          <span className="px-2 py-1 rounded bg-slate-800 text-green-300">Check-in</span>
          <ArrowRight size={12} className="text-teal-500" />
          <span className="px-2 py-1 rounded bg-slate-800 text-amber-300">Chăm sóc</span>
          <ArrowRight size={12} className="text-teal-500" />
          <span className="px-2 py-1 rounded bg-slate-800 text-purple-300">Checkout</span>
          <ArrowRight size={12} className="text-teal-500" />
          <span className="px-2 py-1 rounded bg-slate-800 text-emerald-300">Doanh thu</span>
        </div>
      </div>

      {/* Accordion sections */}
      <div className="space-y-2">
        {sections.map(s => (
          <AccordionItem key={s.id} section={s} isOpen={openIds.has(s.id)} toggle={() => toggle(s.id)} />
        ))}
      </div>

      {/* Important notes */}
      <div className="mt-6 rounded-xl bg-amber-500/8 border border-amber-500/20 p-4">
        <h3 className="font-semibold flex items-center gap-2 mb-3 text-sm text-amber-300"><BookOpen size={16} /> Lưu ý quan trọng</h3>
        <ul className="text-sm text-amber-200/70 space-y-1.5 list-disc list-inside">
          <li>Mã QR phòng <strong>cố định</strong> — in 1 lần, dùng mãi</li>
          <li>Mỗi lượt gửi pet có <strong>link diary riêng</strong>, không lẫn nhau</li>
          <li>Sau check-out, chủ pet <strong>vẫn xem</strong> được nhật ký cũ</li>
          <li>Doanh thu chỉ tính booking <strong>đã checkout</strong></li>
          <li>Nhân viên chỉ thấy các mục: Tổng quan, Lượt gửi, Quét QR, Nhật ký, Góp ý</li>
        </ul>
      </div>

      {/* Footer help */}
      <div className="mt-4 text-center text-xs text-slate-500 py-4">
        Cần hỗ trợ? Vào <B>Góp ý</B> để gửi câu hỏi — team PetLog phản hồi trong 24 giờ.
      </div>
    </div>
  );
}
