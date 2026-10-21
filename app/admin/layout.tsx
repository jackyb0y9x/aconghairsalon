import React from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hệ Thống Quản Trị | Công Nguyễn Hair Salon',
  description: 'Trung tâm điều hành và quản trị nội dung Công Nguyễn Hair Salon CMS',
  robots: {
    index: false,
    follow: false,
  },
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // 1. Trích xuất đường dẫn request từ header máy chủ
  const headersList = headers();
  const currentPath =
    headersList.get('x-pathname') ||
    headersList.get('x-current-path') ||
    headersList.get('x-invoke-path') ||
    headersList.get('next-url') ||
    '';

  const isLoginPage = currentPath.includes('/admin/login');

  // 2. Xác thực phiên người dùng từ HTTP-only Cookie
  const user = await getCurrentUser();

  // 3. Xử lý kịch bản trang Login độc lập
  if (isLoginPage) {
    if (user) {
      // Đã đăng nhập hợp lệ -> điều hướng ngay vào Dashboard
      redirect('/admin');
    }
    // Chưa đăng nhập -> hiển thị form login sạch sẽ, không có sidebar/header
    return <>{children}</>;
  }

  // 4. Bảo vệ các trang quản trị khác: nếu chưa đăng nhập -> điều hướng về login
  if (!user) {
    redirect('/admin/login');
  }

  // 5. Render Khung giao diện Quản trị cao cấp (Luxury Admin Shell)
  return (
    <div className="min-h-screen bg-salon-noir text-salon-ivory flex">
      {/* Sidebar điều hướng phân quyền phía bên trái */}
      <AdminSidebar user={user} />

      {/* Vùng nội dung chính bên phải */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Topbar cố định với Breadcrumb và Cảnh báo */}
        <AdminHeader user={user} />

        {/* Khu vực render nội dung trang con */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-salon-noir via-salon-charcoal/25 to-salon-noir overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>

        {/* Thanh trạng thái chân trang quản trị */}
        <footer className="border-t border-salon-gold/10 px-6 py-3 text-xs text-zinc-500 flex flex-col sm:flex-row justify-between items-center gap-2 bg-salon-charcoal/40">
          <div>
            © 2026 <span className="text-salon-gold font-medium">Công Nguyễn Hair Salon</span>. Phân
            hệ Quản trị CMS v1.0.
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Cơ sở dữ liệu: Trực tuyến
            </span>
            <span>•</span>
            <span>Next.js App Router (Strict TS)</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
