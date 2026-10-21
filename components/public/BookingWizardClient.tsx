'use client';

import React, { useState, useEffect, useId, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Scissors,
  Palette,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  ShieldCheck,
  Check,
  Layers,
} from 'lucide-react';
import { formatVND, formatDuration } from '@/lib/utils';
import { CreateBookingSchema, VIETNAMESE_PHONE_REGEX } from '@/lib/validations/booking';

export interface ServiceOption {
  id: string;
  title: string;
  name?: string;
  durationMinutes: number;
  priceMin?: number;
  minPrice?: number;
  priceMax?: number | null;
  category?: string;
  isPopular?: boolean;
}

export interface ComboOption {
  id: string;
  title: string;
  name?: string;
  durationMinutes: number;
  packagePrice: number;
  originalPrice: number;
  savingsPercent?: number;
}

export interface StylistOption {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  experienceYears?: number | null;
  specialties?: string[];
}

export interface HairstyleOption {
  id: string;
  title: string;
  name?: string;
  coverImageUrl?: string;
  gender: string;
}

export interface ColorOption {
  id: string;
  name: string;
  hexCode?: string;
  hexColor?: string;
  tone: string;
  requiresBleach?: boolean;
}

interface BookingWizardClientProps {
  services: ServiceOption[];
  combos: ComboOption[];
  stylists: StylistOption[];
  hairstyles: HairstyleOption[];
  colors: ColorOption[];
}

export function BookingWizardClient({
  services,
  combos,
  stylists,
  hairstyles,
  colors,
}: BookingWizardClientProps) {
  const searchParams = useSearchParams();

  // Wizard state (Step 1 to 5)
  const [currentStep, setCurrentStep] = useState(1);

  // Form inputs
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedComboId, setSelectedComboId] = useState<string>('');
  const [selectedHairstyleId, setSelectedHairstyleId] = useState<string>('');
  const [selectedHairColorId, setSelectedHairColorId] = useState<string>('');
  const [selectedStylistId, setSelectedStylistId] = useState<string>(''); // empty string means "Any Stylist"
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingTime, setBookingTime] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [agreedToPolicy, setAgreedToPolicy] = useState(true);

  // Submission & Validation states
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

  // Initialize idempotencyKey and pre-populate from URL
  useEffect(() => {
    // Generate UUID for idempotency lock
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      setIdempotencyKey(crypto.randomUUID());
    } else {
      setIdempotencyKey(`lmr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
    }

    // Pre-populate from URL
    const sId = searchParams.get('serviceId');
    const cId = searchParams.get('comboId');
    const hId = searchParams.get('hairstyleId') || searchParams.get('styleId');
    const colId = searchParams.get('hairColorId') || searchParams.get('colorId');
    const styId = searchParams.get('stylistId');

    if (sId) setSelectedServiceId(sId);
    if (cId) setSelectedComboId(cId);
    if (hId) setSelectedHairstyleId(hId);
    if (colId) setSelectedHairColorId(colId);
    if (styId) setSelectedStylistId(styId);

    // Default booking date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingDate(tomorrow.toISOString().split('T')[0]);
    setBookingTime('10:00');
  }, [searchParams]);

  // Operating Hours (08:30 - 20:30) 30-min slots
  const timeSlots = [
    '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
  ];

  // Generate next 30 days
  const dateOptions = useMemo(() => {
    const list: Array<{ dateStr: string; display: string }> = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      let display = `${dd}/${mm}`;
      if (i === 0) display = 'Hôm nay';
      if (i === 1) display = 'Ngày mai';

      const dayOfWeek = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][d.getDay()];
      list.push({ dateStr, display: `${display} (${dayOfWeek})` });
    }
    return list;
  }, []);

  // Selected Service/Combo details
  const activeService = services.find((s) => s.id === selectedServiceId);
  const activeCombo = combos.find((c) => c.id === selectedComboId || c.id === selectedServiceId);
  const activeStylist = stylists.find((s) => s.id === selectedStylistId);
  const activeHairstyle = hairstyles.find((h) => h.id === selectedHairstyleId);
  const activeColor = colors.find((c) => c.id === selectedHairColorId);

  // Step 1 -> 2 barrier validation
  const handleNextFromStep1 = () => {
    if (!selectedServiceId && !selectedComboId) {
      setFieldErrors({ service: 'Vui lòng chọn một dịch vụ hoặc combo để tiếp tục' });
      return;
    }
    setFieldErrors({});
    setCurrentStep(2);
  };

  // Step 4 -> 5 barrier validation
  const handleNextFromStep4 = () => {
    if (!bookingDate) {
      setFieldErrors({ bookingDate: 'Vui lòng chọn ngày hẹn' });
      return;
    }
    if (!bookingTime) {
      setFieldErrors({ bookingTime: 'Vui lòng chọn giờ hẹn' });
      return;
    }
    setFieldErrors({});
    setCurrentStep(5);
  };

  // Submit Handler
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Anti-duplicate client lock

    setSubmitError(null);
    setFieldErrors({});

    const effectiveServiceId = selectedServiceId || selectedComboId;

    // Validate using Zod schema
    const validationResult = CreateBookingSchema.safeParse({
      serviceId: effectiveServiceId,
      hairstyleId: selectedHairstyleId || undefined,
      hairColorId: selectedHairColorId || undefined,
      stylistId: selectedStylistId || undefined,
      bookingDate,
      bookingTime,
      customerName,
      customerPhone,
      customerEmail: customerEmail || undefined,
      notes: notes || undefined,
      idempotencyKey,
    });

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.errors.forEach((err: any) => {
        if (err.path[0]) {
          errors[String(err.path[0])] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    if (!agreedToPolicy) {
      setFieldErrors({ policy: 'Vui lòng đồng ý với chính sách dịch vụ của salon' });
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        serviceId: effectiveServiceId,
        hairstyleId: selectedHairstyleId || undefined,
        hairColorId: selectedHairColorId || undefined,
        stylistId: selectedStylistId || undefined,
        bookingDate,
        bookingTime,
        timeSlot: bookingTime,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        notes: notes.trim() || undefined,
        idempotencyKey,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi tạo lịch hẹn. Vui lòng thử lại.');
      }

      setBookingSuccess(data);
    } catch (err: any) {
      console.error('Booking submission failed:', err);
      setSubmitError(err.message || 'Không thể gửi lịch hẹn. Vui lòng kiểm tra lại kết nối mạng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (bookingSuccess) {
    return (
      <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-salon-charcoal border border-salon-gold/40 shadow-gold-glow text-center space-y-6 animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-salon-gold/20 text-salon-gold mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase tracking-widest text-salon-gold font-bold">
            Tiếp Nhận Thành Công
          </span>
          <h2 className="text-3xl font-serif font-bold text-white">
            Lịch Hẹn Của Quý Khách Đã Được Ghi Nhận
          </h2>
          <p className="text-neutral-300 text-sm font-light">
            Cảm ơn quý khách <strong className="text-white">{customerName}</strong>. Lễ tân Salon Hoàng Gia Prestige sẽ liên hệ qua số điện thoại <strong className="text-salon-gold-light">{customerPhone}</strong> để xác nhận lịch trong ít phút.
          </p>
        </div>

        {/* Booking Code Voucher Box */}
        <div className="p-6 rounded-2xl bg-salon-noir/90 border border-salon-gold/30 space-y-3 text-left">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs text-neutral-400">Mã lịch hẹn:</span>
            <span className="text-xl font-mono font-bold text-salon-gold">
              {bookingSuccess.bookingCode || 'BK123456'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-neutral-400 block">Thời gian hẹn:</span>
              <span className="font-semibold text-white">
                {bookingTime} — {bookingDate}
              </span>
            </div>

            <div>
              <span className="text-neutral-400 block">Dịch vụ:</span>
              <span className="font-semibold text-white truncate block">
                {activeCombo?.title || activeService?.title || 'Dịch Vụ Salon'}
              </span>
            </div>

            <div>
              <span className="text-neutral-400 block">Stylist:</span>
              <span className="font-semibold text-white">
                {activeStylist ? `Master ${activeStylist.fullName}` : 'Salon sắp xếp chuyên viên phù hợp'}
              </span>
            </div>

            <div>
              <span className="text-neutral-400 block">Trạng thái:</span>
              <span className="font-semibold text-amber-400">
                Chờ Salon xác nhận
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-salon-gold hover:bg-salon-gold-hover text-salon-noir font-bold text-sm transition shadow-gold-subtle"
          >
            Quay Về Trang Chủ
          </Link>
          <button
            onClick={() => {
              setBookingSuccess(null);
              setCurrentStep(1);
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-white/20 text-neutral-300 hover:text-white text-sm"
          >
            Đặt Lịch Khác
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 5-Step Progress Stepper */}
      <div className="p-4 sm:p-6 rounded-2xl bg-salon-charcoal/80 border border-salon-gold/20 shadow-luxury-dark">
        <div className="flex items-center justify-between relative">
          {[
            { step: 1, label: 'Dịch vụ' },
            { step: 2, label: 'Mẫu tóc' },
            { step: 3, label: 'Stylist' },
            { step: 4, label: 'Ngày & Giờ' },
            { step: 5, label: 'Xác nhận' },
          ].map((item, idx) => (
            <div key={item.step} className="flex flex-col items-center relative z-10">
              <button
                onClick={() => {
                  if (item.step < currentStep) setCurrentStep(item.step);
                }}
                disabled={item.step > currentStep}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition ${
                  currentStep === item.step
                    ? 'bg-gradient-to-r from-salon-gold via-salon-gold-light to-salon-gold text-salon-noir shadow-gold-glow ring-2 ring-salon-gold'
                    : currentStep > item.step
                    ? 'bg-emerald-500 text-white'
                    : 'bg-salon-noir text-neutral-500 border border-white/10'
                }`}
              >
                {currentStep > item.step ? <Check className="w-4 h-4" /> : item.step}
              </button>
              <span
                className={`text-[11px] mt-2 font-medium hidden sm:block ${
                  currentStep === item.step ? 'text-salon-gold-light' : 'text-neutral-400'
                }`}
              >
                {item.label}
              </span>
            </div>
          ))}

          {/* Background Connecting Bar */}
          <div className="absolute top-4 sm:top-5 left-4 right-4 h-0.5 bg-neutral-800 -z-0">
            <div
              className="h-full bg-salon-gold transition-all duration-300"
              style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* STEP 1: Select Service or Combo */}
      {currentStep === 1 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-salon-charcoal/80 border border-salon-gold/20 shadow-luxury-dark space-y-6">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-widest text-salon-gold font-bold">
              Bước 1/5: Lựa Chọn Dịch Vụ
            </span>
            <h2 className="text-2xl font-serif font-bold text-white">
              Chọn Dịch Vụ Tạo Kiểu Hoặc Gói Combo VIP
            </h2>
          </div>

          {fieldErrors.service && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{fieldErrors.service}</span>
            </div>
          )}

          {/* Combo Packages */}
          {combos.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs uppercase tracking-wider text-salon-gold-light font-semibold">
                Gói Combo Đặc Quyền (Khuyên Dùng)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {combos.map((combo) => {
                  const isSelected = selectedComboId === combo.id || selectedServiceId === combo.id;
                  return (
                    <div
                      key={combo.id}
                      onClick={() => {
                        setSelectedComboId(combo.id);
                        setSelectedServiceId(combo.id);
                        setFieldErrors({});
                      }}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                        isSelected
                          ? 'bg-salon-gold/15 border-salon-gold shadow-gold-subtle'
                          : 'bg-salon-noir/80 border-white/10 hover:border-salon-gold/40'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-salon-gold/20 text-salon-gold border border-salon-gold/30">
                            Combo VIP - Tiết kiệm {combo.savingsPercent || 25}%
                          </span>
                          <h4 className="font-serif font-bold text-lg text-white mt-1.5">
                            {combo.title || combo.name}
                          </h4>
                          <span className="text-[11px] text-neutral-400 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 text-salon-gold" />
                            <span>{formatDuration(combo.durationMinutes)}</span>
                          </span>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-salon-gold bg-salon-gold text-salon-noir' : 'border-white/30'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/5 flex items-baseline justify-between">
                        <span className="text-xs text-neutral-500 line-through">
                          {formatVND(Number(combo.originalPrice))}
                        </span>
                        <span className="text-lg font-bold text-salon-gold font-serif">
                          {formatVND(Number(combo.packagePrice))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Individual Services */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs uppercase tracking-wider text-salon-gold-light font-semibold">
              Dịch Vụ Lẻ Từng Hạng Mục
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {services.map((srv) => {
                const isSelected = selectedServiceId === srv.id && selectedComboId !== srv.id;
                const pMin = Number(srv.priceMin ?? srv.minPrice ?? 0);

                return (
                  <div
                    key={srv.id}
                    onClick={() => {
                      setSelectedServiceId(srv.id);
                      setSelectedComboId('');
                      setFieldErrors({});
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'bg-salon-gold/15 border-salon-gold shadow-gold-subtle'
                        : 'bg-salon-noir/80 border-white/10 hover:border-salon-gold/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-salon-gold font-medium">
                          {srv.category || 'Dịch vụ'}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-salon-gold bg-salon-gold text-salon-noir' : 'border-white/30'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                      <h4 className="font-serif font-bold text-base text-white mt-1">
                        {srv.title || srv.name}
                      </h4>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-neutral-400">{formatDuration(srv.durationMinutes)}</span>
                      <span className="font-bold text-salon-gold font-serif">{formatVND(pMin)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-salon-gold/15 flex justify-end">
            <button
              onClick={handleNextFromStep1}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-salon-gold via-salon-gold-light to-salon-gold text-salon-noir font-bold text-xs uppercase tracking-wider hover:opacity-95 shadow-gold-glow transition"
            >
              <span>Tiếp Tục Chọn Mẫu Tóc</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Optional Hairstyle & Color */}
      {currentStep === 2 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-salon-charcoal/80 border border-salon-gold/20 shadow-luxury-dark space-y-6">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-widest text-salon-gold font-bold">
              Bước 2/5: Mẫu Tóc & Màu Nhuộm Tham Khảo
            </span>
            <h2 className="text-2xl font-serif font-bold text-white">
              Chọn Mẫu Tóc / Màu Nhuộm Yêu Thích (Không Bắt Buộc)
            </h2>
            <p className="text-neutral-400 text-xs font-light">
              Giúp Stylist chuẩn bị trước ý tưởng phù hợp với bạn. Quý khách có thể bỏ qua bước này để được tư vấn trực tiếp tại Salon.
            </p>
          </div>

          {/* Hairstyles Slider/Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider text-salon-gold-light font-semibold">
                Kiểu Tóc Tham Khảo:
              </h3>
              {selectedHairstyleId && (
                <button
                  onClick={() => setSelectedHairstyleId('')}
                  className="text-xs text-salon-gold hover:underline"
                >
                  Bỏ chọn kiểu tóc
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {hairstyles.slice(0, 4).map((h) => {
                const isSelected = selectedHairstyleId === h.id;
                return (
                  <div
                    key={h.id}
                    onClick={() => setSelectedHairstyleId(isSelected ? '' : h.id)}
                    className={`rounded-xl overflow-hidden border p-2 cursor-pointer transition ${
                      isSelected
                        ? 'border-salon-gold bg-salon-gold/15 shadow-gold-subtle'
                        : 'border-white/10 bg-salon-noir/80 hover:border-salon-gold/40'
                    }`}
                  >
                    <div
                      className="aspect-[4/5] rounded-lg bg-cover bg-center mb-2"
                      style={{ backgroundImage: `url('${h.coverImageUrl || '/images/default-hair.jpg'}')` }}
                    />
                    <div className="text-xs font-semibold text-white truncate">
                      {h.title || h.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Colors Swatches Grid */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider text-salon-gold-light font-semibold">
                Màu Nhuộm Tham Khảo:
              </h3>
              {selectedHairColorId && (
                <button
                  onClick={() => setSelectedHairColorId('')}
                  className="text-xs text-salon-gold hover:underline"
                >
                  Bỏ chọn màu
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {colors.slice(0, 4).map((c) => {
                const isSelected = selectedHairColorId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedHairColorId(isSelected ? '' : c.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'border-salon-gold bg-salon-gold/15 shadow-gold-subtle'
                        : 'border-white/10 bg-salon-noir/80 hover:border-salon-gold/40'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full border border-white/20 flex-shrink-0"
                      style={{ backgroundColor: c.hexCode || c.hexColor }}
                    />
                    <div className="truncate text-xs text-white font-medium">
                      {c.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-salon-gold/15 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full border border-white/20 text-xs text-neutral-300 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Quay Lại</span>
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-salon-gold via-salon-gold-light to-salon-gold text-salon-noir font-bold text-xs uppercase tracking-wider hover:opacity-95 shadow-gold-glow transition"
            >
              <span>Tiếp Tục Chọn Stylist</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Select Stylist */}
      {currentStep === 3 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-salon-charcoal/80 border border-salon-gold/20 shadow-luxury-dark space-y-6">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-widest text-salon-gold font-bold">
              Bước 3/5: Chọn Chuyên Gia
            </span>
            <h2 className="text-2xl font-serif font-bold text-white">
              Lựa Chọn Master Stylist Thực Hiện
            </h2>
          </div>

          {/* Option A: Any Stylist (Default) */}
          <div
            onClick={() => setSelectedStylistId('')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedStylistId === ''
                ? 'bg-salon-gold/15 border-salon-gold shadow-gold-subtle'
                : 'bg-salon-noir/80 border-white/10 hover:border-salon-gold/40'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-salon-gold/20 border border-salon-gold/40 flex items-center justify-center text-salon-gold">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-lg text-white">
                  Bất Kỳ Master Stylist Nào Sẵn Sàng (Khuyên Dùng)
                </h4>
                <p className="text-xs text-neutral-400 font-light mt-0.5">
                  Salon sẽ tự động điều phối chuyên viên tay nghề cao phù hợp nhất với khung giờ của bạn.
                </p>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                selectedStylistId === '' ? 'border-salon-gold bg-salon-gold text-salon-noir' : 'border-white/30'
              }`}
            >
              {selectedStylistId === '' && <Check className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* Option B: Specific Stylists */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-salon-gold-light font-semibold">
              Hoặc Chỉ Định Stylist Yêu Thích:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stylists.map((st) => {
                const isSelected = selectedStylistId === st.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStylistId(st.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'bg-salon-gold/15 border-salon-gold shadow-gold-subtle'
                        : 'bg-salon-noir/80 border-white/10 hover:border-salon-gold/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={st.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                        alt={st.fullName}
                        className="w-11 h-11 rounded-full object-cover border border-salon-gold/30"
                      />
                      <div>
                        <h4 className="font-semibold text-sm text-white">
                          Master {st.fullName}
                        </h4>
                        <span className="text-[11px] text-salon-gold-light">
                          {st.experienceYears || 8} năm kinh nghiệm
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-salon-gold/15 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full border border-white/20 text-xs text-neutral-300 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Quay Lại</span>
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-salon-gold via-salon-gold-light to-salon-gold text-salon-noir font-bold text-xs uppercase tracking-wider hover:opacity-95 shadow-gold-glow transition"
            >
              <span>Tiếp Tục Chọn Ngày Giờ</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Pick Date & Time Slot (08:30 - 20:30) */}
      {currentStep === 4 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-salon-charcoal/80 border border-salon-gold/20 shadow-luxury-dark space-y-6">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-widest text-salon-gold font-bold">
              Bước 4/5: Thời Gian Hẹn
            </span>
            <h2 className="text-2xl font-serif font-bold text-white">
              Chọn Ngày & Khung Giờ Mở Cửa (08:30 - 20:30)
            </h2>
          </div>

          {/* Date Picker Buttons */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-salon-gold-light font-semibold">
              Chọn Ngày Đến Hẹn:
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {dateOptions.map((opt) => (
                <button
                  key={opt.dateStr}
                  onClick={() => setBookingDate(opt.dateStr)}
                  className={`py-2 px-4 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                    bookingDate === opt.dateStr
                      ? 'bg-salon-gold text-salon-noir font-bold shadow-gold-subtle'
                      : 'bg-salon-noir/80 text-neutral-300 hover:text-white border border-white/5'
                  }`}
                >
                  {opt.display}
                </button>
              ))}
            </div>
          </div>

          {/* Time Slots Grid (08:30 - 20:30) */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider text-salon-gold-light font-semibold">
                Chọn Giờ Hẹn Trong Ngày:
              </label>
              <span className="text-[11px] text-neutral-400">
                Khung giờ mở cửa: 08:30 - 20:30
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {timeSlots.map((slot) => {
                const isSelected = bookingTime === slot;
                return (
                  <button
                    key={slot}
                    onClick={() => {
                      setBookingTime(slot);
                      setFieldErrors({});
                    }}
                    className={`py-2 rounded-lg text-xs font-mono font-medium transition text-center ${
                      isSelected
                        ? 'bg-salon-gold text-salon-noir font-bold shadow-gold-subtle'
                        : 'bg-salon-noir/80 text-neutral-300 hover:text-white border border-white/5 hover:border-salon-gold/40'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-salon-gold/15 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full border border-white/20 text-xs text-neutral-300 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Quay Lại</span>
            </button>
            <button
              onClick={handleNextFromStep4}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-salon-gold via-salon-gold-light to-salon-gold text-salon-noir font-bold text-xs uppercase tracking-wider hover:opacity-95 shadow-gold-glow transition"
            >
              <span>Tiếp Tục Nhập Thông Tin</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Customer Details & Final Confirmation */}
      {currentStep === 5 && (
        <form
          onSubmit={handleFinalSubmit}
          className="p-6 sm:p-8 rounded-3xl bg-salon-charcoal/80 border border-salon-gold/20 shadow-luxury-dark space-y-6"
        >
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-widest text-salon-gold font-bold">
              Bước 5/5: Thông Tin Khách Hàng & Xác Nhận
            </span>
            <h2 className="text-2xl font-serif font-bold text-white">
              Hoàn Tất Đặt Lịch Hẹn
            </h2>
          </div>

          {submitError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Họ và Tên <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Phương Thảo"
                className={`w-full px-4 py-2.5 rounded-xl bg-salon-noir border text-sm text-white focus:outline-none transition ${
                  fieldErrors.customerName ? 'border-rose-500' : 'border-salon-gold/30 focus:border-salon-gold'
                }`}
              />
              {fieldErrors.customerName && (
                <span className="text-[11px] text-rose-400">{fieldErrors.customerName}</span>
              )}
            </div>

            {/* Customer Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Số Điện Thoại <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Ví dụ: 0908123456"
                className={`w-full px-4 py-2.5 rounded-xl bg-salon-noir border text-sm text-white focus:outline-none transition ${
                  fieldErrors.customerPhone ? 'border-rose-500' : 'border-salon-gold/30 focus:border-salon-gold'
                }`}
              />
              {fieldErrors.customerPhone && (
                <span className="text-[11px] text-rose-400">{fieldErrors.customerPhone}</span>
              )}
            </div>

            {/* Customer Email */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-neutral-300">
                Địa Chỉ Email (Không bắt buộc)
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Ví dụ: phuongthao@example.com"
                className="w-full px-4 py-2.5 rounded-xl bg-salon-noir border border-salon-gold/30 focus:border-salon-gold text-sm text-white focus:outline-none transition"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-300">
                  Ghi Chú Hoặc Yêu Cầu Đặc Biệt (Tối đa 500 ký tự)
                </label>
                <span className="text-[11px] text-neutral-500">{notes.length}/500</span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Tư vấn thêm về uốn phồng chân tóc, da đầu nhạy cảm..."
                className="w-full px-4 py-2.5 rounded-xl bg-salon-noir border border-salon-gold/30 focus:border-salon-gold text-sm text-white focus:outline-none transition"
              />
            </div>
          </div>

          {/* Booking Summary Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-salon-noir/90 border border-salon-gold/25 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-salon-gold">
              Tóm Tắt Lịch Hẹn
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-neutral-400 block">Dịch vụ:</span>
                <span className="font-semibold text-white">
                  {activeCombo?.title || activeService?.title || 'Dịch vụ Salon'}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block">Thời gian:</span>
                <span className="font-semibold text-white">
                  {bookingTime} ngày {bookingDate}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block">Stylist:</span>
                <span className="font-semibold text-white">
                  {activeStylist ? `Master ${activeStylist.fullName}` : 'Bất kỳ Stylist sẵn sàng'}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block">Thanh toán:</span>
                <span className="font-semibold text-salon-gold-light">
                  Tại salon sau khi làm
                </span>
              </div>
            </div>
          </div>

          {/* Terms Policy Checkbox */}
          <div className="flex items-start gap-2.5 pt-2">
            <input
              type="checkbox"
              id="policy-check"
              checked={agreedToPolicy}
              onChange={(e) => setAgreedToPolicy(e.target.checked)}
              className="mt-0.5 rounded border-salon-gold text-salon-gold focus:ring-0 cursor-pointer"
            />
            <label htmlFor="policy-check" className="text-xs text-neutral-300 cursor-pointer leading-relaxed">
              Tôi đồng ý với chính sách dịch vụ, giữ chỗ và bảo mật thông tin cá nhân của Salon Hoàng Gia Prestige.
            </label>
          </div>
          {fieldErrors.policy && (
            <span className="text-[11px] text-rose-400 block">{fieldErrors.policy}</span>
          )}

          <div className="pt-6 border-t border-salon-gold/15 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full border border-white/20 text-xs text-neutral-300 hover:text-white disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Quay Lại</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-salon-gold via-salon-gold-light to-salon-gold text-salon-noir font-bold text-xs uppercase tracking-wider hover:opacity-95 shadow-gold-glow transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-salon-noir border-t-transparent rounded-full animate-spin" />
                  <span>Đang Khởi Tạo...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>Xác Nhận & Gửi Lịch Hẹn</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
