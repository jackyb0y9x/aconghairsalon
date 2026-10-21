'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  UploadCloud,
  Camera,
  RotateCcw,
  Sparkles,
  Calendar,
  Download,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Eye,
  EyeOff,
  Search,
  Scissors,
  Palette,
  ShieldCheck,
  Check,
  ArrowRight,
  RefreshCw,
  X,
  FlipHorizontal,
  ChevronRight,
  Info,
} from 'lucide-react';
import { BeforeAfterSlider } from '@/components/public/BeforeAfterSlider';
import { formatVND } from '@/lib/utils';
import {
  ALLOWED_TRYON_MIME_TYPES,
  MAX_TRYON_FILE_SIZE_BYTES,
  TryOnApiResponse,
} from '@/lib/validations/try-on';

export type TryOnStepState =
  | 'EMPTY'
  | 'PHOTO_READY'
  | 'CONFIGURING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'ERROR';

export interface HairstyleOption {
  id: string;
  name?: string;
  title?: string;
  slug: string;
  coverImageUrl?: string;
  images?: string[];
  gender: string;
  length?: string;
  style?: string;
  styleVibe?: string;
  price?: number;
  features?: string[];
}

export interface HairColorOption {
  id: string;
  name: string;
  code?: string;
  hexCode?: string;
  hexColor?: string;
  secondaryHex?: string | null;
  tone: string;
  group?: string;
  requiresBleach?: boolean;
}

interface TryOnClientProps {
  initialHairstyles: HairstyleOption[];
  initialColors: HairColorOption[];
}

export function TryOnClient({ initialHairstyles, initialColors }: TryOnClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Core State
  const [stepState, setStepState] = useState<TryOnStepState>('EMPTY');
  const [userImageBase64, setUserImageBase64] = useState<string>('');
  const [userImageMime, setUserImageMime] = useState<string>('image/jpeg');
  const [selectedHairstyle, setSelectedHairstyle] = useState<HairstyleOption | null>(null);
  const [selectedColor, setSelectedColor] = useState<HairColorOption | null>(null);
  const [intensity, setIntensity] = useState<number>(0.85); // 0.0 - 1.0
  const [simulationResult, setSimulationResult] = useState<TryOnApiResponse | null>(null);
  const [resultViewMode, setResultViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const [showGuidelines, setShowGuidelines] = useState<boolean>(true);
  const [isPressingOriginal, setIsPressingOriginal] = useState<boolean>(false);

  // Loading & Error States
  const [progressStep, setProgressStep] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [genderFilter, setGenderFilter] = useState<string>('ALL');
  const [hairSearch, setHairSearch] = useState<string>('');
  const [colorToneFilter, setColorToneFilter] = useState<string>('ALL');

  // Drag & Drop State
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // 1. Hydrate from URL SearchParams
  useEffect(() => {
    const styleParam = searchParams.get('hairstyleId') || searchParams.get('styleId');
    const colorParam = searchParams.get('hairColorId') || searchParams.get('colorId');

    if (styleParam && initialHairstyles.length > 0) {
      const found = initialHairstyles.find(
        (h) => h.id === styleParam || h.slug === styleParam
      );
      if (found) {
        setSelectedHairstyle(found);
        setStepState((prev) => (prev === 'PHOTO_READY' ? 'CONFIGURING' : prev));
      }
    }

    if (colorParam && initialColors.length > 0) {
      const foundColor = initialColors.find(
        (c) => c.id === colorParam || c.code === colorParam
      );
      if (foundColor) {
        setSelectedColor(foundColor);
      }
    }
  }, [searchParams, initialHairstyles, initialColors]);

  // 2. Camera Controls
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } else {
        throw new Error('Thiết bị không hỗ trợ truy cập camera trực tiếp.');
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        'Không thể mở camera. Vui lòng cấp quyền truy cập camera trong trình duyệt hoặc sử dụng tính năng tải ảnh.'
      );
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally for mirror effect if frontal
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    stopCamera();
    handleImageDataLoaded(dataUrl, 'image/jpeg');
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // 3. Process File Upload
  const processSelectedFile = (file: File) => {
    setErrorMessage(null);

    // Kích thước tệp tối đa 5MB
    if (file.size > MAX_TRYON_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMessage(
        `Dung lượng ảnh (${sizeMb}MB) vượt quá giới hạn tối đa cho phép là 5MB. Vui lòng chọn ảnh nhỏ hơn.`
      );
      return;
    }

    // Kiểm tra định dạng MIME
    const mime = file.type.toLowerCase();
    if (!ALLOWED_TRYON_MIME_TYPES.includes(mime as any)) {
      setErrorMessage(
        'Định dạng ảnh không được hỗ trợ. Vui lòng chọn ảnh JPG, PNG hoặc WebP.'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        handleImageDataLoaded(result, mime);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Đã xảy ra lỗi khi đọc file ảnh. Vui lòng thử lại.');
    };
    reader.readAsDataURL(file);
  };

  const handleImageDataLoaded = (base64: string, mime: string) => {
    setUserImageBase64(base64);
    setUserImageMime(mime);
    setSimulationResult(null);
    setErrorMessage(null);

    if (selectedHairstyle) {
      setStepState('CONFIGURING');
    } else {
      setStepState('PHOTO_READY');
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // 4. Filtered Hairstyles & Colors
  const filteredHairstyles = useMemo(() => {
    return initialHairstyles.filter((h) => {
      if (genderFilter !== 'ALL') {
        const g = (h.gender || '').toUpperCase();
        if (genderFilter === 'WOMEN' && g !== 'FEMALE' && g !== 'WOMEN' && g !== 'UNISEX') {
          return false;
        }
        if (genderFilter === 'MEN' && g !== 'MALE' && g !== 'MEN' && g !== 'UNISEX') {
          return false;
        }
        if (genderFilter === 'UNISEX' && g !== 'UNISEX') {
          return false;
        }
      }

      if (hairSearch.trim().length > 0) {
        const q = hairSearch.toLowerCase().trim();
        const name = (h.name || h.title || '').toLowerCase();
        const vibe = (h.styleVibe || h.style || '').toLowerCase();
        const len = (h.length || '').toLowerCase();
        if (!name.includes(q) && !vibe.includes(q) && !len.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [initialHairstyles, genderFilter, hairSearch]);

  const filteredColors = useMemo(() => {
    return initialColors.filter((c) => {
      if (colorToneFilter === 'ALL') return true;
      return (c.tone || '').toUpperCase() === colorToneFilter;
    });
  }, [initialColors, colorToneFilter]);

  // 5. Select Style and Color
  const handleSelectStyle = (style: HairstyleOption) => {
    setSelectedHairstyle(style);
    if (userImageBase64) {
      setStepState('CONFIGURING');
    }
  };

  const handleSelectColor = (color: HairColorOption | null) => {
    setSelectedColor(color);
  };

  // 6. Execute Simulation Request
  const handleStartSimulation = async () => {
    if (!userImageBase64) {
      setErrorMessage('Vui lòng tải hoặc chụp ảnh chân dung trước khi mô phỏng.');
      return;
    }
    if (!selectedHairstyle) {
      setErrorMessage('Vui lòng chọn kiểu tóc cần thử nghiệm.');
      return;
    }

    setStepState('PROCESSING');
    setProgressStep(1);
    setErrorMessage(null);

    // Multi-phase progress ticker
    const timer1 = setTimeout(() => setProgressStep(2), 500);
    const timer2 = setTimeout(() => setProgressStep(3), 1000);
    const timer3 = setTimeout(() => setProgressStep(4), 1500);

    try {
      const hairstyleImageUrl =
        selectedHairstyle.coverImageUrl ||
        (selectedHairstyle.images && selectedHairstyle.images[0]) ||
        '';

      const response = await fetch('/api/try-on', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: userImageBase64,
          mimeType: userImageMime,
          hairstyleId: selectedHairstyle.id,
          hairColorId: selectedColor?.id || null,
          options: {
            intensity,
            hairstyleTitle: selectedHairstyle.name || selectedHairstyle.title || selectedHairstyle.id,
            hairColorHex: selectedColor?.hexCode || selectedColor?.hexColor || '#C5A880',
            hairstyleImageUrl,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi thực hiện mô phỏng kiểu tóc.');
      }

      setSimulationResult(data);
      setStepState('SUCCESS');
    } catch (err: any) {
      console.error('Simulation error:', err);
      setErrorMessage(err.message || 'Không thể kết nối đến máy chủ mô phỏng. Vui lòng thử lại.');
      setStepState('ERROR');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    }
  };

  // 7. Post-Simulation Actions
  const handleSaveImage = () => {
    if (!simulationResult?.resultImageBase64) return;
    const link = document.createElement('a');
    link.href = simulationResult.resultImageBase64;
    const styleSlug = selectedHairstyle?.slug || 'style';
    const isJpeg =
      simulationResult.resultImageBase64.startsWith('data:image/jpeg') ||
      simulationResult.resultImageBase64.startsWith('data:image/jpg');
    const isPng = simulationResult.resultImageBase64.startsWith('data:image/png');
    const ext = isJpeg ? 'jpg' : isPng ? 'png' : 'svg';
    link.download = `cong-nguyen-tryon-${styleSlug}-${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setUserImageBase64('');
    setSimulationResult(null);
    setErrorMessage(null);
    setStepState('EMPTY');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTryAnother = () => {
    setSimulationResult(null);
    setStepState('CONFIGURING');
  };

  // Booking URL
  const bookingUrl = useMemo(() => {
    if (!selectedHairstyle) return '/booking';
    const params = new URLSearchParams();
    params.set('hairstyleId', selectedHairstyle.id);
    if (selectedColor) {
      params.set('hairColorId', selectedColor.id);
    }
    params.set(
      'notes',
      `Khách hàng đã thử nghiệm trên công cụ AI Try-On và chọn kiểu ${selectedHairstyle.name || selectedHairstyle.title}${selectedColor ? ` màu ${selectedColor.name}` : ''}.`
    );
    return `/booking?${params.toString()}`;
  }, [selectedHairstyle, selectedColor]);

  // Intensity descriptive label
  const intensityDescription = useMemo(() => {
    const pct = Math.round(intensity * 100);
    if (pct <= 35) return 'Ánh sắc nhẹ thoang thoảng tự nhiên';
    if (pct <= 75) return 'Sắc độ tiêu chuẩn, hài hòa với khuôn mặt';
    return 'Sắc nét rực rỡ, chuẩn màu thời trang Haute Couture';
  }, [intensity]);

  return (
    <div className="space-y-8">
      {/* Top Banner / Privacy Alert if any */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 flex items-start gap-3 backdrop-blur-md">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div className="flex-1 text-sm space-y-1">
            <p className="font-semibold text-red-300">Thông báo</p>
            <p>{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 hover:bg-white/10 rounded transition-colors text-red-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Workspace Canvas & Preview (5/12) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-salon-charcoal/80 border border-salon-gold/30 rounded-2xl p-4 sm:p-6 shadow-luxury-dark backdrop-blur-md relative overflow-hidden">
            {/* Ambient gold glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-salon-gold/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-salon-gold" />
                <span>Gương Soi Phong Cách</span>
              </h2>

              {stepState !== 'EMPTY' && (
                <div className="flex items-center gap-2">
                  {stepState === 'SUCCESS' && (
                    <div className="flex items-center bg-black/60 p-0.5 rounded-lg border border-salon-gold/30">
                      <button
                        type="button"
                        onClick={() => setResultViewMode('slider')}
                        className={`px-2 py-0.5 text-xs rounded font-medium transition-all ${
                          resultViewMode === 'slider'
                            ? 'bg-salon-gold text-salon-noir font-bold'
                            : 'text-neutral-300 hover:text-white'
                        }`}
                      >
                        Trượt so sánh
                      </button>
                      <button
                        type="button"
                        onClick={() => setResultViewMode('side-by-side')}
                        className={`px-2 py-0.5 text-xs rounded font-medium transition-all ${
                          resultViewMode === 'side-by-side'
                            ? 'bg-salon-gold text-salon-noir font-bold'
                            : 'text-neutral-300 hover:text-white'
                        }`}
                      >
                        Song song
                      </button>
                    </div>
                  )}

                  {stepState !== 'SUCCESS' && (
                    <button
                      onClick={() => setShowGuidelines((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-salon-gold/20 bg-salon-noir/60 text-salon-gold-light hover:border-salon-gold/50 transition-colors"
                      title={showGuidelines ? 'Ẩn khung căn chỉnh mặt' : 'Hiện khung căn chỉnh mặt'}
                    >
                      {showGuidelines ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showGuidelines ? 'Ẩn khung' : 'Hiện khung'}</span>
                    </button>
                  )}

                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-white/10 bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Đổi ảnh</span>
                  </button>
                </div>
              )}
            </div>

            {/* Canvas Viewport */}
            <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-salon-noir border border-salon-gold/20 flex items-center justify-center">
              {/* STATE 1: EMPTY - Dropzone & Camera Button */}
              {stepState === 'EMPTY' && !isCameraActive && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`w-full h-full flex flex-col items-center justify-center p-6 text-center transition-all duration-200 cursor-pointer ${
                    isDraggingFile
                      ? 'border-2 border-salon-gold bg-salon-gold/10 scale-[1.01]'
                      : 'hover:bg-salon-gold/5'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processSelectedFile(e.target.files[0]);
                      }
                    }}
                  />

                  {/* Visual Face Oval Guideline Mockup */}
                  <div className="relative w-44 h-56 mb-4 rounded-[50%/60%] border-2 border-dashed border-salon-gold/30 flex flex-col items-center justify-center p-3 pointer-events-none">
                    {/* Eye line */}
                    <div className="w-full border-t border-dashed border-salon-gold/25 absolute top-[38%]" />
                    {/* Chin marker */}
                    <div className="w-12 h-3 border-b-2 border-salon-gold/40 rounded-b-full absolute bottom-4" />
                    <UploadCloud className="w-10 h-10 text-salon-gold mb-2 animate-bounce" />
                    <p className="text-xs text-salon-gold-light font-medium">Kéo thả ảnh chân dung</p>
                  </div>

                  <p className="text-sm text-neutral-300 font-medium">
                    Nhấp hoặc kéo thả ảnh chân dung chính diện
                  </p>
                  <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                    Hỗ trợ JPG, PNG, WebP (Tối đa 5.0 MB)
                  </p>

                  <div className="mt-5 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-salon-gold-dark via-salon-gold to-salon-gold-light text-salon-noir text-xs font-bold shadow-gold-glow hover:brightness-110 transition-all flex items-center gap-1.5"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Tải ảnh từ máy</span>
                    </button>

                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2 rounded-xl border border-salon-gold/40 bg-salon-noir/80 text-salon-gold-light text-xs font-semibold hover:border-salon-gold hover:bg-salon-gold/10 transition-all flex items-center gap-1.5"
                    >
                      <Camera className="w-4 h-4 text-salon-gold" />
                      <span>Chụp webcam</span>
                    </button>
                  </div>
                </div>
              )}

              {/* LIVE CAMERA MODE */}
              {isCameraActive && (
                <div className="relative w-full h-full bg-black flex flex-col items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />

                  {/* Oval overlay on video stream */}
                  {showGuidelines && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-[68%] h-[78%] rounded-[50%/60%] border-2 border-dashed border-salon-gold shadow-[0_0_20px_rgba(212,175,55,0.4)] flex flex-col items-center justify-center relative">
                        <div className="w-full border-t border-dashed border-salon-gold/40 absolute top-[38%]" />
                        <span className="absolute top-[35%] right-2 text-[10px] text-salon-gold/80 uppercase tracking-widest">
                          Tầm mắt
                        </span>
                        <div className="w-16 h-3 border-b-2 border-salon-gold rounded-b-full absolute bottom-6" />
                        <span className="absolute bottom-1 text-[10px] text-salon-gold/80 uppercase tracking-widest">
                          Vị trí cằm
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Camera Action Buttons */}
                  <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4 z-20">
                    <button
                      onClick={stopCamera}
                      className="p-3 rounded-full bg-salon-noir/80 border border-white/20 text-white hover:bg-white/20 transition-all"
                      title="Đóng camera"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <button
                      onClick={capturePhoto}
                      className="w-14 h-14 rounded-full border-4 border-white bg-salon-gold flex items-center justify-center shadow-gold-glow hover:scale-105 active:scale-95 transition-all text-salon-noir"
                      title="Chụp ảnh ngay"
                    >
                      <Camera className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 2 & 3: PHOTO_READY / CONFIGURING (Original Image with Guide) */}
              {(stepState === 'PHOTO_READY' || stepState === 'CONFIGURING') && !isCameraActive && (
                <div className="relative w-full h-full">
                  <img
                    src={userImageBase64}
                    alt="Chân dung của bạn"
                    className="w-full h-full object-cover"
                  />

                  {/* Face Framing Overlay */}
                  {showGuidelines && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-[68%] h-[78%] rounded-[50%/60%] border-2 border-dashed border-salon-gold/70 shadow-[0_0_20px_rgba(212,175,55,0.3)] flex flex-col items-center justify-center relative">
                        <div className="w-full border-t border-dashed border-salon-gold/40 absolute top-[38%]" />
                        <span className="absolute top-[35%] right-2 text-[9px] text-salon-gold/90 font-mono tracking-wider">
                          ĐƯỜNG MẮT
                        </span>
                        <div className="w-16 h-3 border-b-2 border-salon-gold/60 rounded-b-full absolute bottom-6" />
                        <span className="absolute bottom-1 text-[9px] text-salon-gold/90 font-mono tracking-wider">
                          ĐÁY CẰM
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-salon-noir/80 text-salon-gold-light border border-salon-gold/40 backdrop-blur-md">
                    ẢNH GỐC
                  </div>
                </div>
              )}

              {/* STATE 4: PROCESSING (Progressive 4-Step Salon Aura) */}
              {stepState === 'PROCESSING' && (
                <div className="relative w-full h-full bg-salon-noir/95 flex flex-col items-center justify-center p-6 text-center space-y-6">
                  {/* Blurred photo backdrop */}
                  {userImageBase64 && (
                    <img
                      src={userImageBase64}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md pointer-events-none"
                    />
                  )}

                  {/* Pulsing Aura Rings */}
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-salon-gold animate-ping opacity-30" />
                    <div className="absolute inset-2 rounded-full border-2 border-salon-gold/60 animate-spin border-t-transparent" />
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-salon-gold-dark via-salon-gold to-salon-gold-light flex items-center justify-center shadow-gold-glow text-salon-noir">
                      <Sparkles className="w-9 h-9 animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-2 z-10 max-w-xs">
                    <p className="text-xs font-semibold uppercase tracking-widest text-salon-gold">
                      Giai đoạn {progressStep}/4
                    </p>
                    <h3 className="text-base font-serif font-bold text-white transition-all duration-300">
                      {progressStep === 1 && 'Phân tích cấu trúc khuôn mặt...'}
                      {progressStep === 2 && `Tạo phom tóc ${selectedHairstyle?.name || selectedHairstyle?.title || ''}...`}
                      {progressStep === 3 && `Phủ sắc độ màu ${(intensity * 100).toFixed(0)}%...`}
                      {progressStep === 4 && 'Hoàn thiện ánh sáng chuẩn Salon...'}
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Đang xử lý trong bộ nhớ RAM tạm thời bảo mật...
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="w-48 h-1.5 rounded-full bg-white/10 overflow-hidden z-10">
                    <div
                      className="h-full bg-gradient-to-r from-salon-gold-dark to-salon-gold transition-all duration-500 rounded-full"
                      style={{ width: `${progressStep * 25}%` }}
                    />
                  </div>
                </div>
              )}

              {/* STATE 5: SUCCESS (Interactive Before/After Slider or Side-by-Side) */}
              {stepState === 'SUCCESS' && simulationResult && (
                <div className="relative w-full h-full">
                  {resultViewMode === 'slider' ? (
                    isPressingOriginal ? (
                      <div className="relative w-full h-full">
                        <img
                          src={userImageBase64}
                          alt="Ảnh gốc trước khi làm"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-[11px] font-bold bg-salon-noir/80 text-neutral-300 border border-white/20 backdrop-blur-md">
                          ĐANG XEM ẢNH GỐC
                        </span>
                      </div>
                    ) : (
                      <BeforeAfterSlider
                        beforeImageUrl={userImageBase64}
                        afterImageUrl={simulationResult.resultImageBase64}
                        beforeAlt="Hình ảnh trước khi làm"
                        afterAlt="Mô phỏng kiểu tóc mới"
                        className="w-full h-full"
                      />
                    )
                  ) : (
                    <div className="grid grid-cols-2 h-full w-full gap-1.5 p-1.5 bg-black/90">
                      <div className="relative h-full rounded-lg overflow-hidden border border-white/15 bg-black">
                        <img
                          src={userImageBase64}
                          alt="Ảnh chân dung gốc"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[10px] font-bold bg-black/80 text-neutral-200 border border-white/20 backdrop-blur-sm">
                          ẢNH GỐC
                        </span>
                      </div>
                      <div className="relative h-full rounded-lg overflow-hidden border border-salon-gold/60 bg-black shadow-gold-glow">
                        <img
                          src={simulationResult.resultImageBase64}
                          alt="Kiểu tóc mới đã ghép"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[10px] font-bold bg-salon-gold text-salon-noir shadow-md">
                          MÔ PHỎNG MỚI
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Simulation Badge */}
                  <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-salon-noir/85 border border-salon-gold/40 text-[10px] font-bold tracking-wider text-salon-gold-light backdrop-blur-md shadow-md">
                      <span className="w-2 h-2 rounded-full bg-salon-gold animate-pulse" />
                      <span>CÔNG NGUYỄN AI SIMULATION</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STATE 6: ERROR Fallback */}
              {stepState === 'ERROR' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-serif font-bold text-white">Mô phỏng chưa thành công</h3>
                  <p className="text-xs text-neutral-300 max-w-xs leading-relaxed">
                    {errorMessage || 'Đã xảy ra lỗi trong quá trình xử lý ảnh. Vui lòng thử lại.'}
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={handleStartSimulation}
                      className="px-4 py-2 rounded-xl bg-salon-gold text-salon-noir text-xs font-bold hover:brightness-110 transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Thử lại</span>
                    </button>
                    <Link
                      href="/booking"
                      className="px-4 py-2 rounded-xl border border-salon-gold/30 text-salon-gold-light text-xs font-semibold hover:bg-salon-gold/10 transition-all"
                    >
                      Đặt lịch trực tiếp
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Hold to Compare Button & Stylist Disclaimer (SUCCESS State) */}
            {stepState === 'SUCCESS' && (
              <div className="mt-4 space-y-3">
                {selectedHairstyle && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-salon-gold/10 border border-salon-gold/30">
                    {(selectedHairstyle.coverImageUrl || selectedHairstyle.images?.[0]) && (
                      <img
                        src={selectedHairstyle.coverImageUrl || selectedHairstyle.images?.[0]}
                        alt={selectedHairstyle.name || selectedHairstyle.title || ''}
                        className="w-14 h-14 rounded-lg object-cover border border-salon-gold/50 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-salon-gold font-semibold uppercase tracking-wider">
                        Kiểu tóc đã chọn ghép:
                      </p>
                      <p className="text-sm font-bold text-white truncate">
                        {selectedHairstyle.name || selectedHairstyle.title}
                      </p>
                      {selectedColor && (
                        <p className="text-xs text-neutral-300 flex items-center gap-1.5 mt-0.5">
                          <span
                            className="w-3 h-3 rounded-full inline-block border border-white/30"
                            style={{ backgroundColor: selectedColor.hexColor || selectedColor.hexCode }}
                          />
                          <span>{selectedColor.name}</span>
                          <span className="text-[10px] text-salon-gold font-mono">
                            ({Math.round(intensity * 100)}% sắc độ)
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <button
                    onMouseDown={() => setIsPressingOriginal(true)}
                    onMouseUp={() => setIsPressingOriginal(false)}
                    onTouchStart={() => setIsPressingOriginal(true)}
                    onTouchEnd={() => setIsPressingOriginal(false)}
                    className="flex-1 py-2 px-3 rounded-xl border border-salon-gold/30 bg-salon-noir/60 text-salon-gold-light text-xs font-medium hover:border-salon-gold flex items-center justify-center gap-1.5 transition-colors select-none"
                  >
                    <Eye className="w-3.5 h-3.5 text-salon-gold" />
                    <span>Nhấn giữ xem ảnh gốc</span>
                  </button>

                  <button
                    onClick={handleSaveImage}
                    className="py-2 px-3 rounded-xl border border-salon-gold/30 bg-salon-noir/60 text-white text-xs font-medium hover:border-salon-gold hover:text-salon-gold-light flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-salon-gold" />
                    <span>Tải ảnh</span>
                  </button>
                </div>

                {/* Stylist Disclaimer Box */}
                <div className="p-3 rounded-xl bg-salon-gold/5 border border-salon-gold/20 text-xs text-neutral-300 space-y-1">
                  <div className="flex items-center gap-1.5 text-salon-gold-light font-semibold">
                    <Info className="w-3.5 h-3.5" />
                    <span>Khuyến cáo chuyên gia Stylist:</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed italic">
                    &quot;Hình ảnh mang tính chất tham khảo phong cách. Chuyên viên stylist sẽ trực tiếp tư vấn sắc độ và kết cấu tóc thực tế trước khi thực hiện.&quot;
                  </p>
                </div>

                {/* Metric Telemetry */}
                {simulationResult?.processingTimeMs && (
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1 font-mono">
                    <span>Thời gian xử lý: {(simulationResult.processingTimeMs / 1000).toFixed(2)}s</span>
                    <span>Provider: {simulationResult.provider}</span>
                  </div>
                )}
              </div>
            )}

            {/* Primary Action Buttons Below Viewport */}
            <div className="mt-6 pt-4 border-t border-salon-gold/15 space-y-3">
              {stepState === 'SUCCESS' ? (
                <div className="space-y-2">
                  <Link
                    href={bookingUrl}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-salon-gold-dark via-salon-gold to-salon-gold-light text-salon-noir font-bold text-sm tracking-wide shadow-gold-glow hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Đặt Lịch Với Kiểu Tóc Này</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>

                  <button
                    onClick={handleTryAnother}
                    className="w-full py-2.5 px-4 rounded-xl border border-salon-gold/30 bg-transparent text-salon-gold-light text-xs font-semibold hover:bg-salon-gold/10 transition-colors"
                  >
                    Thử Kiểu Khác Trên Ảnh Này
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStartSimulation}
                  disabled={!userImageBase64 || !selectedHairstyle || stepState === 'PROCESSING'}
                  className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 ${
                    !userImageBase64 || !selectedHairstyle || stepState === 'PROCESSING'
                      ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-white/5'
                      : 'bg-gradient-to-r from-salon-gold-dark via-salon-gold to-salon-gold-light text-salon-noir shadow-gold-glow hover:brightness-110 active:scale-[0.99]'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {!userImageBase64
                      ? 'Vui lòng tải ảnh chân dung trước'
                      : !selectedHairstyle
                      ? 'Chọn 1 kiểu tóc để bắt đầu mô phỏng'
                      : stepState === 'PROCESSING'
                      ? 'Đang tạo diện mạo mới...'
                      : 'Bắt Đầu Mô Phỏng Phong Cách'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Privacy Guarantee Card */}
          <div className="p-4 rounded-xl bg-salon-charcoal/50 border border-salon-gold/20 flex items-start gap-3 text-xs text-neutral-300">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-white">Cam kết an toàn sinh trắc học</p>
              <p className="text-neutral-400 leading-relaxed text-[11px]">
                Ảnh chân dung của bạn được xử lý trực tiếp trong bộ nhớ RAM tạm thời của máy chủ và hủy bỏ ngay sau khi xuất kết quả mô phỏng. Công Nguyễn Hair Salon tuyệt đối không lưu trữ vĩnh viễn hình ảnh của bạn trên ổ đĩa.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Styling & Consultation Controls (7/12) */}
        <div className="lg:col-span-7 space-y-6">
          {/* SECTION A: Hairstyle Selector Tray */}
          <div className="bg-salon-charcoal/80 border border-salon-gold/30 rounded-2xl p-5 sm:p-6 shadow-luxury-dark backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-salon-gold" />
                <h3 className="text-base font-serif font-bold text-white">Khay Chọn Kiểu Tóc</h3>
                {selectedHairstyle && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-salon-gold/20 border border-salon-gold/40 text-salon-gold-light font-medium">
                    Đã chọn: {selectedHairstyle.name || selectedHairstyle.title}
                  </span>
                )}
              </div>

              {/* Gender Category Pills */}
              <div className="flex items-center gap-1 bg-salon-noir/80 p-1 rounded-xl border border-salon-gold/20">
                {(['ALL', 'WOMEN', 'MEN', 'UNISEX'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenderFilter(g)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                      genderFilter === g
                        ? 'bg-salon-gold text-salon-noir font-bold shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {g === 'ALL' && 'Tất cả'}
                    {g === 'WOMEN' && 'Nữ'}
                    {g === 'MEN' && 'Nam'}
                    {g === 'UNISEX' && 'Unisex'}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiểu tóc theo tên, phong cách (Layer, Bob, Wolf Cut...)..."
                value={hairSearch}
                onChange={(e) => setHairSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-salon-noir/80 border border-salon-gold/25 rounded-xl text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-salon-gold transition-colors"
              />
              {hairSearch && (
                <button
                  onClick={() => setHairSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Hairstyles Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1">
              {filteredHairstyles.length === 0 ? (
                <div className="col-span-full py-8 text-center text-xs text-neutral-400">
                  Không tìm thấy kiểu tóc phù hợp với bộ lọc.
                </div>
              ) : (
                filteredHairstyles.map((style) => {
                  const isSelected = selectedHairstyle?.id === style.id;
                  const thumbnail =
                    style.coverImageUrl ||
                    (style.images && style.images[0]) ||
                    'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=400&q=80';

                  return (
                    <div
                      key={style.id}
                      onClick={() => handleSelectStyle(style)}
                      className={`group relative rounded-xl overflow-hidden border p-2 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-salon-gold ring-2 ring-salon-gold shadow-gold-glow bg-salon-gold/10'
                          : 'border-white/10 bg-salon-noir/60 hover:border-salon-gold/40 hover:bg-salon-gold/5'
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="aspect-[4/3] rounded-lg overflow-hidden bg-neutral-900 mb-2 relative">
                        <img
                          src={thumbnail}
                          alt={style.name || style.title || 'Hairstyle'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-salon-gold text-salon-noir flex items-center justify-center shadow-md">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <h4 className="text-xs font-semibold text-white truncate">
                        {style.name || style.title}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-1">
                        <span>{style.styleVibe || style.style || 'Phong cách'}</span>
                        {style.price && (
                          <span className="text-salon-gold-light font-medium">
                            {formatVND(style.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* SECTION B: Hair Color Swatch Tray */}
          <div className="bg-salon-charcoal/80 border border-salon-gold/30 rounded-2xl p-5 sm:p-6 shadow-luxury-dark backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-salon-gold" />
                <h3 className="text-base font-serif font-bold text-white">Khay Chọn Sắc Màu Nhuộm</h3>
                {selectedColor ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-salon-gold/20 border border-salon-gold/40 text-salon-gold-light font-medium">
                    {selectedColor.name}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-neutral-400">
                    Màu tự nhiên
                  </span>
                )}
              </div>

              {/* Tone Filter Tabs */}
              <div className="flex items-center gap-1 bg-salon-noir/80 p-1 rounded-xl border border-salon-gold/20">
                {(['ALL', 'WARM', 'COOL', 'NEUTRAL'] as const).map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setColorToneFilter(tone)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                      colorToneFilter === tone
                        ? 'bg-salon-gold text-salon-noir font-bold shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {tone === 'ALL' && 'Tất cả'}
                    {tone === 'WARM' && 'Tông ấm'}
                    {tone === 'COOL' && 'Tông lạnh'}
                    {tone === 'NEUTRAL' && 'Trung tính'}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Swatches Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
              {/* Option 0: Keep Original Hair Color */}
              <div
                onClick={() => handleSelectColor(null)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                  selectedColor === null
                    ? 'border-salon-gold ring-2 ring-salon-gold/60 bg-salon-gold/10'
                    : 'border-white/10 bg-salon-noir/60 hover:border-salon-gold/30'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/20 flex items-center justify-center shrink-0">
                  <X className="w-4 h-4 text-neutral-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">Màu nguyên bản</p>
                  <p className="text-[10px] text-neutral-400">Không nhuộm</p>
                </div>
              </div>

              {/* Dynamic Swatches */}
              {filteredColors.map((color) => {
                const isSelected = selectedColor?.id === color.id;
                const hex = color.hexCode || color.hexColor || '#333333';

                return (
                  <div
                    key={color.id}
                    onClick={() => handleSelectColor(color)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 relative ${
                      isSelected
                        ? 'border-salon-gold ring-2 ring-salon-gold shadow-gold-glow bg-salon-gold/15'
                        : 'border-white/10 bg-salon-noir/60 hover:border-salon-gold/30 hover:bg-salon-gold/5'
                    }`}
                  >
                    {/* Circle Swatch with Sheen Gradient */}
                    <div
                      className="w-8 h-8 rounded-full border border-white/30 shrink-0 shadow-sm relative overflow-hidden flex items-center justify-center"
                      style={{ backgroundColor: hex }}
                    >
                      {/* Sheen diagonal highlight */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/40 pointer-events-none" />
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-white drop-shadow-md stroke-[3]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">{color.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[9px] text-neutral-400 font-mono uppercase">{hex}</span>
                        {color.requiresBleach && (
                          <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Tẩy
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION C: Intensity Slider */}
          <div className="bg-salon-charcoal/80 border border-salon-gold/30 rounded-2xl p-5 sm:p-6 shadow-luxury-dark backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-salon-gold" />
                <h3 className="text-sm font-serif font-bold text-white">
                  Cường Độ Hòa Sắc & Ánh Màu
                </h3>
              </div>
              <span className="text-sm font-bold font-mono text-salon-gold-light bg-salon-gold/10 px-2.5 py-0.5 rounded-lg border border-salon-gold/30">
                {Math.round(intensity * 100)}%
              </span>
            </div>

            {/* Slider control */}
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={Math.round(intensity * 100)}
                onChange={(e) => setIntensity(Number(e.target.value) / 100)}
                className="w-full h-2 bg-salon-noir rounded-lg appearance-none cursor-pointer accent-salon-gold"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 font-medium">
                <span>0% (Tự nhiên)</span>
                <span>50% (Hài hòa)</span>
                <span>100% (Rực rỡ)</span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 italic flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-salon-gold inline-block" />
              <span>{intensityDescription}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
