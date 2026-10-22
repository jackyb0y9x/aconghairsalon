'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  bookingCode?: string;
}

const COMMON_REASONS = [
  'Khách bận việc đột xuất, yêu cầu hủy',
  'Khách đổi ý muốn đặt lại vào ngày khác',
  'Không thể liên lạc xác nhận với khách qua điện thoại',
  'Salon quá tải khung giờ, không sắp xếp được thợ',
  'Khách đặt nhầm thông tin hoặc dịch vụ',
];

export function CancelBookingModal({
  isOpen,
  onClose,
  onConfirm,
  bookingCode,
}: Props) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 5) {
      setError('Vui lòng nhập lý do hủy cụ thể (tối thiểu 5 ký tự)');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirm(trimmed);
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi hủy lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/60 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl space-y-4 p-6 transition-colors">
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 text-rose-600 dark:bg-rose-950/60 dark:border-rose-800/80 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-zinc-900 dark:text-salon-ivory">
                Hủy Lịch Hẹn {bookingCode ? `(${bookingCode})` : ''}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Trạng thái này sẽ kết thúc phiên đặt lịch và lưu vào nhật ký hệ thống.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleConfirm} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Lý do hủy lịch hẹn <span className="text-rose-500">*</span> (Tối thiểu 5 ký tự)
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="VD: Khách bận đột xuất, đã gọi điện thông báo và đồng ý dời lịch sau..."
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 placeholder-zinc-400 dark:placeholder-zinc-600 resize-none transition"
            />
            <div className="flex justify-between items-center text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5">
              <span>Bắt buộc ghi rõ lý do hủy</span>
              <span className={reason.trim().length >= 5 ? 'text-emerald-600 dark:text-emerald-400 font-mono font-semibold' : 'text-rose-600 dark:text-rose-400 font-mono font-semibold'}>
                {reason.trim().length}/5 ký tự
              </span>
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-400 mb-2">
              Gợi ý lý do thông dụng:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_REASONS.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setReason(r)}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-zinc-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-zinc-700 border border-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 dark:text-zinc-300 dark:border-zinc-700/60 text-left transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white transition"
            >
              Quay lại
            </button>
            <button
              type="submit"
              disabled={loading || reason.trim().length < 5}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>Xác nhận Hủy lịch</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
