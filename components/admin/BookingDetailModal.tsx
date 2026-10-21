'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Scissors,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  UserCheck,
  Ban,
  ShieldCheck,
  Check,
  Palette,
  Sparkles,
} from 'lucide-react';
import { formatBookingStatusVN, isTerminalStatus } from '@/lib/booking-state-machine';
import { CancelBookingModal } from './CancelBookingModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  booking: any | null;
  stylists: { id: string; fullName: string; specialties?: string[] }[];
  onUpdate: (updatedBooking: any) => void;
}

export function BookingDetailModal({
  isOpen,
  onClose,
  booking,
  stylists,
  onUpdate,
}: Props) {
  const [selectedStylistId, setSelectedStylistId] = useState<string>('');
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  useEffect(() => {
    if (booking) {
      setSelectedStylistId(booking.assignedStylistId || booking.stylistId || '');
      setInternalNotes(booking.internalNotes || '');
      setError(null);
      setSuccess(null);
    }
  }, [booking]);

  if (!isOpen || !booking) return null;

  const currentStatus = booking.status;
  const isTerminal = isTerminalStatus(currentStatus);

  // Status transitions
  const handleTransitionStatus = async (
    targetStatus: string,
    reason?: string
  ) => {
    setLoadingAction(targetStatus);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          cancellationReason: reason,
          cancelReason: reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Chuyển trạng thái thất bại');
      }

      setSuccess(`Đã chuyển trạng thái sang "${formatBookingStatusVN(targetStatus as any)}"`);
      onUpdate(data);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi cập nhật trạng thái');
    } finally {
      setLoadingAction(null);
    }
  };

  // Assign stylist
  const handleAssignStylist = async () => {
    setLoadingAction('ASSIGN');
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stylistId: selectedStylistId || null,
          assignedStylistId: selectedStylistId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gán Stylist thất bại');
      }

      setSuccess('Đã cập nhật chuyên viên phụ trách!');
      onUpdate(data);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi phân công stylist');
    } finally {
      setLoadingAction(null);
    }
  };

  // Save internal notes
  const handleSaveNotes = async () => {
    setLoadingAction('NOTES');
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internalNotes,
          notes: internalNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lưu ghi chú thất bại');
      }

      setSuccess('Đã lưu ghi chú nội bộ!');
      onUpdate(data);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi lưu ghi chú');
    } finally {
      setLoadingAction(null);
    }
  };

  // Status badge helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-800">
            ⏳ Chờ xác nhận
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/60 text-blue-300 border border-blue-800">
            ✓ Đã xác nhận
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800">
            ★ Đã hoàn thành
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-300 border border-rose-800">
            ✕ Đã hủy lịch
          </span>
        );
      case 'NO_SHOW':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
            ∅ Khách không đến
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-salon-card border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-salon-noir/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-salon-card border border-zinc-700">
                <Scissors className="w-5 h-5 text-salon-gold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-serif font-bold text-salon-ivory">
                    Lịch Hẹn: {booking.bookingCode}
                  </h2>
                  {renderStatusBadge(booking.status)}
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  Tạo lúc:{' '}
                  {booking.createdAt
                    ? new Date(booking.createdAt).toLocaleString('vi-VN')
                    : '—'}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Cancelled Notice */}
            {booking.status === 'CANCELLED' && (
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/60 text-xs text-rose-300 space-y-1">
                <div className="font-semibold text-rose-200 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>Lý do hủy lịch hẹn:</span>
                </div>
                <p className="pl-5 text-rose-300 font-mono">
                  {booking.cancellationReason || booking.cancelReason || 'Không có lý do chi tiết'}
                </p>
              </div>
            )}

            {/* Customer & Time Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer Box */}
              <div className="p-4 rounded-xl bg-salon-noir/50 border border-zinc-800 space-y-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Thông Tin Khách Hàng
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-salon-ivory font-medium">
                    <User className="w-4 h-4 text-salon-gold" />
                    <span>{booking.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Phone className="w-4 h-4 text-salon-gold" />
                    <a
                      href={`tel:${booking.customerPhone}`}
                      className="hover:text-salon-gold underline font-mono"
                    >
                      {booking.customerPhone}
                    </a>
                  </div>
                  {booking.customerEmail && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Mail className="w-4 h-4 text-zinc-500" />
                      <span>{booking.customerEmail}</span>
                    </div>
                  )}
                  {booking.notes && (
                    <div className="pt-2 border-t border-zinc-800 text-[11px] text-zinc-400 italic">
                      "Ghi chú: {booking.notes}"
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule & Service Box */}
              <div className="p-4 rounded-xl bg-salon-noir/50 border border-zinc-800 space-y-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Thời Gian & Dịch Vụ
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-salon-ivory">
                    <Calendar className="w-4 h-4 text-salon-gold" />
                    <span className="font-semibold">{booking.bookingDate}</span>
                    <span>•</span>
                    <Clock className="w-3.5 h-3.5 text-salon-gold" />
                    <span className="font-mono text-salon-gold font-bold">
                      {booking.timeSlot || booking.bookingTime}
                    </span>
                  </div>

                  <div className="text-zinc-300 pt-1">
                    {booking.service && (
                      <div className="font-medium text-salon-ivory">
                        {booking.service.title || booking.service.name}
                        {booking.service.durationMinutes && (
                          <span className="text-zinc-500 text-[11px] ml-1">
                            ({booking.service.durationMinutes} phút)
                          </span>
                        )}
                      </div>
                    )}
                    {booking.combo && (
                      <div className="font-medium text-amber-300">
                        Combo: {booking.combo.title}
                      </div>
                    )}
                  </div>

                  {/* Hairstyle / Color */}
                  {(booking.hairstyleRef || booking.hairColorRef) && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800">
                      {booking.hairstyleRef && (
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                          <Scissors className="w-3.5 h-3.5 text-salon-gold" />
                          <span>Mẫu tóc: {booking.hairstyleRef.title}</span>
                        </div>
                      )}
                      {booking.hairColorRef && (
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                          <span
                            className="w-3 h-3 rounded-full border border-white/20 inline-block"
                            style={{ backgroundColor: booking.hairColorRef.hexColor }}
                          />
                          <span>Màu: {booking.hairColorRef.name}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stylist Assignment Section */}
            <div className="p-4 rounded-xl bg-salon-noir/50 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-salon-gold" />
                  <span>Chuyên viên tạo mẫu phụ trách</span>
                </span>
                {booking.assignedStylist && (
                  <span className="text-xs text-salon-gold font-medium">
                    Hiện tại: {booking.assignedStylist.fullName}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <select
                  value={selectedStylistId}
                  onChange={(e) => setSelectedStylistId(e.target.value)}
                  disabled={loadingAction === 'ASSIGN' || isTerminal}
                  className="flex-1 px-3 py-2 bg-salon-card border border-zinc-700 rounded-lg text-xs text-salon-ivory focus:outline-none focus:border-salon-gold disabled:opacity-50"
                >
                  <option value="">-- Chưa phân công stylist --</option>
                  {stylists.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} {s.specialties?.length ? `(${s.specialties.join(', ')})` : ''}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAssignStylist}
                  disabled={
                    loadingAction === 'ASSIGN' ||
                    isTerminal ||
                    selectedStylistId === (booking.assignedStylistId || '')
                  }
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {loadingAction === 'ASSIGN' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Cập nhật</span>
                </button>
              </div>
            </div>

            {/* Internal Notes Section */}
            <div className="p-4 rounded-xl bg-salon-noir/50 border border-zinc-800 space-y-3">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-salon-gold" />
                <span>Ghi chú nội bộ salon (Staff Notes)</span>
              </span>

              <textarea
                rows={2}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Ghi chú kỹ thuật tóc, yêu cầu đặc biệt của khách, độ nhạy cảm da đầu..."
                className="w-full px-3 py-2 bg-salon-card border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-salon-gold resize-none"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={loadingAction === 'NOTES'}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {loadingAction === 'NOTES' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Lưu ghi chú nội bộ</span>
                </button>
              </div>
            </div>

            {/* FSM Workflow Controls */}
            <div className="pt-2 border-t border-zinc-800 space-y-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                Chuyển Trạng Thái (FSM 5-Phase)
              </span>

              {isTerminal ? (
                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-500 text-center">
                  Lịch hẹn đã kết thúc trạng thái quy trình ({formatBookingStatusVN(currentStatus)}). Không thể chuyển tiếp.
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {currentStatus === 'PENDING' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleTransitionStatus('CONFIRMED')}
                        disabled={Boolean(loadingAction)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-md shadow-blue-950"
                      >
                        {loadingAction === 'CONFIRMED' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Xác nhận đặt lịch (CONFIRMED)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsCancelModalOpen(true)}
                        disabled={Boolean(loadingAction)}
                        className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Hủy lịch hẹn</span>
                      </button>
                    </>
                  )}

                  {currentStatus === 'CONFIRMED' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleTransitionStatus('COMPLETED')}
                        disabled={Boolean(loadingAction)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-950"
                      >
                        {loadingAction === 'COMPLETED' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>Hoàn thành phục vụ (COMPLETED)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTransitionStatus('NO_SHOW')}
                        disabled={Boolean(loadingAction)}
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Khách không đến (NO_SHOW)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsCancelModalOpen(true)}
                        disabled={Boolean(loadingAction)}
                        className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Hủy lịch hẹn</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Reason Modal */}
      <CancelBookingModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        bookingCode={booking.bookingCode}
        onConfirm={async (reason) => {
          await handleTransitionStatus('CANCELLED', reason);
        }}
      />
    </>
  );
}
