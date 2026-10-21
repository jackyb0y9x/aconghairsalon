// =============================================================================
// Shared TypeScript Interfaces & Enums - Lumière Hair Atelier
// =============================================================================

export {
  RoleName,
  CategoryType,
  GenderTarget,
  HairLength,
  FaceShape,
  HairTexture,
  CareEffort,
  StyleVibe,
  ColorTone,
  ColorGroup,
  BookingStatus,
  AuditAction,
} from '@prisma/client';

export type {
  StorageProvider,
  UploadOptions,
  UploadResult,
} from '@/services/storage/types';

export type {
  HairTryOnProvider,
  TryOnRequest,
  TryOnResponse,
  SupportedTryOnMimeType,
} from '@/services/try-on/types';

export type {
  CreateBookingInput,
  UpdateBookingStatusInput,
} from '@/lib/validations/booking';

export type {
  LoginInput,
  ChangePasswordInput,
} from '@/lib/validations/auth';

export type {
  AdminRole,
  SessionUserData,
} from '@/lib/auth';

/**
 * Standard API JSON Response envelope
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: Record<string, unknown>;
}

/**
 * Paginated API Response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Filter options for Hairstyles catalog
 */
export interface HairstyleFilterParams {
  gender?: string;
  length?: string;
  faceShape?: string;
  texture?: string;
  careEffort?: string;
  styleVibe?: string;
  categoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Filter options for Hair Colors swatches
 */
export interface HairColorFilterParams {
  tone?: string;
  group?: string;
  requiresBleach?: boolean;
  search?: string;
}

/**
 * Navigation item structure for Header / Sidebar
 */
export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  badge?: string;
  roles?: string[];
  children?: NavItem[];
}
