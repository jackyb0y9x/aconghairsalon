'use client';

import React, { useState } from 'react';
import {
  Search,
  RefreshCw,
  Download,
  Eye,
  Shield,
  FileSpreadsheet,
  FileCode,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { formatDateVN, formatDateTimeVN, formatRelativeTimeVN } from '@/lib/utils';
import { AuditDiffModal, type AuditLogItem } from './AuditDiffModal';

interface AuditLogsTableClientProps {
  initialLogs: AuditLogItem[];
  initialPagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export function AuditLogsTableClient({
  initialLogs,
  initialPagination,
}: AuditLogsTableClientProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>(initialLogs);
  const [pagination, setPagination] = useState(initialPagination);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedEntity, setSelectedEntity] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = async (newPage = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(newPage));
      params.set('pageSize', String(pagination.pageSize));

      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (selectedAction !== 'ALL') params.set('action', selectedAction);
      if (selectedEntity !== 'ALL') params.set('entity', selectedEntity);

      if (dateRange !== 'ALL') {
        const now = new Date();
        if (dateRange === 'TODAY') {
          params.set('startDate', now.toISOString().split('T')[0]);
        } else if (dateRange === '7DAYS') {
          const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          params.set('startDate', past.toISOString().split('T')[0]);
        } else if (dateRange === '30DAYS') {
          const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          params.set('startDate', past.toISOString().split('T')[0]);
        }
      }

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1);
  };

  // Export CSV with UTF-8 BOM for Microsoft Excel on Windows
  const handleExportCSV = () => {
    const headers = ['ID', 'Thời gian', 'Hành động', 'Thực thể', 'Mã thực thể', 'Người thực hiện', 'Email', 'Vai trò', 'IP'];
    const rows = logs.map((log) => [
      log.id,
      formatDateTimeVN(log.timestamp || log.createdAt || ''),
      log.action,
      log.entity,
      log.entityId || '',
      log.actorName || '',
      log.actorEmail || '',
      log.actorRole || '',
      log.ipAddress || '',
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join(
        '\n'
      );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lumiere_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON
  const handleExportJSON = () => {
    const jsonContent = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lumiere_audit_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50';
      case 'UPDATE':
        return 'bg-blue-950/60 text-blue-400 border-blue-800/50';
      case 'DELETE':
        return 'bg-rose-950/60 text-rose-400 border-rose-800/50';
      case 'STATUS_CHANGE':
        return 'bg-amber-950/60 text-amber-400 border-amber-800/50';
      case 'AUTH_LOGIN':
      case 'AUTH_LOGOUT':
        return 'bg-purple-950/60 text-purple-400 border-purple-800/50';
      case 'SECURITY_VIOLATION':
        return 'bg-red-900/80 text-red-200 border-red-600';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter and Action Toolbar */}
      <div className="p-5 rounded-xl bg-salon-charcoal/80 border border-salon-gold/15 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo email, họ tên nhân viên, hoặc mã ID thực thể..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-salon-noir border border-zinc-700 text-salon-ivory text-xs placeholder-zinc-500 focus:border-salon-gold focus:outline-none"
            />
          </div>

          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-salon-noir border border-zinc-700 text-salon-ivory text-xs focus:border-salon-gold focus:outline-none"
          >
            <option value="ALL">Tất cả hành động</option>
            <option value="AUTH_LOGIN">🔑 Đăng nhập (AUTH_LOGIN)</option>
            <option value="AUTH_LOGOUT">🚪 Đăng xuất (AUTH_LOGOUT)</option>
            <option value="CREATE">➕ Tạo mới (CREATE)</option>
            <option value="UPDATE">✏️ Cập nhật (UPDATE)</option>
            <option value="DELETE">❌ Xóa (DELETE)</option>
            <option value="STATUS_CHANGE">⇄ Đổi trạng thái (STATUS_CHANGE)</option>
            <option value="SECURITY_VIOLATION">⚠️ Vi phạm bảo mật</option>
          </select>

          {/* Entity Filter */}
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-salon-noir border border-zinc-700 text-salon-ivory text-xs focus:border-salon-gold focus:outline-none"
          >
            <option value="ALL">Tất cả thực thể</option>
            <option value="HAIRSTYLE">💇 Kiểu tóc</option>
            <option value="HAIR_COLOR">🎨 Màu tóc</option>
            <option value="SERVICE">✂️ Dịch vụ</option>
            <option value="BOOKING">📅 Lịch hẹn</option>
            <option value="BANNER">🖼️ Banner</option>
            <option value="ARTICLE">📰 Bài viết</option>
            <option value="SITE_SETTINGS">⚙️ Cấu hình</option>
            <option value="Auth">🔒 Xác thực</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-salon-noir border border-zinc-700 text-salon-ivory text-xs focus:border-salon-gold focus:outline-none"
          >
            <option value="ALL">Tất cả thời gian</option>
            <option value="TODAY">Hôm nay</option>
            <option value="7DAYS">7 ngày qua</option>
            <option value="30DAYS">30 ngày qua</option>
          </select>

          {/* Search Button */}
          <button
            type="submit"
            className="px-4 py-2.5 rounded-lg bg-salon-gold hover:bg-salon-gold-hover text-salon-noir font-bold text-xs uppercase tracking-wider transition"
          >
            Lọc Dữ Liệu
          </button>
        </form>

        {/* Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800 text-xs">
          <div className="text-zinc-400">
            Hiển thị <span className="text-salon-gold font-bold">{logs.length}</span> trên tổng số{' '}
            <span className="text-salon-ivory font-bold">{pagination.total}</span> sự kiện kiểm toán
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(pagination.page)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:text-salon-gold hover:border-salon-gold/40 transition"
              title="Làm mới"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-salon-gold' : ''}`} />
              <span>Làm mới</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-emerald-400 hover:border-emerald-500/40 transition"
              title="Xuất Excel CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xuất Excel (CSV)</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-blue-400 hover:border-blue-500/40 transition"
              title="Xuất JSON"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Xuất JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Data Table */}
      <div className="rounded-xl bg-salon-charcoal/80 border border-salon-gold/15 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-salon-noir/80 border-b border-salon-gold/15 text-zinc-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3.5">Thời Gian</th>
                <th className="px-4 py-3.5">Hành Động</th>
                <th className="px-4 py-3.5">Thực Thể</th>
                <th className="px-4 py-3.5">Người Thực Hiện</th>
                <th className="px-4 py-3.5">Địa Chỉ IP</th>
                <th className="px-4 py-3.5 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    Không tìm thấy bản ghi kiểm toán nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-salon-noir/40 transition-colors">
                    {/* Timestamp */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-salon-ivory font-medium">
                        {formatDateTimeVN(log.timestamp || log.createdAt || '')}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {formatRelativeTimeVN(log.timestamp || log.createdAt || '')}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Entity */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-blue-300">{log.entity}</div>
                      {log.entityId && (
                        <div className="font-mono text-[10px] text-zinc-500 truncate max-w-[140px]">
                          #{log.entityId}
                        </div>
                      )}
                    </td>

                    {/* Actor */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-salon-ivory">
                        {log.actorName || log.actorEmail || 'Hệ thống'}
                      </div>
                      <div className="text-[10px] text-salon-gold font-mono">
                        {log.actorRole || 'SYSTEM'}
                      </div>
                    </td>

                    {/* IP */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-zinc-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-salon-gold hover:text-salon-gold-light bg-salon-gold/10 hover:bg-salon-gold/20 border border-salon-gold/30 rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem Diff</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <div>
              Trang <span className="text-salon-gold font-bold">{pagination.page}</span> /{' '}
              {pagination.totalPages}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLogs(pagination.page - 1)}
                disabled={pagination.page <= 1 || isLoading}
                className="p-1.5 rounded-lg border border-zinc-700 hover:border-salon-gold disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 transition"
                aria-label="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => fetchLogs(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || isLoading}
                className="p-1.5 rounded-lg border border-zinc-700 hover:border-salon-gold disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 transition"
                aria-label="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Visual Diff Modal */}
      <AuditDiffModal
        log={selectedLog}
        isOpen={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}
