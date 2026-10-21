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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-salon-card border border-rose-800/60 rounded-xl w-full max-w-md overflow-hidden shadow-2xl space-y-4 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 text-rose-400">
            <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800/80">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-salon-ivory">
                Hủy Lịch Hẹn {bookingCode ? `(${bookingCode})` : ''}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Trạng thái này sẽ kết thúc phiên đặt lịch và lưu vào lịch sử kiểm toán.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-zinc-400 hover:text-zinc-200 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleConfirm} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Lý do hủy lịch hẹn * (Tối thiểu 5 ký tự)
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
              className="w-full px-3 py-2 bg-salon-noir border border-zinc-700 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-rose-500 placeholder-zinc-500 resize-none"
            />
            <div className="flex justify-between items-center text-[11px] text-zinc-500 mt-1">
              <span>Bắt buộc theo quy định FSM</span>
              <span className={reason.trim().length >= 5 ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                {reason.trim().length}/5 ký tự
              </span>
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-medium text-zinc-400 mb-2">
              Gợi ý lý do thông dụng:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_REASONS.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setReason(r)}
                  className="px-2 py-1 rounded text-[11px] bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-left transition-colors border border-zinc-700/60"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Quay lại
            </button>
            <button
              type="submit"
              disabled={loading || reason.trim().length < 5}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md shadow-rose-950 transition-colors"
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
