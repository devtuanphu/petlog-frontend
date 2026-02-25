'use client';

import { FileText, Download, ExternalLink, BookOpen, Smartphone, QrCode, PawPrint, ClipboardList, Camera } from 'lucide-react';

export default function GuidePage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl md:text-2xl font-bold mb-2 flex items-center gap-2">
        <FileText size={24} className="text-teal-400" /> Hướng dẫn sử dụng
      </h1>
      <p className="text-sm text-slate-400 mb-6">Hướng dẫn chi tiết cách sử dụng PetLog cho chủ khách sạn & nhân viên</p>

      {/* Download PDF */}
      <a href="/PetLog - Hướng Dẫn Sử Dụng.pdf" target="_blank"
        className="flex items-center gap-4 p-5 rounded-2xl bg-teal-600/10 border border-teal-500/30 hover:bg-teal-600/20 transition-colors mb-6 group">
        <div className="w-14 h-14 rounded-xl bg-teal-600/20 flex items-center justify-center shrink-0">
          <Download size={28} className="text-teal-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-teal-300 group-hover:text-teal-200 transition-colors">Tải PDF Hướng dẫn sử dụng</p>
          <p className="text-xs text-slate-400 mt-0.5">Tài liệu đầy đủ với hình ảnh minh hoạ, có thể in ra</p>
        </div>
        <ExternalLink size={18} className="text-slate-500 shrink-0" />
      </a>

      {/* Quick guide sections */}
      <h2 className="font-semibold text-sm text-slate-400 mb-3">Hướng dẫn nhanh</h2>

      <div className="space-y-3">
        {/* Setup */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-2"><Smartphone size={16} className="text-blue-400" /> Bắt đầu sử dụng</h3>
          <ol className="text-sm text-slate-400 space-y-1.5 list-decimal list-inside">
            <li>Đăng ký tài khoản → hệ thống tạo phòng tự động</li>
            <li>Vào <strong className="text-slate-300">Phòng</strong> → xem/in mã QR cho mỗi phòng</li>
            <li>Dán mã QR lên cửa phòng</li>
          </ol>
        </div>

        {/* Check-in */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-2"><QrCode size={16} className="text-green-400" /> Check-in pet</h3>
          <ol className="text-sm text-slate-400 space-y-1.5 list-decimal list-inside">
            <li>Chủ pet quét mã QR trên phòng bằng camera</li>
            <li>Điền SĐT, tên, thông tin pet (tên, loại, ảnh, dị ứng)</li>
            <li>Nhấn <strong className="text-slate-300">Check-in</strong> → nhận link diary</li>
          </ol>
        </div>

        {/* Diary */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-2"><Camera size={16} className="text-amber-400" /> Cập nhật nhật ký</h3>
          <ol className="text-sm text-slate-400 space-y-1.5 list-decimal list-inside">
            <li>Nhấn vào phòng có pet trên <strong className="text-slate-300">Tổng quan</strong> hoặc quét QR</li>
            <li>Chọn loại hoạt động (cho ăn, tắm, dạo...)</li>
            <li>Thêm mô tả + ảnh/video → nhấn <strong className="text-slate-300">Ghi</strong></li>
            <li>Chủ pet tự thấy cập nhật qua link diary</li>
          </ol>
        </div>

        {/* Checkout */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-2"><ClipboardList size={16} className="text-purple-400" /> Check-out</h3>
          <ol className="text-sm text-slate-400 space-y-1.5 list-decimal list-inside">
            <li>Vào <strong className="text-slate-300">Lượt gửi</strong> → tìm booking</li>
            <li>Nhấn <strong className="text-slate-300">Check-out</strong></li>
            <li>Phòng tự động trống, sẵn sàng pet mới</li>
          </ol>
        </div>

        {/* QR flow */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-2"><PawPrint size={16} className="text-teal-400" /> Luồng QR thông minh</h3>
          <div className="text-sm text-slate-400 space-y-1.5">
            <div className="flex items-start gap-2">
              <span className="shrink-0 text-green-400">●</span>
              <span><strong className="text-slate-300">Phòng trống</strong> → hiện form check-in mới</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="shrink-0 text-blue-400">●</span>
              <span><strong className="text-slate-300">Có pet + NV quét</strong> → mở diary có thể cập nhật</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="shrink-0 text-amber-400">●</span>
              <span><strong className="text-slate-300">Có pet + Chủ pet quét</strong> → mở diary chỉ xem</span>
            </div>
          </div>
        </div>

        {/* Important notes */}
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-2 text-amber-300"><BookOpen size={16} /> Lưu ý quan trọng</h3>
          <ul className="text-sm text-amber-200/70 space-y-1.5 list-disc list-inside">
            <li>Mã QR phòng <strong>cố định</strong> — in 1 lần, dùng mãi</li>
            <li>Mỗi lượt gửi pet có <strong>link diary riêng</strong>, không lẫn nhau</li>
            <li>Camera quét QR cần <strong>HTTPS</strong> — có thể nhập mã thủ công</li>
            <li>Sau check-out, chủ pet <strong>vẫn xem</strong> được nhật ký cũ</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
