# Kế Hoạch & Thiết Kế Kỹ Thuật: Admin Shell Layout, Role-Filtered Navigation & Dashboard Telemetry

- **Milestone:** M2 — Auth, RBAC & Admin Core
- **Agent:** M2 Explorer 2 (`teamwork_preview_explorer_m2_2`)
- **Working Directory:** `c:\Users\jacky\OneDrive\Máy tính\PhanTichNghiepVu\Teamcode\.agents\teamwork\teamwork_preview_explorer_m2_2`
- **Tài liệu tham chiếu:** `PROJECT.md`, `ORIGINAL_REQUEST.md`, `prisma/schema.prisma`, `tests/e2e/tier1-features/admin.test.ts`, `tests/harness/contract-simulator.ts`

---

## 1. Tổng Quan & Phạm Vi Trách Nhiệm (Scope & Boundaries)

Nhiệm vụ trọng tâm của Explorer 2 là nghiên cứu, phân tích và xây dựng đồ án thiết kế hoàn chỉnh (Implementation Blueprint) cho 3 khối thành phần chủ chốt của phân hệ Quản trị (Admin CMS):

1. **Khung giao diện Quản trị (Admin Shell Layout — `app/admin/layout.tsx`):**
   - Server Component thực thi kiểm tra phiên làm việc phía máy chủ (`Server-Side Session Check`).
   - Tự động điều hướng người dùng chưa xác thực về `/admin/login`, đồng thời xử lý ngoại lệ bỏ qua cho chính route `/admin/login` nhằm ngăn chặn vòng lặp chuyển hướng vô tận (Infinite Redirect Loop).
   - Thiết lập khung layout tối thượng phong cách Luxury Dark Atelier (`#0B0F17` Obsidian Noir, `#161B26` Charcoal Slate, `#D4AF37` Champagne Gold) bao gồm Sidebar cố định bên trái, Header cố định phía trên và vùng nội dung trung tâm cuộn độc lập.
2. **Hệ thống Điều hướng Phân quyền Động (Role-Filtered Navigation Components):**
   - `components/admin/AdminSidebar.tsx`: Thanh điều hướng phân nhóm nghiệp vụ (Điều hành, Nội dung, Truyền thông, Hệ thống), tự động lọc hiển thị các menu mục dựa trên 4 vai trò quản trị (`SUPER_ADMIN`, `CONTENT_ADMIN`, `BOOKING_STAFF`, `EDITOR`). Tích hợp nhận diện route đang chọn (`usePathname`), ngăn kéo di động (Mobile Drawer) và thẻ hồ sơ nhân sự kèm nút đăng xuất nhanh.
   - `components/admin/AdminHeader.tsx`: Thanh tiêu đề phía trên hiển thị đường dẫn Breadcrumb động tiếng Việt, huy hiệu cảnh báo lịch hẹn chờ xác nhận thời gian thực (`Pending Alert Badge`), nút xem nhanh website công khai (`/`) và huy hiệu vai trò nhân viên.
3. **API Tổng hợp Số liệu & Trang Giám sát Dashboard (Telemetry & Analytics):**
   - `app/api/admin/dashboard/route.ts`: API Route Handler bảo mật nghiêm ngặt bằng Session & RBAC, thực hiện truy vấn đồng thời (`Promise.all`) trên cơ sở dữ liệu PostgreSQL qua Prisma ORM để trả về 7 chỉ số thời gian thực: `totalHairstyles`, `totalColors`, `totalServices`, `totalArticles`, `pendingBookingsCount`, `todayBookingsCount` và `recentAuditLogs`.
   - `app/admin/page.tsx`: Giao diện Dashboard quản trị trực quan với banner cảnh báo lịch hẹn chờ duyệt nổi bật, 4 thẻ chỉ số KPI thống kê mạ vàng, thanh phím tắt thao tác nhanh (Quick Actions), danh sách lịch hẹn chờ xác nhận mới nhất và dòng sự kiện kiểm toán hệ thống gần đây.

### Ma trận Tương tác giữa các Explorer Milestone 2

| Explorer | Phụ trách chính | Điểm giao tiếp & Tích hợp với Explorer 2 |
|---|---|---|
| **Explorer 1** | Auth API (`/api/auth/*`), Trang Login (`app/admin/login/page.tsx`), RBAC Guard Core | `lib/auth.ts`: Hàm `getCurrentUser()`, `verifySession()`, `SESSION_COOKIE_NAME = 'salon_session'`, và cơ chế cookie/header token. `AdminLayout` sử dụng các hàm này để bảo vệ route. |
| **Explorer 2 (Hiện tại)** | Admin Shell Layout, Sidebar/Header, Dashboard API & Dashboard UI Page | Cung cấp khung bao bọc (`layout.tsx`) chứa Sidebar/Header cho toàn bộ trang con trong `/admin`. Cung cấp API `/api/admin/dashboard` phục vụ kiểm tra KPI và cảnh báo toàn phân hệ. |
| **Explorer 3** | Site Settings (`/admin/settings`), Audit Logs (`/admin/audit-logs`) | Sidebar của Explorer 2 điều hướng đến `/admin/settings` và `/admin/audit-logs` (chỉ hiển thị cho `SUPER_ADMIN`). Dashboard của Explorer 2 trích xuất 5 nhật ký thao tác gần nhất từ bảng `AuditLog`. |

---

## 2. Thiết Kế Khung Giao Diện Quản Trị (`app/admin/layout.tsx`)

### 2.1. Thách thức Kiến trúc & Giải Pháp Bypass Trang Login

Trong Next.js 14 App Router, file `app/admin/layout.tsx` bao bọc tất cả các route con bên dưới `/admin`, bao gồm cả `/admin/login/page.tsx`.
- **Rủi ro:** Nếu `layout.tsx` gọi `requireAdmin()` hoặc `getCurrentUser()` và ngay lập tức `redirect('/admin/login')` khi không có phiên, người dùng chưa đăng nhập khi truy cập `/admin/login` sẽ bị kích hoạt redirect lặp lại chính `/admin/login` dẫn đến lỗi `ERR_TOO_MANY_REDIRECTS`. Hơn nữa, trang đăng nhập không được chứa thanh Sidebar và Header của quản trị viên.
- **Giải pháp tối ưu:**
  1. Sử dụng `headers()` từ `next/headers` để kiểm tra URL hoặc đường dẫn được forward từ middleware (thông qua header `x-pathname` hoặc `next-url`).
  2. Nếu người dùng đang truy cập route con `/admin/login`:
     - Nếu đã đăng nhập (`user !== null`) -> Tự động chuyển hướng vào `/admin` (tránh để nhân viên đã đăng nhập phải thấy form đăng nhập).
     - Nếu chưa đăng nhập -> Render trực tiếp `{children}` mà **không** bao bọc giao diện Shell (không render `AdminSidebar` và `AdminHeader`).
  3. Với tất cả các trang quản trị còn lại (`/admin`, `/admin/bookings`, `/admin/hairstyles`,...):
     - Nếu chưa đăng nhập (`!user`) -> Chuyển hướng về `/admin/login`.
     - Nếu đã đăng nhập -> Render đầy đủ khung quản trị Luxury Dark Atelier với Sidebar, Header và Main Content.

### 2.2. Bố Cục Giao Diện & Design Tokens

Tuân thủ nghiêm ngặt hệ thống Design Tokens định nghĩa trong `tailwind.config.ts` và `app/globals.css`:
- **Nền chính:** `bg-salon-noir` (`#0B0F17`) kết hợp gradient chìm `from-salon-noir via-salon-charcoal/30 to-salon-noir`.
- **Thanh bên (Sidebar):** `w-64 lg:w-72 bg-salon-charcoal/95 border-r border-salon-gold/15 backdrop-blur-md`. Cố định toàn bộ chiều cao màn hình `h-screen sticky top-0`.
- **Thanh đỉnh (Header):** `h-16 bg-salon-charcoal/80 border-b border-salon-gold/15 backdrop-blur-md sticky top-0 z-30`.
- **Vùng nội dung (Main):** `flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto`.
- **Màu chữ:** Tiêu đề và nội dung chính sử dụng `text-salon-ivory` (`#FDFBF7`), điểm xuyết vàng `text-salon-gold` (`#D4AF37`), chú thích `text-zinc-400`.

### 2.3. Blueprint Chi Tiết `app/admin/layout.tsx`

```tsx
import React from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export const metadata = {
  title: 'Hệ Thống Quản Trị | Lumière Hair Atelier',
  description: 'Trung tâm điều hành và quản trị nội dung Lumière Hair Atelier CMS',
  robots: 'noindex, nofollow',
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // 1. Trích xuất đường dẫn request từ header máy chủ
  const headersList = headers();
  const currentPath =
    headersList.get('x-pathname') ||
    headersList.get('x-invoke-path') ||
    headersList.get('referer') ||
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
    return (
      <div className="min-h-screen bg-salon-noir text-salon-ivory flex items-center justify-center p-4">
        {children}
      </div>
    );
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
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>

        {/* Thanh trạng thái chân trang quản trị */}
        <footer className="border-t border-salon-gold/10 px-6 py-3 text-xs text-zinc-500 flex flex-col sm:flex-row justify-between items-center gap-2 bg-salon-charcoal/40">
          <div>
            © 2026 <span className="text-salon-gold font-medium">Lumière Hair Atelier</span>. Phân hệ Quản trị CMS v1.0.
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
```

---

## 3. Thiết Kế Thanh Điều Hướng Phân Quyền (`components/admin/AdminSidebar.tsx`)

### 3.1. Ma Trận Phân Quyền Navigation (RBAC Navigation Matrix)

Hệ thống hỗ trợ 4 vai trò quản trị. Mỗi liên kết điều hướng phải được kiểm tra đối chiếu với vai trò của nhân viên đang đăng nhập:

```typescript
export interface NavItemConfig {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: AdminRole[];
  badge?: string;
  description?: string;
}

export interface NavGroupConfig {
  groupTitle: string;
  items: NavItemConfig[];
}
```

Danh sách phân nhóm 10 mục quản trị nghiệp vụ:

| Nhóm | Menu Mục | Đường dẫn (`href`) | Icon (`lucide-react`) | Vai trò được phép (`allowedRoles`) |
|---|---|---|---|---|
| **Điều Hành & Lịch Hẹn** | Tổng quan Dashboard | `/admin` | `LayoutDashboard` | `SUPER_ADMIN`, `CONTENT_ADMIN`, `BOOKING_STAFF`, `EDITOR` |
| | Quản lý Lịch hẹn | `/admin/bookings` | `CalendarCheck` | `SUPER_ADMIN`, `BOOKING_STAFF` |
| **Danh Mục & Dịch Vụ** | Bộ sưu tập Kiểu tóc | `/admin/hairstyles` | `Scissors` | `SUPER_ADMIN`, `CONTENT_ADMIN` |
| | Bảng màu tóc & Swatch | `/admin/colors` | `Palette` | `SUPER_ADMIN`, `CONTENT_ADMIN` |
| | Dịch vụ & Bảng giá | `/admin/services` | `Sparkles` | `SUPER_ADMIN`, `CONTENT_ADMIN` |
| | Bộ sưu tập Before/After | `/admin/before-after` | `SplitSquareVertical` | `SUPER_ADMIN`, `CONTENT_ADMIN` |
| **Truyền Thông & Nội Dung** | Banner trang chủ | `/admin/banners` | `Image` | `SUPER_ADMIN`, `CONTENT_ADMIN` |
| | Bài viết cẩm nang | `/admin/articles` | `FileText` | `SUPER_ADMIN`, `CONTENT_ADMIN`, `EDITOR` |
| **Quản Trị Hệ Thống** | Cấu hình Salon | `/admin/settings` | `Settings` | `SUPER_ADMIN` |
| | Nhật ký hệ thống | `/admin/audit-logs` | `ShieldAlert` | `SUPER_ADMIN` |

### 3.2. Cấu Trúc Thành Phần & Xử Lý Tương Tác

- **Client Component (`"use client"`):** Cần lắng nghe `usePathname()` để kích hoạt class active:
  - Khi active: Nền `bg-salon-gold/15 text-salon-gold border-l-4 border-salon-gold shadow-gold-subtle font-semibold`.
  - Khi inactive: `text-zinc-400 hover:text-salon-gold hover:bg-salon-gold/5 transition-all duration-200`.
- **Nhận diện tiền tố chính xác:** Menu `/admin` chỉ active khi `pathname === '/admin'`, trong khi `/admin/hairstyles` active khi `pathname.startsWith('/admin/hairstyles')`.
- **Trạng thái Di động (Responsive Mobile Drawer):** Tích hợp hỗ trợ đóng/mở drawer khi xem trên điện thoại và máy tính bảng thông qua props `isMobileOpen` và `onMobileClose`.
- **Hồ sơ Nhân viên & Nút Đăng xuất ở Chân Sidebar:**
  - Hiển thị tên `user.fullName` và email.
  - Huy hiệu vai trò được phân biệt màu sắc:
    - `SUPER_ADMIN`: Viền mạ vàng `border-amber-500/40 bg-amber-500/10 text-amber-300`.
    - `CONTENT_ADMIN`: Viền xanh dương `border-blue-500/40 bg-blue-500/10 text-blue-300`.
    - `BOOKING_STAFF`: Viền ngọc lục bảo `border-emerald-500/40 bg-emerald-500/10 text-emerald-300`.
    - `EDITOR`: Viền tím thạch anh `border-purple-500/40 bg-purple-500/10 text-purple-300`.
  - Nút đăng xuất kích hoạt `POST /api/auth/logout`, xóa cookie phiên và chuyển hướng an toàn về `/admin/login`.

### 3.3. Blueprint Chi Tiết `components/admin/AdminSidebar.tsx`

```tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck,
  Scissors,
  Palette,
  Sparkles,
  SplitSquareVertical,
  Image as ImageIcon,
  FileText,
  Settings,
  ShieldAlert,
  LogOut,
  X,
  User as UserIcon,
  ChevronRight,
} from 'lucide-react';
import type { SessionUserData, AdminRole } from '@/lib/auth';

interface AdminSidebarProps {
  user: SessionUserData;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: AdminRole[];
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

const NAVIGATION_GROUPS: NavGroup[] = [
  {
    groupName: 'ĐIỀU HÀNH & ĐẶT LỊCH',
    items: [
      {
        title: 'Tổng quan Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
        roles: ['SUPER_ADMIN', 'CONTENT_ADMIN', 'BOOKING_STAFF', 'EDITOR'],
      },
      {
        title: 'Quản lý Lịch hẹn',
        href: '/admin/bookings',
        icon: CalendarCheck,
        roles: ['SUPER_ADMIN', 'BOOKING_STAFF'],
      },
    ],
  },
  {
    groupName: 'DANH MỤC & DỊCH VỤ',
    items: [
      {
        title: 'Bộ sưu tập Kiểu tóc',
        href: '/admin/hairstyles',
        icon: Scissors,
        roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'],
      },
      {
        title: 'Bảng màu tóc Swatches',
        href: '/admin/colors',
        icon: Palette,
        roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'],
      },
      {
        title: 'Dịch vụ & Bảng giá',
        href: '/admin/services',
        icon: Sparkles,
        roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'],
      },
      {
        title: 'Bộ sưu tập Before/After',
        href: '/admin/before-after',
        icon: SplitSquareVertical,
        roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'],
      },
    ],
  },
  {
    groupName: 'TRUYỀN THÔNG & TIN TỨC',
    items: [
      {
        title: 'Banner trang chủ',
        href: '/admin/banners',
        icon: ImageIcon,
        roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'],
      },
      {
        title: 'Bài viết cẩm nang',
        href: '/admin/articles',
        icon: FileText,
        roles: ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'],
      },
    ],
  },
  {
    groupName: 'QUẢN TRỊ HỆ THỐNG',
    items: [
      {
        title: 'Cấu hình Salon',
        href: '/admin/settings',
        icon: Settings,
        roles: ['SUPER_ADMIN'],
      },
      {
        title: 'Nhật ký hệ thống',
        href: '/admin/audit-logs',
        icon: ShieldAlert,
        roles: ['SUPER_ADMIN'],
      },
    ],
  },
];

export function AdminSidebar({ user, isMobileOpen = false, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const getRoleBadge = (role: AdminRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return {
          label: 'Super Admin',
          classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
      case 'CONTENT_ADMIN':
        return {
          label: 'Content Lead',
          classes: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        };
      case 'BOOKING_STAFF':
        return {
          label: 'Lễ Tân Đặt Lịch',
          classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        };
      case 'EDITOR':
        return {
          label: 'Biên Tập Viên',
          classes: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        };
      default:
        return {
          label: role,
          classes: 'bg-zinc-700/20 text-zinc-300 border-zinc-600/30',
        };
    }
  };

  const roleBadge = getRoleBadge(user.role.name);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-salon-charcoal/95 border-r border-salon-gold/15 select-none">
      {/* 1. Atelier Brand Header */}
      <div className="p-6 border-b border-salon-gold/10 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-salon-gold via-salon-gold-dark to-amber-700 flex items-center justify-center text-salon-noir shadow-gold-subtle group-hover:scale-105 transition-transform duration-200">
            <Scissors className="w-5 h-5 text-salon-noir stroke-[2.2]" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold tracking-wider text-salon-ivory uppercase leading-none">
              Lumière
            </h1>
            <p className="text-[10px] tracking-widest text-salon-gold font-medium uppercase mt-1">
              Hair Atelier CMS
            </p>
          </div>
        </Link>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden text-zinc-400 hover:text-salon-gold p-1.5 rounded-lg hover:bg-salon-surface"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Scrollable Navigation Menu Groups */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 custom-scrollbar">
        {NAVIGATION_GROUPS.map((group) => {
          // Lọc danh sách mục theo vai trò
          const filteredItems = group.items.filter((item) =>
            item.roles.includes(user.role.name)
          );

          if (filteredItems.length === 0) return null;

          return (
            <div key={group.groupName} className="space-y-1.5">
              <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-3 mb-2">
                {group.groupName}
              </h3>
              <div className="space-y-1">
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onMobileClose}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                        isActive
                          ? 'bg-salon-gold/15 text-salon-gold border-l-4 border-salon-gold shadow-gold-subtle font-semibold'
                          : 'text-zinc-400 hover:text-salon-gold hover:bg-salon-gold/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive
                              ? 'text-salon-gold'
                              : 'text-zinc-400 group-hover:text-salon-gold'
                          }`}
                        />
                        <span>{item.title}</span>
                      </div>
                      {isActive && (
                        <ChevronRight className="w-3.5 h-3.5 text-salon-gold animate-pulse" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. User Staff Profile & Logout Footer */}
      <div className="p-4 border-t border-salon-gold/10 bg-salon-noir/50">
        <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-salon-charcoal/80 border border-salon-gold/10">
          <div className="w-9 h-9 rounded-full bg-salon-gold/20 border border-salon-gold/40 flex items-center justify-center text-salon-gold font-bold text-xs uppercase overflow-hidden">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>
                {user.fullName
                  .split(' ')
                  .map((w) => w[0])
                  .slice(-2)
                  .join('')}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-salon-ivory truncate">
              {user.fullName}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-tight ${roleBadge.classes}`}
              >
                {roleBadge.label}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-300 hover:text-rose-100 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors disabled:opacity-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất hệ thống'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Cố định w-64 / w-72) */}
      <aside className="hidden md:block w-64 lg:w-72 h-screen sticky top-0 z-20 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Off-canvas Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
```

---

## 4. Thiết Kế Thanh Tiêu Đề Quản Trị (`components/admin/AdminHeader.tsx`)

### 4.1. Chức Năng Nổi Bật

1. **Breadcrumb Tự Động Phân Giải (Dynamic Breadcrumbs):**
   - Ánh xạ đường dẫn `pathname` sang tên màn hình tiếng Việt thân thiện.
   - Ví dụ: `/admin/bookings` -> `Trang quản trị / Quản lý Lịch hẹn`.
2. **Huy Hiệu Cảnh Báo Lịch Hẹn Chờ Duyệt (Real-Time Pending Alert Indicator):**
   - Tự động gọi API `/api/admin/dashboard` để lấy `pendingBookingsCount`.
   - Nếu `pendingBookingsCount > 0`: Hiển thị chuông thông báo màu vàng hổ phách nhấp nháy (`animate-pulse`) kèm số lượng lịch chờ duyệt. Nhấp chuột dẫn thẳng đến `/admin/bookings?status=PENDING`.
3. **Phím Tắt Xem Website Công Khai (Public Website Quick Link):**
   - Nút "Xem Website" dẫn ra trang chủ công khai `/` trong tab mới (`target="_blank"`), giúp nhân viên xem trước kết quả thay đổi nội dung.
4. **Nút Mở Menu Trên Di Động (Mobile Drawer Toggle):**
   - Icon Hamburger hiển thị trên màn hình nhỏ `< md`, điều khiển hiển thị Sidebar.

### 4.2. Blueprint Chi Tiết `components/admin/AdminHeader.tsx`

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Bell,
  ExternalLink,
  ChevronRight,
  Shield,
  RefreshCw,
} from 'lucide-react';
import type { SessionUserData } from '@/lib/auth';
import { AdminSidebar } from './AdminSidebar';

interface AdminHeaderProps {
  user: SessionUserData;
}

const ROUTE_NAME_MAP: Record<string, string> = {
  '/admin': 'Tổng quan Dashboard',
  '/admin/bookings': 'Quản lý Lịch hẹn',
  '/admin/hairstyles': 'Bộ sưu tập Kiểu tóc',
  '/admin/colors': 'Bảng màu tóc Swatches',
  '/admin/services': 'Dịch vụ & Bảng giá',
  '/admin/before-after': 'Bộ sưu tập Before/After',
  '/admin/banners': 'Banner trang chủ',
  '/admin/articles': 'Bài viết cẩm nang',
  '/admin/settings': 'Cấu hình Salon',
  '/admin/audit-logs': 'Nhật ký hệ thống',
};

export function AdminHeader({ user }: AdminHeaderProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Lấy dữ liệu cảnh báo số lượng lịch hẹn chờ duyệt
  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        setPendingCount(data.pendingBookingsCount ?? 0);
      }
    } catch {
      // Bỏ qua lỗi kết nối nền
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 45000); // Tự động làm mới mỗi 45 giây
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchAlerts();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Xác định tiêu đề Breadcrumb
  const currentTitle =
    ROUTE_NAME_MAP[pathname] ||
    Object.entries(ROUTE_NAME_MAP).find(([key]) => key !== '/admin' && pathname.startsWith(key))?.[1] ||
    'Quản trị viên';

  return (
    <>
      <header className="h-16 bg-salon-charcoal/80 border-b border-salon-gold/15 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
        {/* Phía trái: Mobile Toggle & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden text-zinc-300 hover:text-salon-gold p-2 rounded-lg hover:bg-salon-surface"
            aria-label="Mở menu quản trị"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
            <Link
              href="/admin"
              className="hover:text-salon-gold transition-colors hidden sm:inline"
            >
              CMS Atelier
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 hidden sm:inline" />
            <span className="text-salon-ivory font-semibold truncate max-w-[200px] sm:max-w-xs">
              {currentTitle}
            </span>
          </nav>
        </div>

        {/* Phía phải: Cảnh báo, Phím tắt, Hồ sơ */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Nút làm mới dữ liệu nhanh */}
          <button
            onClick={handleManualRefresh}
            className="p-2 text-zinc-400 hover:text-salon-gold rounded-lg hover:bg-salon-surface transition-colors"
            title="Làm mới thông số dữ liệu"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-salon-gold' : ''}`}
            />
          </button>

          {/* Huy hiệu cảnh báo lịch hẹn chờ xác nhận */}
          {pendingCount !== null && pendingCount > 0 && (
            <Link
              href="/admin/bookings?status=PENDING"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-all group"
              title="Xem danh sách lịch hẹn chờ xác nhận"
            >
              <div className="relative">
                <Bell className="w-4 h-4 text-amber-400" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500"></span>
              </div>
              <span className="text-xs font-bold tracking-tight">
                {pendingCount} chờ duyệt
              </span>
            </Link>
          )}

          {/* Phím tắt mở Website công khai */}
          <Link
            href="/"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-salon-gold border border-zinc-700 hover:border-salon-gold/40 rounded-lg bg-salon-noir/50 transition-colors"
          >
            <span>Xem Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {/* Huy hiệu vai trò tài khoản */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-salon-surface/60 border border-salon-gold/10 text-xs text-zinc-300">
            <Shield className="w-3.5 h-3.5 text-salon-gold" />
            <span className="font-semibold text-salon-gold">{user.role.name}</span>
          </div>
        </div>
      </header>

      {/* Tích hợp Sidebar phiên bản Drawer di động */}
      <AdminSidebar
        user={user}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
}
```

---

## 5. Thiết Kế API Thu Thập Số Liệu Dashboard (`app/api/admin/dashboard/route.ts`)

### 5.1. Yêu Cầu Hợp Đồng Kiểm Thử & An Toàn Bảo Mật

Qua rà soát mã nguồn các bộ kiểm thử E2E:
1. `tests/e2e/tier1-features/admin.test.ts` (TC1.7):
   ```typescript
   expect(res.status).toBe(200);
   expect(res.data).toHaveProperty('totalHairstyles');
   expect(res.data).toHaveProperty('totalColors');
   expect(res.data).toHaveProperty('totalServices');
   expect(res.data).toHaveProperty('pendingBookingsCount');
   expect(res.data.totalHairstyles).toBeGreaterThanOrEqual(2);
   expect(res.data.totalServices).toBeGreaterThanOrEqual(2);
   ```
2. `tests/e2e/tier1-features/auth.test.ts` (TC1.27):
   ```typescript
   const dashboardRes = await ctx.client.get('/api/admin/dashboard');
   expect(dashboardRes.status).toBe(401);
   expect(dashboardRes.data.error).toContain('Unauthorized');
   ```
3. `tests/e2e/tier4-scenarios/customer-booking-journey.test.ts` (TC4.1):
   - Vai trò `BOOKING_STAFF` truy cập `/api/admin/dashboard` thành công với status 200 và kiểm tra `pendingBookingsCount >= 1`.
4. `tests/e2e/tier4-scenarios/content-management-lifecycle.test.ts` (TC4.6):
   - Kiểm tra `totalHairstyles` tăng lên chính xác 1 đơn vị sau khi tạo kiểu tóc mới qua `/api/admin/hairstyles`.
5. `tests/harness/contract-simulator.ts` (Line 213-227):
   - Cung cấp thêm trường `totalArticles`, `todayBookingsCount` và `recentAuditLogs`.

### 5.2. Giải Quyết Vấn Đề Timezone & Ngày Hẹn Trong Ngày (`todayBookingsCount`)

Trong schema Prisma, `Booking.bookingDate` có kiểu `@db.Date`.
- Nếu dùng `new Date().toISOString().split('T')[0]`, hệ thống trên Vercel chạy giờ UTC (UTC+0), trong khi khách hàng và salon tại Việt Nam nằm ở múi giờ GMT+7. Lúc 2 giờ sáng tại Việt Nam (ngày 20), server UTC vẫn đang ở 19h ngày 19.
- **Giải pháp:** Sử dụng múi giờ chuẩn Việt Nam `Asia/Ho_Chi_Minh` để tính toán khoảng bắt đầu và kết thúc của ngày hôm nay:
  ```typescript
  const nowVN = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const todayStr = `${nowVN.getFullYear()}-${String(nowVN.getMonth() + 1).padStart(2, '0')}-${String(nowVN.getDate()).padStart(2, '0')}`;
  const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);
  ```

### 5.3. Blueprint Chi Tiết `app/api/admin/dashboard/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth';

/**
 * GET /api/admin/dashboard
 * Tổng hợp các chỉ số telemetry thời gian thực phục vụ Dashboard quản trị.
 * Được bảo vệ bởi RBAC: cho phép tất cả các vai trò quản trị (SUPER_ADMIN, CONTENT_ADMIN, BOOKING_STAFF, EDITOR).
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Trích xuất token xác thực từ Cookies hoặc Authorization Bearer Header
    let token =
      request.cookies.get(SESSION_COOKIE_NAME)?.value ||
      request.cookies.get('session')?.value;

    if (!token) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: Vui lòng đăng nhập để truy cập dữ liệu quản trị' },
        { status: 401 }
      );
    }

    // 2. Xác minh phiên làm việc
    const user = await verifySession(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Phiên làm việc không hợp lệ hoặc đã hết hạn' },
        { status: 401 }
      );
    }

    // 3. Tính toán mốc ngày hôm nay theo múi giờ Việt Nam (UTC+7)
    const nowVN = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const todayStr = `${nowVN.getFullYear()}-${String(nowVN.getMonth() + 1).padStart(2, '0')}-${String(nowVN.getDate()).padStart(2, '0')}`;
    const startOfToday = new Date(`${todayStr}T00:00:00.000Z`);
    const endOfToday = new Date(`${todayStr}T23:59:59.999Z`);

    // 4. Thực thi các truy vấn song song qua Promise.all để tối ưu hiệu năng
    const [
      totalHairstyles,
      totalColors,
      totalServices,
      totalArticles,
      pendingBookingsCount,
      todayBookingsCount,
      recentAuditLogsRaw,
      recentPendingBookings,
    ] = await Promise.all([
      // Tổng số kiểu tóc
      prisma.hairstyle.count(),
      // Tổng số màu tóc
      prisma.hairColor.count(),
      // Tổng số dịch vụ
      prisma.service.count(),
      // Tổng số bài viết
      prisma.article.count(),
      // Số lịch hẹn đang chờ xác nhận
      prisma.booking.count({
        where: { status: 'PENDING' },
      }),
      // Số lịch hẹn hôm nay
      prisma.booking.count({
        where: {
          bookingDate: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      }),
      // 5 sự kiện nhật ký kiểm toán gần nhất
      prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          actorName: true,
          actorRole: true,
          createdAt: true,
          details: true,
        },
      }),
      // 5 lịch hẹn chờ duyệt gần nhất hiển thị bảng điều khiển
      prisma.booking.findMany({
        where: { status: 'PENDING' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          bookingCode: true,
          customerName: true,
          customerPhone: true,
          bookingDate: true,
          timeSlot: true,
          createdAt: true,
          service: {
            select: { title: true, durationMinutes: true, priceMin: true },
          },
          hairstyleRef: {
            select: { title: true },
          },
        },
      }),
    ]);

    // 5. Chuẩn hóa cấu trúc Audit Logs tương thích các bộ kiểm thử
    const recentAuditLogs = recentAuditLogsRaw.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entityType, // Ánh xạ tương thích TC1.12 (expect(latestLog.entity).toBe(...))
      entityType: log.entityType,
      entityId: log.entityId,
      actorName: log.actorName,
      actorRole: log.actorRole,
      timestamp: log.createdAt.toISOString(),
      createdAt: log.createdAt.toISOString(),
      details: log.details,
    }));

    // 6. Trả về Response theo đúng hợp đồng dữ liệu chuẩn
    return NextResponse.json({
      totalHairstyles,
      totalColors,
      totalServices,
      totalArticles,
      pendingBookingsCount,
      todayBookingsCount,
      recentAuditLogs,
      recentPendingBookings,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Admin Dashboard API Error]:', error);
    return NextResponse.json(
      { error: 'Internal Server Error khi tổng hợp số liệu Dashboard' },
      { status: 500 }
    );
  }
}
```

---

## 6. Thiết Kế Trang Bảng Điều Khiển Quản Trị (`app/admin/page.tsx`)

### 6.1. Kiến Trúc Trang & Phân Bổ Thành Phần

Trang `app/admin/page.tsx` áp dụng kiến trúc Server Component kết hợp với Client View con (`components/admin/DashboardOverview.tsx`):
- **Server Component (`app/admin/page.tsx`):**
  - Trực tiếp nạp thông số phiên qua `requireAdmin()`.
  - Gọi tầng tổng hợp dữ liệu để server-render các chỉ số KPI ban đầu (Zero-CLS, tải ngay tức thì không giật màn hình).
- **Client Interactive Subcomponents:**
  - `PendingAlertBanner.tsx`: Cảnh báo rực rỡ khi có lịch hẹn chờ duyệt.
  - `StatCard.tsx`: Thẻ hiển thị chỉ số mạ vàng phong cách sang trọng.
  - `QuickActions.tsx`: Các phím tắt tạo nhanh phù hợp với từng vai trò nhân viên.
  - `RecentBookingsFeed.tsx`: Bảng xử lý nhanh các lịch hẹn mới nhất.
  - `RecentActivityFeed.tsx`: Danh sách sự kiện kiểm toán thời gian thực.

### 6.2. Blueprint Chi Tiết `app/admin/page.tsx`

```tsx
import React from 'react';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  Scissors,
  Palette,
  Sparkles,
  Calendar,
  Clock,
  ArrowRight,
  PlusCircle,
  FileText,
  CalendarCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { formatVND, formatDateVN, formatRelativeTimeVN, formatPhoneNumber } from '@/lib/utils';

export const metadata = {
  title: 'Bảng Điều Khiển Quản Trị | Lumière Hair Atelier',
};

// Không lưu cache tĩnh, luôn cập nhật dữ liệu mới nhất
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  // 1. Kiểm tra xác thực phía máy chủ
  const user = await requireAdmin();

  // 2. Lấy ngày hôm nay theo giờ Việt Nam
  const nowVN = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const todayStr = `${nowVN.getFullYear()}-${String(nowVN.getMonth() + 1).padStart(2, '0')}-${String(nowVN.getDate()).padStart(2, '0')}`;
  const startOfToday = new Date(`${todayStr}T00:00:00.000Z`);
  const endOfToday = new Date(`${todayStr}T23:59:59.999Z`);

  // 3. Nạp song song các chỉ số trực tiếp từ Database
  const [
    totalHairstyles,
    totalColors,
    totalServices,
    totalArticles,
    pendingBookingsCount,
    todayBookingsCount,
    recentPendingBookings,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.hairstyle.count(),
    prisma.hairColor.count(),
    prisma.service.count(),
    prisma.article.count(),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.booking.count({
      where: {
        bookingDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    }),
    prisma.booking.findMany({
      where: { status: 'PENDING' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        service: true,
        hairstyleRef: true,
      },
    }),
    prisma.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Tiêu đề chào mừng & Thông tin thời gian */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-salon-gold/15">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-salon-gold mb-1">
            <span className="w-2 h-2 rounded-full bg-salon-gold animate-pulse"></span>
            Hệ thống Quản trị & Điều phối
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-salon-ivory">
            Xin chào, {user.fullName}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Báo cáo số liệu thời gian thực cho ngày hôm nay, {formatDateVN(nowVN)}.
          </p>
        </div>
      </div>

      {/* 2. Banner Cảnh Báo Lịch Hẹn Chờ Duyệt (Chỉ hiển thị khi có lịch PENDING) */}
      {pendingBookingsCount > 0 && (
        <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-amber-950/20">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 flex-shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-amber-200">
                Có {pendingBookingsCount} lịch hẹn trực tuyến đang chờ xác nhận!
              </h3>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Vui lòng kiểm tra và gọi điện xác nhận dịch vụ cho khách hàng trong vòng 15 phút.
              </p>
            </div>
          </div>
          <Link
            href="/admin/bookings?status=PENDING"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-salon-gold hover:bg-salon-gold-hover text-salon-noir font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-gold-subtle flex-shrink-0"
          >
            <span>Xử lý ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 3. Lưới 4 Thẻ Chỉ Số KPI (Metric Stat Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Lịch hẹn hôm nay */}
        <Link
          href="/admin/bookings"
          className="group p-5 rounded-xl bg-salon-charcoal/80 border border-salon-gold/15 hover:border-salon-gold/40 hover:bg-salon-charcoal transition-all duration-200"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Lịch Hẹn Hôm Nay
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl font-bold text-salon-ivory group-hover:text-salon-gold transition-colors">
            {todayBookingsCount}
          </div>
          <div className="text-xs text-zinc-500 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Lịch phục vụ theo khung giờ</span>
          </div>
        </Link>

        {/* Card 2: Lịch chờ xác nhận */}
        <Link
          href="/admin/bookings?status=PENDING"
          className="group p-5 rounded-xl bg-salon-charcoal/80 border border-salon-gold/15 hover:border-salon-gold/40 hover:bg-salon-charcoal transition-all duration-200"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Chờ Xác Nhận
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl font-bold text-amber-400">
            {pendingBookingsCount}
          </div>
          <div className="text-xs text-zinc-500 mt-2 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Yêu cầu tiếp nhận mới nhất</span>
          </div>
        </Link>

        {/* Card 3: Thư viện kiểu tóc */}
        <Link
          href="/admin/hairstyles"
          className="group p-5 rounded-xl bg-salon-charcoal/80 border border-salon-gold/15 hover:border-salon-gold/40 hover:bg-salon-charcoal transition-all duration-200"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Mẫu Tóc Trong Kho
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Scissors className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl font-bold text-salon-ivory group-hover:text-salon-gold transition-colors">
            {totalHairstyles}
          </div>
          <div className="text-xs text-zinc-500 mt-2">
            Mẫu tóc Nam, Nữ & Unisex
          </div>
        </Link>

        {/* Card 4: Dịch vụ & Màu tóc */}
        <Link
          href="/admin/services"
          className="group p-5 rounded-xl bg-salon-charcoal/80 border border-salon-gold/15 hover:border-salon-gold/40 hover:bg-salon-charcoal transition-all duration-200"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Dịch Vụ & Bảng Màu
            </span>
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl font-bold text-salon-ivory group-hover:text-salon-gold transition-colors">
            {totalServices}
            <span className="text-base font-sans text-zinc-400 font-normal ml-2">
              / {totalColors} màu
            </span>
          </div>
          <div className="text-xs text-zinc-500 mt-2">
            Dịch vụ hóa chất & swatch màu
          </div>
        </Link>
      </div>

      {/* 4. Phím Tắt Thao Tác Nhanh (Quick Actions Panel) */}
      <div className="p-5 rounded-xl bg-salon-charcoal/50 border border-salon-gold/10">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3.5">
          Thao Tác Nhanh Theo Nghiệp Vụ
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          {(user.role.name === 'SUPER_ADMIN' || user.role.name === 'BOOKING_STAFF') && (
            <Link
              href="/admin/bookings"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-salon-surface hover:bg-salon-gold hover:text-salon-noir text-xs font-semibold text-salon-ivory border border-salon-gold/20 transition-all"
            >
              <CalendarCheck className="w-4 h-4 text-salon-gold group-hover:text-salon-noir" />
              <span>Xem Bảng Lịch Hẹn</span>
            </Link>
          )}

          {(user.role.name === 'SUPER_ADMIN' || user.role.name === 'CONTENT_ADMIN') && (
            <>
              <Link
                href="/admin/hairstyles"
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-salon-surface hover:bg-salon-gold hover:text-salon-noir text-xs font-semibold text-salon-ivory border border-salon-gold/20 transition-all"
              >
                <Scissors className="w-4 h-4 text-salon-gold" />
                <span>Thêm Mẫu Tóc Mới</span>
              </Link>
              <Link
                href="/admin/colors"
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-salon-surface hover:bg-salon-gold hover:text-salon-noir text-xs font-semibold text-salon-ivory border border-salon-gold/20 transition-all"
              >
                <Palette className="w-4 h-4 text-salon-gold" />
                <span>Quản Lý Bảng Màu</span>
              </Link>
            </>
          )}

          {(user.role.name === 'SUPER_ADMIN' ||
            user.role.name === 'CONTENT_ADMIN' ||
            user.role.name === 'EDITOR') && (
            <Link
              href="/admin/articles"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-salon-surface hover:bg-salon-gold hover:text-salon-noir text-xs font-semibold text-salon-ivory border border-salon-gold/20 transition-all"
            >
              <FileText className="w-4 h-4 text-salon-gold" />
              <span>Soạn Bài Viết Mới</span>
            </Link>
          )}

          {user.role.name === 'SUPER_ADMIN' && (
            <Link
              href="/admin/settings"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-salon-surface hover:bg-salon-gold hover:text-salon-noir text-xs font-semibold text-salon-ivory border border-salon-gold/20 transition-all"
            >
              <Sparkles className="w-4 h-4 text-salon-gold" />
              <span>Cấu Hình Thương Hiệu</span>
            </Link>
          )}
        </div>
      </div>

      {/* 5. Khối Bảng Đôi: Lịch Hẹn Chờ Xử Lý & Dòng Hoạt Động Mới Nhất */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cột 1: Danh sách Lịch hẹn chờ xác nhận gần đây */}
        <div className="p-5 rounded-xl bg-salon-charcoal/80 border border-salon-gold/15 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-salon-gold/10">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="font-serif text-base font-bold text-salon-ivory">
                  Lịch Hẹn Cần Tiếp Nhận
                </h3>
              </div>
              <Link
                href="/admin/bookings?status=PENDING"
                className="text-xs text-salon-gold hover:underline flex items-center gap-1 font-medium"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentPendingBookings.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                Tuyệt vời! Không có lịch hẹn nào đang chờ xử lý.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {recentPendingBookings.map((b) => (
                  <div key={b.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-salon-ivory truncate">
                          {b.customerName}
                        </span>
                        <span className="text-[10px] font-mono text-salon-gold/80 px-1.5 py-0.5 rounded bg-salon-gold/10">
                          {b.bookingCode}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-2">
                        <span>{formatPhoneNumber(b.customerPhone)}</span>
                        <span>•</span>
                        <span className="text-zinc-300">
                          {b.service?.title || 'Dịch vụ Salon'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-bold text-amber-300">
                        {b.timeSlot}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {formatDateVN(b.bookingDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cột 2: Dòng Nhật ký kiểm toán gần nhất (Recent Audit Logs) */}
        <div className="p-5 rounded-xl bg-salon-charcoal/80 border border-salon-gold/15 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-salon-gold/10">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-salon-gold" />
                <h3 className="font-serif text-base font-bold text-salon-ivory">
                  Nhật Ký Thao Tác Hệ Thống
                </h3>
              </div>
              {user.role.name === 'SUPER_ADMIN' && (
                <Link
                  href="/admin/audit-logs"
                  className="text-xs text-salon-gold hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Xem chi tiết</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {recentAuditLogs.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs">
                Chưa có thao tác kiểm toán nào được ghi nhận.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {recentAuditLogs.map((log) => {
                  const getActionColor = (action: string) => {
                    switch (action) {
                      case 'CREATE':
                        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                      case 'UPDATE':
                        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
                      case 'DELETE':
                        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
                      case 'AUTH_LOGIN':
                        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
                      case 'STATUS_CHANGE':
                        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                      default:
                        return 'text-zinc-400 bg-zinc-700/20 border-zinc-600/20';
                    }
                  };

                  return (
                    <div key={log.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex items-center gap-2.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${getActionColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                        <div className="truncate">
                          <span className="text-zinc-300 font-medium">
                            {log.actorName || log.actorEmail || 'Hệ thống'}
                          </span>
                          <span className="text-zinc-500 ml-1.5">
                            tác động {log.entityType}
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] text-zinc-500 flex-shrink-0">
                        {formatRelativeTimeVN(log.createdAt)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 7. Kế Hoạch Xác Minh Độc Lập (Verification Strategy)

### 7.1. Kiểm Tra Biên Dịch & Chất Lượng Mã Nguồn
1. **Kiểm tra biên dịch Type-check:**
   ```bash
   npx tsc --noEmit
   ```
   *Tiêu chí:* 0 lỗi Type, tương thích 100% chế độ `strict: true` của TypeScript.
2. **Kiểm tra cấu trúc tệp:**
   - `app/admin/layout.tsx`
   - `components/admin/AdminSidebar.tsx`
   - `components/admin/AdminHeader.tsx`
   - `app/api/admin/dashboard/route.ts`
   - `app/admin/page.tsx`

### 7.2. Kiểm Tra Hợp Đồng Kiểm Thử E2E (E2E Test Contract Assertions)
- Chạy lệnh test E2E có sẵn của dự án:
  ```bash
  npm run test:e2e -- --grep="Admin"
  npm run test:e2e -- --grep="Auth"
  npm run test:e2e
  ```
- **TC1.7 (Dashboard Telemetry):**
  - Gửi request `GET /api/admin/dashboard` với quyền `SUPER_ADMIN`.
  - Kết quả trả về HTTP 200, chứa các trường: `totalHairstyles`, `totalColors`, `totalServices`, `pendingBookingsCount`.
- **TC1.27 (Admin Route Guard Protection):**
  - Gửi request `GET /api/admin/dashboard` không có token/cookie.
  - Kết quả trả về HTTP 401 với thông báo chứa từ khóa `Unauthorized`.
- **TC4.1 (Customer Booking Journey Phase 3):**
  - Nhân viên `BOOKING_STAFF` truy cập `/api/admin/dashboard`.
  - Kết quả trả về HTTP 200 và `pendingBookingsCount >= 1`.
- **TC4.6 (Dashboard Telemetry Synchronization):**
  - Đo lường số `totalHairstyles` ban đầu.
  - Tạo kiểu tóc mới qua `/api/admin/hairstyles`.
  - Đo lại `totalHairstyles`, xác nhận tăng chính xác +1.

---

## 8. Kết Luận & Khuyến Nghị Cho Implementer

1. **Vấn đề Bypass Route Login:** Khi viết `app/admin/layout.tsx`, bắt buộc dùng logic nhận diện `isLoginPage` từ header máy chủ. Điều này đảm bảo form đăng nhập hiển thị hoàn toàn sạch sẽ không dính viền sidebar/header quản trị và loại bỏ 100% rủi ro vòng lặp redirect.
2. **Vấn đề Cookie vs Header Token:** API `/api/admin/dashboard/route.ts` phải trích xuất token linh hoạt: kiểm tra cả cookie `salon_session`, cookie `session` và header `Authorization: Bearer <token>` để bảo đảm cả trình duyệt web thực tế lẫn E2E test client đều hoạt động thông suốt.
3. **Múi Giờ Việt Nam:** Tính toán `todayBookingsCount` phải sử dụng chuỗi ngày `YYYY-MM-DD` theo giờ địa phương Việt Nam (`Asia/Ho_Chi_Minh`), không dùng `toISOString()` thuần để tránh sai lệch ngày vào khung giờ 00:00 - 07:00 sáng.
