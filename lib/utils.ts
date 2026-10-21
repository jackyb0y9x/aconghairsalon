import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Hợp nhất classnames với Tailwind Merge và Clsx
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Định dạng tiền tệ Việt Nam (VNĐ)
 * @param amount - Số tiền (VND)
 * @returns Chuỗi tiền tệ chuẩn, ví dụ: "250.000 ₫"
 */
export function formatVND(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0 ₫';
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Định dạng khoảng giá tiền từ min đến max
 * @param min - Giá thấp nhất
 * @param max - Giá cao nhất (nếu có)
 */
export function formatPriceRange(min: number, max?: number | null): string {
  if (max !== undefined && max !== null && min > max) {
    [min, max] = [max, min];
  }
  if (!max || min === max) {
    return formatVND(min);
  }
  return `${new Intl.NumberFormat('vi-VN').format(min)} - ${formatVND(max)}`;
}

/**
 * Định dạng ngày theo chuẩn Việt Nam (DD/MM/YYYY)
 */
export function formatDateVN(dateInput: Date | string | number): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'object' ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Định dạng ngày giờ chuẩn Việt Nam (HH:mm DD/MM/YYYY)
 */
export function formatDateTimeVN(dateInput: Date | string | number): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'object' ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

/**
 * Định dạng giờ phút (HH:mm)
 */
export function formatTimeVN(dateInput: Date | string | number): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'object' ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Hiển thị thời gian tương đối thân thiện bằng tiếng Việt
 */
export function formatRelativeTimeVN(dateInput: Date | string | number): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'object' ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;

  return formatDateVN(date);
}

/**
 * Chuyển đổi tiêu đề tiếng Việt có dấu thành URL slug chuẩn SEO
 * Ví dụ: "Kiểu Tóc Layer Nữ Hàn Quốc 2026!" -> "kieu-toc-layer-nu-han-quoc-2026"
 */
export function slugify(text: string): string {
  if (!text) return '';

  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Xóa dấu tiếng Việt
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '') // Xóa ký tự đặc biệt
    .trim()
    .replace(/\s+/g, '-') // Thay khoảng trắng bằng dấu gạch ngang
    .replace(/-+/g, '-'); // Gom nhiều dấu gạch ngang liên tiếp thành 1
}

/**
 * Định dạng số điện thoại Việt Nam dạng hiển thị đẹp
 * Ví dụ: "0908123456" -> "0908 123 456"
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('84')) {
    return `+84 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  return phone;
}

/**
 * Rút ngắn chuỗi văn bản với độ dài tối đa
 */
export function truncate(text: string, length: number = 100): string {
  if (!text || text.length <= length) return text;
  return `${text.slice(0, length).trim()}...`;
}

/**
 * Trích xuất thời lượng dịch vụ dạng hiển thị
 * Ví dụ: 90 -> "90 phút (1h 30p)"
 */
export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 phút';
  if (minutes < 60) return `${minutes} phút`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} giờ`;
  }
  return `${hours} giờ ${remainingMinutes} phút`;
}
