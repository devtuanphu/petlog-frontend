import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "PetLog - Quản Lý Khách Sạn Thú Cưng Thông Minh",
  description: "Nền tảng giúp chủ khách sạn thú cưng số hóa quy trình vận hành. Khách quét QR check-in, nhân viên ghi nhật ký chăm sóc, chủ pet theo dõi real-time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
