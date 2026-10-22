'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Calendar,
  Clock,
  Scissors,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Check,
  ShieldCheck,
  Phone,
  Layers,
} from 'lucide-react';
import { CreateBookingSchema } from '@/lib/validations/booking';

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
  services?: ServiceOption[];
  combos?: ComboOption[];
  stylists?: StylistOption[];
  hairstyles?: HairstyleOption[];
  colors?: ColorOption[];
}

export function BookingWizardClient({
  services = [],
  combos = [],
  stylists = [],
  hairstyles = [],
  colors = [],
}: BookingWizardClientProps) {
  const searchParams = useSearchParams();

  // Wizard state (Step 1 to 4)
  // 1: Dịch vụ (Cắt thông thường hoặc Nhuộm/Tẩy/Uốn)
  // 2: Mẫu tóc (Không bắt buộc, có thể Next qua)
  // 3: Ngày & Giờ
  // 4: Thông tin khách hàng & Xác nhận
  const [currentStep, setCurrentStep] = useState(1);

  // Form inputs
  // Service Type: 'cat-toc' (Cắt tóc thông thường) | 'uon-nhuom-tay' (Có sử dụng nhuộm/tẩy/uốn)
  const [serviceType, setServiceType] = useState<'cat-toc' | 'uon-nhuom-tay'>('cat-toc');
  const [chemicalOptions, setChemicalOptions] = useState<string[]>([]);

  // Optional Hairstyle & Color
  const [selectedHairstyleId, setSelectedHairstyleId] = useState<string>('');
  const [selectedHairColorId, setSelectedHairColorId] = useState<string>('');

  // Date & Time
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingTime, setBookingTime] = useState<string>('');

  // Customer Info
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
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      setIdempotencyKey(crypto.randomUUID());
    } else {
      setIdempotencyKey(`lmr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
    }

    // Pre-populate from URL
    const sId = searchParams.get('serviceId') || '';
    const hId = searchParams.get('hairstyleId') || searchParams.get('styleId') || '';
    const colId = searchParams.get('hairColorId') || searchParams.get('colorId') || '';

    if (
      sId.includes('uon') ||
      sId.includes('nhuom') ||
      sId.includes('tay') ||
      sId.includes('color') ||
      sId.includes('wave')
    ) {
      setServiceType('uon-nhuom-tay');
    } else {
      setServiceType('cat-toc');
    }

    if (hId) setSelectedHairstyleId(hId);
    if (colId) setSelectedHairColorId(colId);

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

  // Selected Hairstyle / Color details
  const activeHairstyle = hairstyles.find((h) => h.id === selectedHairstyleId);
  const activeColor = colors.find((c) => c.id === selectedHairColorId);

  // Toggle chemical sub-options
  const toggleChemicalOption = (opt: string) => {
    setChemicalOptions((prev) =>
      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
    );
  };

  // Service display label
  const getServiceLabel = () => {
    if (serviceType === 'cat-toc') {
      return 'Dịch vụ cắt tóc thông thường (Cắt gội & tạo kiểu cơ bản)';
    }
    if (chemicalOptions.length > 0) {
      return `Có sử dụng Nhuộm / Tẩy / Uốn (${chemicalOptions.join(', ')})`;
    }
    return 'Có sử dụng dịch vụ Nhuộm / Tẩy / Uốn';
  };

  // Step transitions
  const handleNextFromStep1 = () => {
    setFieldErrors({});
    setCurrentStep(2);
  };

  const handleNextFromStep2 = () => {
    setFieldErrors({});
    setCurrentStep(3);
  };

  const handleNextFromStep3 = () => {
    if (!bookingDate) {
      setFieldErrors({ bookingDate: 'Vui lòng chọn ngày hẹn' });
      return;
    }
    if (!bookingTime) {
      setFieldErrors({ bookingTime: 'Vui lòng chọn giờ hẹn' });
      return;
    }
    setFieldErrors({});
    setCurrentStep(4);
  };

  // Submit Handler
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setSubmitError(null);
    setFieldErrors({});

    // Validate using Zod schema
    const validationResult = CreateBookingSchema.safeParse({
      serviceId: serviceType,
      hairstyleId: selectedHairstyleId || undefined,
      hairColorId: selectedHairColorId || undefined,
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
      setFieldErrors({ policy: 'Vui lòng đồng ý với chính sách giữ chỗ của salon' });
      return;
    }

    try {
      setIsSubmitting(true);

      const serviceDetailStr = getServiceLabel();
      const combinedNotes = notes.trim()
        ? `[${serviceDetailStr}] ${notes.trim()}`
        : `[${serviceDetailStr}]`;

      const payload = {
        serviceId: serviceType,
        hairstyleId: selectedHairstyleId || undefined,
        hairColorId: selectedHairColorId || undefined,
        bookingDate,
        bookingTime,
        timeSlot: bookingTime,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        notes: combinedNotes,
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
      <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-salon-charcoal border border-salon-gold/40 shadow-gold-glow text-center space-y-6 animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-salon-gold/20 text-salon-gold mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase tracking-widest text-salon-gold font-bold">
            Tiếp Nhận Thành Công
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
            Lịch Hẹn Của Quý Khách Đã Được Ghi Nhận
          </h2>
          <p className="text-neutral-300 text-sm font-light">
            Cảm ơn quý khách <strong className="text-white">{customerName}</strong>. Lễ tân ACoong Hair Salon sẽ liên hệ qua số điện thoại <strong className="text-salon-gold-light">{customerPhone}</strong> để xác nhận lịch trong ít phút.
          </p>
        </div>

        {/* Booking Code Voucher Box */}
        <div className="p-5 sm:p-6 rounded-2xl bg-salon-noir/90 border border-salon-gold/30 space-y-3 text-left">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs text-neutral-400">Mã lịch hẹn:</span>
            <span className="text-xl font-mono font-bold text-salon-gold">
              {bookingSuccess.bookingCode || 'BK123456'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-neutral-400 block">Thời gian hẹn:</span>
              <span className="font-semibold text-white">
                {bookingTime} — {bookingDate}
              </span>
            </div>

            <div>
              <span className="text-neutral-400 block">Dịch vụ:</span>
              <span className="font-semibold text-white">
                {getServiceLabel()}
              </span>
            </div>

            {activeHairstyle && (
              <div>
                <span className="text-neutral-400 block">Mẫu tóc tham khảo:</span>
                <span className="font-semibold text-salon-gold-light">
                  {activeHairstyle.title || activeHairstyle.name}
                </span>
              </div>
            )}

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
              setSelectedHairstyleId('');
              setSelectedHairColorId('');
              setChemicalOptions([]);
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
      {/* 4-Step Progress Stepper */}
      <div className="p-4 sm:p-6 rounded-2xl bg-salon-charcoal/80 border border-salon-gold/20 shadow-luxury-dark">
        <div className="flex items-center justify-between relative">
          {[
            { step: 1, label: 'Dịch vụ' },
            { step: 2, label: 'Mẫu tóc' },
            { step: 3, label: 'Ngày & Giờ' },
            { step: 4, label: 'Xác nhận' },
          ].map((item) => (
            <div key={item.step} className="flex flex-col items-center relative z-10">
              <button
                type="button"
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
                  currentStep === item.step ? 'text-salon-gold-light font-bold' : 'text-neutral-400'
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
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* STEP 1: Select Simplified Service (Cắt thông thường vs Nhuộm/Tẩy/Uốn) */}
      {currentStep === 1 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-salon-charcoal/80 border border-salon-gold/20 shadow-luxury-dark space-y-6 animate-fadeIn">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-widest text-salon-gold font-bold">
              Bước 1/4: Lựa Chọn Dịch Vụ
            </span>
            <h2 className="text-2xl font-serif font-bold text-white">
              Quý Khách Cần Dịch Vụ Gì Hôm Nay?
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm font-light">
              Chọn nhóm dịch vụ mong muốn để salon bố trí thời gian và trang thiết bị chu đáo nhất.
            </p>
          </div>

          {/* 2 Clear Primary Service Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* Option 1: Dịch vụ cắt tóc thông thường */}
            <div
              onClick={() => {
                setServiceType('cat-toc');
                setFieldErrors({});
              }}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-5 ${
                serviceType === 'cat-toc'
                  ? 'bg-salon-gold/15 border-salon-gold shadow-gold-glow scale-[1.01]'
                  : 'bg-salon-noir/80 border-white/10 hover:border-salon-gold/40'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-salon-gold/20 border border-salon-gold/40 flex items-center justify-center text-salon-gold">
                    <Scissors className="w-6 h-6" />
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                      serviceType === 'cat-toc'
                        ? 'border-salon-gold bg-salon-gold text-salon-noir'
                        : 'border-white/30'
                    }`}
                  >
                    {serviceType === 'cat-toc' && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                </div>

                <div>
                  <h3 className="font-serif font-bold text-xl text-white">
                    Cắt Tóc Thông Thường
                  </h3>
                  <span className="inline-block mt-1 text-xs text-salon-gold font-medium bg-salon-gold/10 px-2.5 py-0.5 rounded-full border border-salon-gold/25">
                    Cắt gội & sấy tạo kiểu cơ bản
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
                  Dành cho quý khách có nhu cầu cắt tạo form, cắt tỉa gọn gàng, sấy vuốt sáp tạo kiểu chuẩn phom dáng tóc nam hoặc nữ.
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-salon-gold" />
                  <span>Thời gian: ~30 - 45 phút</span>
                </span>
                <span className="text-salon-gold font-bold">Chỉ từ 150.000đ</span>
              </div>
            </div>

            {/* Option 2: Có sử dụng dịch vụ Nhuộm / Tẩy / Uốn */}
            <div
              onClick={() => {
                setServiceType('uon-nhuom-tay');
                setFieldErrors({});
              }}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-5 ${
                serviceType === 'uon-nhuom-tay'
                  ? 'bg-salon-gold/15 border-salon-gold shadow-gold-glow scale-[1.01]'
                  : 'bg-salon-noir/80 border-white/10 hover:border-salon-gold/40'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-salon-gold/20 border border-salon-gold/40 flex items-center justify-center text-salon-gold">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                      serviceType === 'uon-nhuom-tay'
                        ? 'border-salon-gold bg-salon-gold text-salon-noir'
                        : 'border-white/30'
                    }`}
                  >
                    {serviceType === 'uon-nhuom-tay' && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                </div>

                <div>
                  <h3 className="font-serif font-bold text-xl text-white">
                    Có Sử Dụng Nhuộm / Tẩy / Uốn
                  </h3>
                  <span className="inline-block mt-1 text-xs text-salon-gold font-medium bg-salon-gold/10 px-2.5 py-0.5 rounded-full border border-salon-gold/25">
                    Hóa chất & phục hồi chuyên sâu
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
                  Dành cho quý khách muốn uốn tạo sóng bồng bềnh, nhuộm màu thời trang, tẩy nâng tông hoặc phục hồi cấu trúc tóc hư tổn.
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-salon-gold" />
                  <span>Thời gian: ~1.5 - 3.5 giờ</span>
                </span>
                <span className="text-salon-gold font-bold">Tư vấn báo giá tại Salon</span>
              </div>
            </div>
          </div>

          {/* Sub-options for Chemical services (when Option 2 is selected) */}
          {serviceType === 'uon-nhuom-tay' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-salon-noir/90 border border-salon-gold/30 space-y-3 animate-fadeIn">
              <span className="text-xs font-semibold text-salon-gold uppercase tracking-wider block">
                Tùy chọn dịch vụ quan tâm (Chọn nhiều mục nếu cần):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  'Uốn tóc tạo kiểu',
                  'Nhuộm màu thời trang',
                  'Tẩy tóc nâng tông',
                  'Phục hồi Keratin',
                ].map((item) => {
                  const isChecked = chemicalOptions.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleChemicalOption(item)}
                      className={`p-2.5 rounded-xl text-xs font-medium border text-left transition flex items-center justify-between ${
                        isChecked
                          ? 'bg-salon-gold/20 border-salon-gold text-salon-gold font-semibold'
                          : 'bg-salon-charcoal/50 border-white/10 text-neutral-300 hover:border-salon-gold/30'
                      }`}
                    >
                      <span className="truncate">{item}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 shrink-0 ml-1 text-salon-gold" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-salon-gold/15 flex items-center justify-between">
            <span className="text-xs text-neutral-400">
              Đang chọn: <strong className="text-white">{serviceType === 'cat-toc' ? 'Cắt tóc thông thường' : 'Có sử dụng Nhuộm / Tẩy / Uốn'}</strong>
            </span>
            <button
              type="button"
              onClick={handleNextFromStep1}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-salon-gold via-salon-gold-light to-salon-gold text-salon-noir font-bold text-xs uppercase tracking-wider hover:opacity-95 shadow-gold-glow transition"
            >
              <span>Tiếp Tục Chọn Mẫu Tóc</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Optional Hairstyle & Color (Không bắt buộc, có thể Next qua) */}
      {currentStep === 2 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-salon-charcoal/80 border border-salon-gold/20 shadow-luxury-dark space-y-6 animate-fadeIn">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-salon-gold font-bold">
                Bước 2/4: Mẫu Tóc Tham Khảo
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Không bắt buộc
              </span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-white">
              Chọn Mẫu Tóc Hoặc Màu Nhuộm Bạn Thích
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm font-light">
              Giúp thợ salon hình dung phong cách của bạn trước. Bạn hoàn toàn có thể <strong>bấm Tiếp tục</strong> để bỏ qua bước này và được tư vấn trực tiếp tại Salon.
            </p>
          </div>

          {/* Hairstyles Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider text-salon-gold-light font-semibold">
                Kiểu Tóc Tham Khảo:
              </h3>
              {selectedHairstyleId && (
                <button
                  type="button"
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
          {colors.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wider text-salon-gold-light font-semibold">
                  Màu Nhuộm Tham Khảo:
                </h3>
                {selectedHairColorId && (
                  <button
                    type="button"
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
          )}

          {/* Step 2 Actions: Can ALWAYS Next / Skip past */}
          <div className="pt-6 border-t border-salon-gold/15 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full border border-white/20 text-xs text-neutral-300 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Quay Lại</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleNextFromStep2}
                className="text-xs text-neutral-400 hover:text-salon-gold underline hidden sm:inline"
              >
                Bỏ qua bước này
              </button>

              <button
                type="button"
                onClick={handleNextFromStep2}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-salon-gold via-salon-gold-light to-salon-gold text-salon-noir font-bold text-xs uppercase tracking-wider hover:opacity-95 shadow-gold-glow transition"
              >
                <span>Tiếp Tục Chọn Ngày Giờ</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Pick Date & Time Slot (08:30 - 20:30) */}
      {currentStep === 3 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-salon-charcoal/80 border border-salon-gold/20 shadow-luxury-dark space-y-6 animate-fadeIn">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-widest text-salon-gold font-bold">
              Bước 3/4: Thời Gian Hẹn
            </span>
            <h2 className="text-2xl font-serif font-bold text-white">
              Chọn Ngày & Khung Giờ Đến Salon
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm font-light">
              Giờ mở cửa phục vụ: <strong>08:30 - 20:30 Hàng ngày</strong>.
            </p>
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
                  type="button"
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
                    type="button"
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
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full border border-white/20 text-xs text-neutral-300 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Quay Lại</span>
            </button>
            <button
              type="button"
              onClick={handleNextFromStep3}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-salon-gold via-salon-gold-light to-salon-gold text-salon-noir font-bold text-xs uppercase tracking-wider hover:opacity-95 shadow-gold-glow transition"
            >
              <span>Tiếp Tục Nhập Thông Tin</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Customer Details & Final Confirmation */}
      {currentStep === 4 && (
        <form
          onSubmit={handleFinalSubmit}
          className="p-6 sm:p-8 rounded-3xl bg-salon-charcoal/80 border border-salon-gold/20 shadow-luxury-dark space-y-6 animate-fadeIn"
        >
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-widest text-salon-gold font-bold">
              Bước 4/4: Thông Tin Khách Hàng & Xác Nhận
            </span>
            <h2 className="text-2xl font-serif font-bold text-white">
              Hoàn Tất Đặt Lịch Hẹn
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm font-light">
              Vui lòng điền thông tin liên hệ để nhân viên salon xác nhận và đón tiếp bạn đúng giờ.
            </p>
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
                placeholder="Ví dụ: Nguyễn Văn A"
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
                placeholder="Ví dụ: 0981438118"
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
                placeholder="Ví dụ: email@example.com"
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
                placeholder="Ví dụ: Tư vấn thêm về dáng tóc hợp mặt tròn, da đầu nhạy cảm..."
                className="w-full px-4 py-2.5 rounded-xl bg-salon-noir border border-salon-gold/30 focus:border-salon-gold text-sm text-white focus:outline-none transition"
              />
            </div>
          </div>

          {/* Booking Summary Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-salon-noir/90 border border-salon-gold/25 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-salon-gold">
              Tóm Tắt Lịch Hẹn
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-neutral-400 block">Dịch vụ:</span>
                <span className="font-semibold text-white">
                  {getServiceLabel()}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block">Thời gian:</span>
                <span className="font-semibold text-white">
                  {bookingTime} ngày {bookingDate}
                </span>
              </div>
              {activeHairstyle && (
                <div>
                  <span className="text-neutral-400 block">Mẫu tóc tham khảo:</span>
                  <span className="font-semibold text-salon-gold-light">
                    {activeHairstyle.title || activeHairstyle.name}
                  </span>
                </div>
              )}
              <div>
                <span className="text-neutral-400 block">Thanh toán:</span>
                <span className="font-semibold text-salon-gold-light">
                  Thanh toán tại salon sau khi làm
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
              Tôi đồng ý với chính sách dịch vụ, giữ chỗ và bảo mật thông tin cá nhân của salon.
            </label>
          </div>
          {fieldErrors.policy && (
            <span className="text-[11px] text-rose-400 block">{fieldErrors.policy}</span>
          )}

          <div className="pt-6 border-t border-salon-gold/15 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
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
