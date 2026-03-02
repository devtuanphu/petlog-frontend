'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { PawPrint, UtensilsCrossed, ClipboardEdit, Printer, Sparkles, ShieldCheck, Clock, Heart, Star, MessageCircle, Check, Menu, X, Plus, Quote, Monitor, Headphones, Globe, Lock } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const fmt = (n: number) => n.toLocaleString('vi-VN') + 'đ';

type PlanData = { id: number; name: string; display_name: string; price: number; max_rooms: number; description: string };


const faqs = [
  {
    q: 'Tôi có cần mua thiết bị gì không?',
    a: 'Không cần. Bạn chỉ cần smartphone hoặc máy tính. PetLog chạy trên trình duyệt web, không cần cài app.',
  },
  {
    q: 'Tôi có thể tự đặt giá linh hoạt không?',
    a: 'Hoàn toàn! Mỗi loại phòng có bảng giá tự do — bạn tự tạo bao nhiêu mức giá tuỳ thích: theo kg, theo số lượng pet, theo giống... Nhân viên chỉ cần chọn đúng mức giá khi check-in.',
  },
  {
    q: 'Khách hàng của tôi có cần tải app không?',
    a: 'Không. Khách chỉ cần quét QR bằng camera, nhập thông tin pet là xong. Trang diary cũng là web — mở được trên mọi thiết bị.',
  },
  {
    q: 'Tính tiền và hoá đơn hoạt động như nào?',
    a: 'Khi checkout, hệ thống tự tính tiền theo số ngày thực tế × giá đã chọn. Hoá đơn sinh tự động, bao gồm phòng + dịch vụ + khuyến mãi (nếu có). Xuất PDF ngay trên điện thoại.',
  },
  {
    q: 'Tôi có thể thêm phòng và nhân viên không?',
    a: 'Thoải mái! Thêm phòng, loại phòng, nhân viên bất cứ lúc nào. Mỗi nhân viên có tài khoản riêng để ghi log chăm sóc.',
  },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [extraRoomPrice, setExtraRoomPrice] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/payment/plans`).then(r => r.json()),
      fetch(`${API_URL}/payment/extra-room-price`).then(r => r.json()),
    ]).then(([p, ep]) => {
      setPlans(p);
      setExtraRoomPrice(ep.price);
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* ═══════════════════ NAVBAR ═══════════════════ */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0f172a]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileMenuOpen(false); }} className="cursor-pointer">
            <Image src="/logo.png" alt="PetLog" width={130} height={44} className="h-8 sm:h-9 w-auto" />
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#steps" className="hover:text-white transition-colors">Cách hoạt động</a>
            <a href="#features" className="hover:text-white transition-colors">Tại sao PetLog</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Đánh giá</a>
            <a href="#pricing" className="hover:text-white transition-colors">Bảng giá</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="/PetLog - Huong Dan Su Dung.html" target="_blank" className="hover:text-teal-400 transition-colors">📄 Hướng dẫn</a>
          </div>

          {/* Desktop buttons */}
          <div className="hidden sm:flex gap-3">
            <Link href="/login" className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-all">
              Đăng nhập
            </Link>
            <Link href="/register" className="px-4 py-2 rounded-lg text-sm bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors">
              Dùng thử miễn phí
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="sm:hidden p-2 rounded-lg hover:bg-white/5 transition-colors">
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu overlay — slides down over content */}
        <div className={`sm:hidden absolute left-0 right-0 top-full bg-[#0f172a]/98 backdrop-blur-xl border-t border-white/5 shadow-2xl shadow-black/50 overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}>
          <div className="px-4 py-4 space-y-1">
            <a href="#steps" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-slate-300 hover:bg-white/5 transition-colors">Cách hoạt động</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-slate-300 hover:bg-white/5 transition-colors">Tại sao PetLog</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-slate-300 hover:bg-white/5 transition-colors">Đánh giá</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-slate-300 hover:bg-white/5 transition-colors">Bảng giá</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-slate-300 hover:bg-white/5 transition-colors">FAQ</a>
            <a href="/PetLog - Huong Dan Su Dung.html" target="_blank" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-teal-400 hover:bg-white/5 transition-colors">📄 Hướng dẫn sử dụng</a>
            <div className="border-t border-white/5 pt-3 mt-3 flex gap-3">
              <Link href="/login" className="flex-1 text-center py-2.5 rounded-lg text-sm text-slate-300 border border-slate-700 hover:bg-white/5 transition-colors">
                Đăng nhập
              </Link>
              <Link href="/register" className="flex-1 text-center py-2.5 rounded-lg text-sm bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors">
                Dùng thử miễn phí
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] md:w-[800px] h-[400px] md:h-[600px] bg-teal-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-32 right-0 w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-green-500/8 rounded-full blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-16 sm:pt-16 sm:pb-20 md:pt-28 md:pb-32">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs sm:text-sm mb-4 sm:mb-6">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                Dùng thử 14 ngày miễn phí
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6">
                Quản lý Pet Hotel
                <br />
                <span className="bg-linear-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                  thông minh & linh hoạt
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-slate-400 leading-relaxed mb-6 sm:mb-8 max-w-xl">
                Check-in bằng QR. Giá phòng linh hoạt theo kg, số pet, loại phòng. Hoá đơn tự động. Nhật ký chăm sóc real-time.
                <strong className="text-slate-200"> Setup trong 5 phút.</strong>
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link href="/register"
                  className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-linear-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold text-base sm:text-lg shadow-xl shadow-teal-500/20 transition-all hover:shadow-teal-500/30 hover:-translate-y-0.5 text-center">
                  Dùng thử miễn phí ngay →
                </Link>
                <a href="#steps"
                  className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white font-medium text-base sm:text-lg transition-all text-center">
                  Xem cách hoạt động
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6 sm:mt-8 text-xs sm:text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> Không cần thẻ tín dụng</span>
                <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> Setup trong 5 phút</span>
                <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> Hỗ trợ Tiếng Việt</span>
              </div>
            </div>

            {/* Right: Mockup illustration */}
            <div className="relative hidden md:block">
              <div className="relative mx-auto w-full max-w-md">
                {/* Phone mockup */}
                <div className="absolute -top-4 -right-4 w-48 bg-slate-800 rounded-2xl border border-slate-700 p-3 shadow-2xl z-20 rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="bg-slate-900 rounded-xl p-4 text-center">
                    <div className="w-20 h-20 mx-auto bg-linear-to-br from-teal-500/20 to-green-500/20 rounded-xl flex items-center justify-center mb-3 border border-teal-500/30">
                      <svg viewBox="0 0 24 24" className="w-10 h-10 text-teal-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" /><circle cx="17.5" cy="17.5" r="3" />
                      </svg>
                    </div>
                    <p className="text-xs text-slate-400">Quét QR phòng</p>
                    <p className="text-xs text-teal-400 font-semibold mt-0.5">Phòng 01</p>
                  </div>
                </div>

                {/* Main dashboard mockup */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
                  {/* Title bar */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-900 border-b border-slate-700">
                    <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/60" /><div className="w-3 h-3 rounded-full bg-yellow-500/60" /><div className="w-3 h-3 rounded-full bg-green-500/60" /></div>
                    <span className="text-xs text-slate-500 ml-2">PetLog Dashboard</span>
                  </div>
                  {/* Content */}
                  <div className="p-5 space-y-4">
                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-900 rounded-lg p-3 text-center"><p className="text-xs text-slate-500">Tổng</p><p className="text-xl font-bold">10</p></div>
                      <div className="bg-green-500/10 rounded-lg p-3 text-center"><p className="text-xs text-green-400">Trống</p><p className="text-xl font-bold text-green-400">6</p></div>
                      <div className="bg-red-500/10 rounded-lg p-3 text-center"><p className="text-xs text-red-400">Có pet</p><p className="text-xl font-bold text-red-400">4</p></div>
                    </div>
                    {/* Room grid */}
                    <div className="grid grid-cols-4 gap-2">
                      {['P','M','','P','','','P','','','M'].map((pet, i) => (
                        <div key={i} className={`aspect-square rounded-lg flex items-center justify-center border ${
                          pet ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'
                        }`}>{pet ? <PawPrint size={14} className="text-slate-400" /> : <Check size={12} className="text-green-400" />}</div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Notification card */}
                <div className="absolute -bottom-6 -left-8 bg-slate-800 rounded-xl border border-slate-700 p-3 shadow-2xl z-20 -rotate-2 hover:rotate-0 transition-transform duration-500 w-56">
                  <div className="flex items-start gap-3">
                    <UtensilsCrossed size={20} className="text-amber-400 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-slate-200">Cho ăn — Phòng 03</p>
                      <p className="text-xs text-slate-500">Bé Mochi đã ăn xong</p>
                      <p className="text-xs text-teal-400 mt-0.5">2 phút trước</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ SOCIAL PROOF BAR ═══════════════════ */}
      <div className="border-y border-slate-800 bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-center">
          {[
            { num: '50+', label: 'Pet Hotel tin dùng' },
            { num: '2,500+', label: 'Lượt check-in/checkout' },
            { num: '10,000+', label: 'Nhật ký chăm sóc' },
            { num: '⭐ 4.9', label: 'Đánh giá trung bình' },
          ].map((stat, i) => (
            <div key={i}>
              <p className="text-xl sm:text-2xl font-bold text-white">{stat.num}</p>
              <p className="text-xs sm:text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════ 3 STEPS ═══════════════════ */}
      <section id="steps" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <p className="text-teal-400 font-semibold text-sm uppercase tracking-widest mb-3">Dễ như đếm 1-2-3</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">3 bước đơn giản để bắt đầu</h2>
            <p className="text-slate-400 mt-3 max-w-2xl mx-auto text-sm sm:text-base">Không cần kiến thức IT, không cần thiết bị đặc biệt. Chỉ cần 1 chiếc smartphone.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 sm:gap-6 md:gap-8 relative">
            {/* Connecting line */}
            <div className="hidden sm:block absolute top-12 md:top-16 left-[16%] right-[16%] h-0.5 bg-linear-to-r from-teal-500/30 via-teal-500/50 to-teal-500/30" />

            {[
              {
                step: '01',
                icon: ClipboardEdit,
                title: 'Tạo phòng & thiết lập giá',
                desc: 'Đăng ký miễn phí, tạo phòng và loại phòng (VIP, Standard...). Thiết lập bảng giá linh hoạt theo kg, số pet, hoặc theo ý bạn.',
                color: 'from-teal-500 to-teal-600',
              },
              {
                step: '02',
                icon: Printer,
                title: 'In QR & dán lên chuồng',
                desc: 'Hệ thống tạo mã QR cho mỗi phòng. In ra dán lên cửa chuồng — dán 1 lần, dùng mãi. Khách quét QR để check-in pet.',
                color: 'from-green-500 to-green-600',
              },
              {
                step: '03',
                icon: Sparkles,
                title: 'Vận hành & thu tiền',
                desc: 'Nhân viên ghi log chăm sóc. Checkout → hoá đơn tự động tính tiền. Theo dõi doanh thu, thống kê mọi lúc trên dashboard.',
                color: 'from-emerald-500 to-teal-600',
              },
            ].map((item, i) => (
              <div key={i} className="relative text-center group">
                {/* Step number circle */}
                <div className={`w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mx-auto rounded-full bg-linear-to-br ${item.color} p-[2px] mb-5 sm:mb-6`}>
                  <div className="w-full h-full rounded-full bg-[#0f172a] flex items-center justify-center">
                    {(() => { const Icon = item.icon; return <Icon size={32} className="sm:hidden text-teal-400 group-hover:scale-110 transition-transform duration-300" />; })()}
                    {(() => { const Icon = item.icon; return <Icon size={40} className="hidden sm:block text-teal-400 group-hover:scale-110 transition-transform duration-300" />; })()}
                  </div>
                </div>

                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-linear-to-r ${item.color}`}>
                    Bước {item.step}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm sm:text-base">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ WHY PETLOG ═══════════════════ */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 bg-linear-to-b from-slate-900/80 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <p className="text-teal-400 font-semibold text-sm uppercase tracking-widest mb-3">Tất cả trong 1 nền tảng</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Tính năng nổi bật</h2>
            <p className="text-slate-400 mt-3 max-w-2xl mx-auto text-sm sm:text-base">Từ check-in đến checkout, từ chăm sóc đến thu tiền — PetLog lo hết</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1: Giá linh hoạt */}
            <div className="rounded-2xl bg-slate-800/40 border border-slate-700/50 p-6 sm:p-8 hover:border-teal-500/30 transition-all group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-teal-500/10 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform"><ShieldCheck size={24} className="sm:hidden text-teal-400" /><ShieldCheck size={28} className="hidden sm:block text-teal-400" /></div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Giá phòng linh hoạt</h3>
              <p className="text-slate-400 leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base">
                Tạo <strong className="text-teal-300">bảng giá tự do</strong> cho mỗi loại phòng — theo kg, số pet, giống chó, hay bất kỳ tiêu chí nào bạn muốn. Không bị ép theo 1 cách tính.
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="text-teal-400">✓</span>
                <span>Chó 3-5kg: 200k · Chó &gt;15kg: 400k · 2 bé chung: 350k</span>
              </div>
            </div>

            {/* Feature 2: Hoá đơn tự động */}
            <div className="rounded-2xl bg-slate-800/40 border border-slate-700/50 p-6 sm:p-8 hover:border-amber-500/30 transition-all group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform"><Clock size={24} className="sm:hidden text-amber-400" /><Clock size={28} className="hidden sm:block text-amber-400" /></div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Hoá đơn & doanh thu tự động</h3>
              <p className="text-slate-400 leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base">
                Checkout → <strong className="text-amber-300">hoá đơn tự tính</strong>: phòng + dịch vụ + khuyến mãi. Theo dõi doanh thu theo ngày/tuần/tháng với biểu đồ trực quan.
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="text-amber-400">✗</span>
                <span className="line-through">Tính tiền bằng tay, sai sót liên tục</span>
              </div>
            </div>

            {/* Feature 3: Diary & Tin cậy */}
            <div className="rounded-2xl bg-slate-800/40 border border-slate-700/50 p-6 sm:p-8 hover:border-green-500/30 transition-all group sm:col-span-2 md:col-span-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform"><Heart size={24} className="sm:hidden text-green-400" /><Heart size={28} className="hidden sm:block text-green-400" /></div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Nhật ký real-time cho khách</h3>
              <p className="text-slate-400 leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base">
                Nhân viên ghi log chăm sóc (cho ăn, tắm, thuốc, dạo...) → chủ pet <strong className="text-green-300">xem diary online bất cứ lúc nào</strong>. Yên tâm, tin tưởng, quay lại!
              </p>
              <div className="flex items-center gap-2 text-sm text-green-400">
                <MessageCircle size={16} className="text-green-400" />
                <span className="italic">&quot;Gửi chỗ này yên tâm lắm!&quot;</span>
              </div>
            </div>
          </div>

          {/* Extra pain point callout */}
          <div className="mt-10 sm:mt-12 rounded-2xl bg-linear-to-r from-teal-500/10 to-green-500/10 border border-teal-500/20 p-6 sm:p-8 text-center">
            <p className="text-base sm:text-lg text-slate-300 mb-2">
              Bạn đang <strong className="text-white">tính tiền bằng tay, ghi sổ, nhắn Zalo</strong> từng khách?
            </p>
            <p className="text-sm sm:text-base text-slate-400">
              PetLog giúp bạn tự động hoá từ check-in → chăm sóc → hoá đơn → doanh thu. Setup 5 phút, miễn phí 3 phòng.
            </p>
            <Link href="/register" className="inline-block mt-5 sm:mt-6 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 font-medium transition-colors text-sm sm:text-base">
              Bắt đầu ngay — Miễn phí →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════ TESTIMONIALS ═══════════════════ */}
      <section id="testimonials" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <p className="text-teal-400 font-semibold text-sm uppercase tracking-widest mb-3">Khách hàng nói gì?</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Được tin dùng bởi các Pet Hotel</h2>
            <p className="text-slate-400 mt-3 text-sm sm:text-base">Hàng chục pet hotel trên cả nước đã chọn PetLog để nâng cao chất lượng dịch vụ</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'Nguyễn Thị Hương',
                role: 'Chủ Pet Paradise Hotel, TP.HCM',
                text: 'Giá phòng linh hoạt theo kg rất hay. Trước mình phải nhớ giá từng bé, giờ chỉ chọn mức giá là xong. Hoá đơn tự tính, không sai 1 đồng!',
                stars: 5,
                avatar: '🐕',
              },
              {
                name: 'Trần Minh Đức',
                role: 'Chủ Furry Friends Pet Hotel, Hà Nội',
                text: 'Tính năng diary real-time là "vũ khí" marketing số 1. Khách xem ảnh bé ăn, tắm, dạo — yên tâm và giới thiệu thêm bạn bè. Doanh thu tăng 30%!',
                stars: 5,
                avatar: '🐈',
              },
              {
                name: 'Lê Thanh Mai',
                role: 'Chủ Happy Paws, Đà Nẵng',
                text: 'Trước tính tiền bằng máy tính, hay sai. Giờ checkout bấm 1 nút là có hoá đơn, khách nhìn rõ ràng. Chuyên nghiệp hơn nhiều, nhân viên ai cũng dùng được!',
                stars: 5,
                avatar: '🐾',
              },
            ].map((t, i) => (
              <div key={i} className="rounded-2xl bg-slate-800/40 border border-slate-700/50 p-6 sm:p-8 hover:border-teal-500/30 transition-all relative">
                <Quote size={32} className="absolute top-4 right-4 text-teal-500/10" />
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, si) => (
                    <Star key={si} size={16} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                {/* Review text */}
                <p className="text-slate-300 leading-relaxed mb-6 text-sm sm:text-base italic">&ldquo;{t.text}&rdquo;</p>
                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-lg">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ PRICING ═══════════════════ */}
      <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <p className="text-teal-400 font-semibold text-sm uppercase tracking-widest mb-3">Đơn giản & minh bạch</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Bảng giá</h2>
            <p className="text-slate-400 mt-3 text-sm sm:text-base">Dùng thử 14 ngày miễn phí, nâng cấp trực tiếp khi cần</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => {
              const isPopular = plan.name === 'pro';
              const features = [
                `Tối đa ${plan.max_rooms} phòng`,
                'Giá phòng linh hoạt (bảng giá tự do)',
                'QR check-in + hoá đơn tự động',
                'Nhật ký chăm sóc real-time',
                'Thống kê doanh thu & biểu đồ',
              ];

              return (
                <div key={plan.id}
                  className={`relative rounded-2xl p-5 sm:p-6 border transition-all hover:-translate-y-1 duration-300 ${
                    isPopular
                      ? 'border-teal-500 bg-teal-500/10 shadow-xl shadow-teal-500/10 sm:scale-[1.03]'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}>
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-teal-500 text-white text-xs font-bold whitespace-nowrap">
                      <Star size={14} className="text-teal-300 inline" /> Phổ biến nhất
                    </div>
                  )}
                  <h3 className="text-lg sm:text-xl font-bold mb-1">{plan.display_name}</h3>
                  <p className="text-sm text-slate-500 mb-3">{plan.description}</p>
                  <div className="mb-5 sm:mb-6">
                    <span className="text-2xl sm:text-3xl font-bold text-white">{fmt(plan.price)}</span>
                    <span className="text-slate-500 text-sm">/tháng</span>
                  </div>
                  <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
                    {features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/register"
                    className={`block text-center py-2.5 sm:py-3 rounded-xl font-medium transition-colors text-sm sm:text-base ${
                      isPopular
                        ? 'bg-teal-600 hover:bg-teal-500 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    }`}>
                    Đăng ký ngay
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Extra rooms info */}
          {extraRoomPrice > 0 && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                <Plus size={14} className="text-purple-400" />
                <span className="text-sm text-purple-300">
                  Cần thêm phòng? Mua bổ sung với giá chỉ <strong className="text-white">{fmt(extraRoomPrice)}</strong>/phòng/tháng
                </span>
              </div>
            </div>
          )}

          {/* Trust badges */}
          <div className="mt-10 sm:mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: Lock, label: 'Thanh toán bảo mật', sub: 'Qua PayOS — hỗ trợ mọi ngân hàng VN', color: 'text-green-400' },
              { icon: Monitor, label: 'Mọi thiết bị', sub: 'Web app — không cần tải app', color: 'text-blue-400' },
              { icon: Globe, label: 'Server Việt Nam', sub: 'Dữ liệu lưu trữ an toàn tại VN', color: 'text-amber-400' },
              { icon: Headphones, label: 'Hỗ trợ nhanh', sub: 'Phản hồi trong vòng 24 giờ', color: 'text-purple-400' },
            ].map((badge, i) => {
              const Icon = badge.icon;
              return (
              <div key={i} className="text-center p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <Icon size={24} className={`${badge.color} mx-auto mb-2`} />
                <p className="text-sm font-semibold text-slate-200">{badge.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{badge.sub}</p>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ FAQ ═══════════════════ */}
      <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 bg-linear-to-b from-transparent to-slate-900/80">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <p className="text-teal-400 font-semibold text-sm uppercase tracking-widest mb-3">Câu hỏi thường gặp</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">FAQ</h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-slate-700 bg-slate-800/30 overflow-hidden transition-colors hover:border-slate-600">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left"
                >
                  <span className="font-medium pr-4 text-sm sm:text-base">{faq.q}</span>
                  <span className={`text-teal-400 text-xl transition-transform duration-300 shrink-0 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 pb-4 sm:pb-5' : 'max-h-0'}`}>
                  <p className="px-4 sm:px-5 text-slate-400 leading-relaxed text-sm sm:text-base">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ FINAL CTA ═══════════════════ */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-2xl sm:rounded-3xl bg-linear-to-br from-teal-600/20 to-green-600/10 border border-teal-500/20 px-6 sm:px-8 py-12 sm:py-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              Sẵn sàng nâng tầm Pet Hotel?
            </h2>
            <p className="text-base sm:text-lg text-slate-400 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Tham gia cùng hàng chục pet hotel đã tin dùng PetLog. 
              Setup trong 5 phút, dùng thử 14 ngày miễn phí.
            </p>

            <Link href="/register"
              className="inline-block px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl bg-linear-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold text-base sm:text-lg shadow-xl shadow-teal-500/20 transition-all hover:shadow-teal-500/30 hover:-translate-y-0.5">
              Dùng thử miễn phí ngay →
            </Link>

            <p className="text-xs sm:text-sm text-slate-500 mt-4">Không cần thẻ tín dụng · Hủy bất cứ lúc nào</p>
            <a href="/PetLog - Huong Dan Su Dung.html" target="_blank" className="inline-block mt-3 text-xs sm:text-sm text-teal-400 hover:text-teal-300 underline underline-offset-2 transition-colors">📄 Xem hướng dẫn sử dụng</a>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="border-t border-slate-800 py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Image src="/logo.png" alt="PetLog" width={100} height={32} className="h-6 sm:h-7 w-auto" />
            <span className="text-sm text-slate-600 hidden sm:inline">|</span>
            <span className="text-xs sm:text-sm text-slate-500 italic">Chăm sóc tận tâm — Công nghệ xứng tầm</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/PetLog - Huong Dan Su Dung.html" target="_blank" className="text-xs sm:text-sm text-slate-400 hover:text-teal-400 transition-colors">📄 Hướng dẫn</a>
            <p className="text-xs sm:text-sm text-slate-600">© 2026 PetLog. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
