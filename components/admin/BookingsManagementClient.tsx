'use client';

import React, { useState } from 'react';
import {
  CalendarDays,
  Search,
  RefreshCw,
  Clock,
  User,
  Phone,
  Scissors,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  Sparkles,
  Ban,
  Check,
  Calendar,
} from 'lucide-react';
import { BookingDetailModal } from './BookingDetailModal';
import { CancelBookingModal } from './CancelBookingModal';
import { formatBookingStatusVN } from '@/lib/booking-state-machine';

interface Props {
  initialBookings: any[];
  stylists: { id: string; fullName: string; specialties?: string[] }[];
}

type StatusTab = 'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export function BookingsManagementClient({ initialBookings, stylists }: Props) {
  const [bookings, setBookings] = useState<any[]>(initialBookings);
  const [activeTab, setActiveTab] = useState<StatusTab>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [cancelTarget, setCancelTarget] = useState<any | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error('Failed to reload bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBooking = (updated: any) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
    );
    if (selectedBooking && selectedBooking.id === updated.id) {
      setSelectedBooking({ ...selectedBooking, ...updated });
    }
  };

  const handleQuickConfirm = async (booking: any) => {
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      });
      if (res.ok) {
        const updated = await res.json();
        handleUpdateBooking(updated);
      }
    } catch (err) {
      console.error('Failed to confirm booking:', err);
    }
  };

  const handleConfirmCancel = async (reason: string) => {
    if (!cancelTarget) return;
    const res = await fetch(`/api/admin/bookings/${cancelTarget.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'CANCELLED',
        cancellationReason: reason,
        cancelReason: reason,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      handleUpdateBooking(updated);
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Hủy lịch thất bại');
    }
  };

  // Status counts for badge tabs
  const counts = {
    ALL: bookings.length,
    PENDING: bookings.filter((b) => b.status === 'PENDING').length,
    CONFIRMED: bookings.filter((b) => b.status === 'CONFIRMED').length,
    COMPLETED: bookings.filter((b) => b.status === 'COMPLETED').length,
    CANCELLED: bookings.filter((b) => b.status === 'CANCELLED').length,
    NO_SHOW: bookings.filter((b) => b.status === 'NO_SHOW').length,
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredBookings = bookings.filter((b) => {
    // Status tab filter
    if (activeTab !== 'ALL' && b.status !== activeTab) {
      return false;
    }

    // Date filter
    if (dateFilter === 'TODAY' && b.bookingDate !== todayStr) {
      return false;
    } else if (dateFilter !== 'ALL' && dateFilter !== 'TODAY' && b.bookingDate !== dateFilter) {
      return false;
    }

    // Search query filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const codeMatch = b.bookingCode?.toLowerCase().includes(q);
      const nameMatch = b.customerName?.toLowerCase().includes(q);
      const phoneMatch = b.customerPhone?.toLowerCase().includes(q);
      const emailMatch = b.customerEmail?.toLowerCase().includes(q);
      if (!codeMatch && !nameMatch && !phoneMatch && !emailMatch) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-salon-ivory flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-salon-gold" />
            <span>Vận Hành Lịch Hẹn & Booking Hub</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Điều phối lịch đặt, phân công stylist và quản trị chu trình 5 trạng thái FSM.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchBookings}
            disabled={loading}
            className="p-2 rounded-lg bg-salon-card hover:bg-zinc-800 text-zinc-300 hover:text-salon-gold transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-2 text-xs font-semibold whitespace-nowrap rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'ALL'
              ? 'border-salon-gold text-amber-900 bg-amber-50 dark:text-salon-gold dark:bg-salon-gold/5'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <span>Tất cả</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 font-semibold">
            {counts.ALL}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('PENDING')}
          className={`px-3 py-2 text-xs font-semibold whitespace-nowrap rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'PENDING'
              ? 'border-amber-500 text-amber-900 bg-amber-50 dark:border-amber-400 dark:text-amber-400 dark:bg-amber-950/20'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <span>⏳ Chờ xác nhận</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 font-bold">
            {counts.PENDING}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CONFIRMED')}
          className={`px-3 py-2 text-xs font-semibold whitespace-nowrap rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'CONFIRMED'
              ? 'border-blue-500 text-blue-900 bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:bg-blue-950/20'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <span>✓ Đã xác nhận</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 font-semibold">
            {counts.CONFIRMED}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={`px-3 py-2 text-xs font-semibold whitespace-nowrap rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'COMPLETED'
              ? 'border-emerald-500 text-emerald-900 bg-emerald-50 dark:border-emerald-400 dark:text-emerald-400 dark:bg-emerald-950/20'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <span>★ Đã phục vụ</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 font-semibold">
            {counts.COMPLETED}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CANCELLED')}
          className={`px-3 py-2 text-xs font-semibold whitespace-nowrap rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'CANCELLED'
              ? 'border-rose-500 text-rose-900 bg-rose-50 dark:border-rose-500 dark:text-rose-400 dark:bg-rose-950/20'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <span>✕ Đã hủy</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800 font-semibold">
            {counts.CANCELLED}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('NO_SHOW')}
          className={`px-3 py-2 text-xs font-semibold whitespace-nowrap rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'NO_SHOW'
              ? 'border-zinc-500 text-zinc-900 bg-zinc-100 dark:border-zinc-500 dark:text-zinc-300 dark:bg-zinc-800/40'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <span>∅ Khách không đến</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 font-semibold">
            {counts.NO_SHOW}
          </span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã lịch (BK...), tên khách hàng, số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-salon-card border border-zinc-800 rounded-lg text-xs text-salon-ivory placeholder-zinc-500 focus:outline-none focus:border-salon-gold transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 bg-salon-card border border-zinc-800 rounded-lg text-xs text-salon-ivory focus:outline-none focus:border-salon-gold"
          >
            <option value="ALL">Mọi ngày hẹn</option>
            <option value="TODAY">Hôm nay ({todayStr})</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-salon-card border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-salon-noir/60 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Mã Lịch</th>
                <th className="py-3 px-4">Khách Hàng</th>
                <th className="py-3 px-4">Dịch Vụ & Combo</th>
                <th className="py-3 px-4">Ngày & Giờ</th>
                <th className="py-3 px-4">Stylist</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    <CalendarDays className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                    <p className="text-sm">Không tìm thấy lịch hẹn nào theo điều kiện lọc.</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-salon-gold">
                      {b.bookingCode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-salon-ivory">{b.customerName}</div>
                      <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        {b.customerPhone}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {b.service && (
                        <div className="font-medium text-salon-ivory">
                          {b.service.title || b.service.name}
                        </div>
                      )}
                      {b.combo && (
                        <div className="text-[11px] text-amber-300">
                          Combo: {b.combo.title}
                        </div>
                      )}
                      {b.hairstyleRef && (
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          Kiểu: {b.hairstyleRef.title}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-zinc-200 font-medium">{b.bookingDate}</div>
                      <div className="text-[11px] font-mono text-salon-gold font-semibold">
                        {b.timeSlot || b.bookingTime}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {b.assignedStylist ? (
                        <span className="text-zinc-300 font-medium">
                          {b.assignedStylist.fullName}
                        </span>
                      ) : (
                        <span className="text-zinc-500 italic text-[11px]">
                          Chưa chỉ định
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {b.status === 'PENDING' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                          Chờ xác nhận
                        </span>
                      )}
                      {b.status === 'CONFIRMED' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                          Đã xác nhận
                        </span>
                      )}
                      {b.status === 'COMPLETED' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                          Đã phục vụ
                        </span>
                      )}
                      {b.status === 'CANCELLED' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                          Đã hủy
                        </span>
                      )}
                      {b.status === 'NO_SHOW' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                          Không đến
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.status === 'PENDING' && (
                          <button
                            onClick={() => handleQuickConfirm(b)}
                            className="p-1.5 text-blue-400 hover:bg-blue-950/50 rounded transition-colors"
                            title="Xác nhận ngay"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="p-1.5 text-zinc-400 hover:text-salon-gold hover:bg-zinc-800 rounded transition-colors"
                          title="Xem chi tiết & thao tác"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                          <button
                            onClick={() => setCancelTarget(b)}
                            className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors"
                            title="Hủy lịch hẹn"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <BookingDetailModal
        isOpen={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        booking={selectedBooking}
        stylists={stylists}
        onUpdate={handleUpdateBooking}
      />

      <CancelBookingModal
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        bookingCode={cancelTarget?.bookingCode}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}
