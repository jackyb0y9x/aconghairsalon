import { BookingStatus } from '@prisma/client';

export interface StateTransitionResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Bản đồ danh sách trạng thái kế tiếp được phép cho từng trạng thái hiện tại
 */
export const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

/**
 * Định dạng nhãn hiển thị tiếng Việt
 */
export function formatBookingStatusVN(status: BookingStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Chờ xác nhận';
    case 'CONFIRMED':
      return 'Đã xác nhận';
    case 'COMPLETED':
      return 'Đã hoàn thành';
    case 'CANCELLED':
      return 'Đã hủy lịch';
    case 'NO_SHOW':
      return 'Khách không đến';
    default:
      return status;
  }
}

/**
 * Kiểm tra xem trạng thái có phải là kết thúc (terminal) hay không
 */
export function isTerminalStatus(status: BookingStatus): boolean {
  return status === 'COMPLETED' || status === 'CANCELLED' || status === 'NO_SHOW';
}

/**
 * Kiểm tra tính hợp lệ của chuyển dịch trạng thái theo máy trạng thái hữu hạn 5 pha
 */
export function validateBookingTransition(
  currentStatus: BookingStatus,
  targetStatus: BookingStatus,
  reasonOrNotes?: string | null
): StateTransitionResult {
  // 1. Trường hợp cùng trạng thái (Idempotent update)
  if (currentStatus === targetStatus) {
    return { isValid: true };
  }

  // 2. Không cho phép thay đổi từ trạng thái kết thúc (Terminal states)
  if (isTerminalStatus(currentStatus)) {
    return {
      isValid: false,
      errorMessage: `Không thể thay đổi lịch hẹn đã ở trạng thái "${formatBookingStatusVN(currentStatus)}"`,
    };
  }

  // 3. Kiểm tra xem trạng thái đích có nằm trong danh sách cho phép không
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(targetStatus)) {
    return {
      isValid: false,
      errorMessage: `Không thể chuyển trạng thái lịch hẹn từ "${formatBookingStatusVN(currentStatus)}" sang "${formatBookingStatusVN(targetStatus)}"`,
    };
  }

  // 4. Ràng buộc bắt buộc lý do khi hủy lịch (CANCELLED)
  if (targetStatus === 'CANCELLED') {
    const reasonText = reasonOrNotes ? reasonOrNotes.trim() : '';
    if (reasonText.length < 5) {
      return {
        isValid: false,
        errorMessage: 'Vui lòng cung cấp lý do hủy lịch hẹn cụ thể (tối thiểu 5 ký tự)',
      };
    }
  }

  return { isValid: true };
}
