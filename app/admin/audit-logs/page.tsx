import React from 'react';
import { requireAdmin } from '@/lib/auth';
import { getAuditLogs } from '@/services/audit';
import { AuditLogsTableClient } from '@/components/admin/AuditLogsTableClient';
import { ShieldAlert } from 'lucide-react';

export const metadata = {
  title: 'Nhật Ký Kiểm Toán Hệ Thống | Công Nguyễn Hair Salon CMS',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminAuditLogsPage() {
  // 1. Server Guard: Chỉ cho phép duy nhất SUPER_ADMIN
  await requireAdmin(['SUPER_ADMIN']);

  // 2. Tải trước trang dữ liệu kiểm toán đầu tiên
  let initialLogs: any[] = [];
  let initialPagination = {
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
  };

  try {
    const result = await getAuditLogs({ page: 1, pageSize: 20 });
    initialLogs = result.logs || [];
    initialPagination = result.pagination;
  } catch (error) {
    console.warn('[Admin Audit Logs Page] DB fetch warning:', error);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="pb-4 border-b border-salon-gold/15">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-salon-gold mb-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Bảo Mật & Tuân Thủ</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-salon-ivory">
          Nhật Ký Kiểm Toán Hệ Thống (Audit Trail)
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Hồ sơ bất biến ghi nhận mọi hoạt động xác thực, tạo mới, cập nhật, xóa và thay đổi trạng thái trong toàn bộ phân hệ quản trị.
        </p>
      </div>

      {/* Interactive Table Client */}
      <AuditLogsTableClient
        initialLogs={initialLogs}
        initialPagination={initialPagination}
      />
    </div>
  );
}
