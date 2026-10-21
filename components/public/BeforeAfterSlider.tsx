'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface BeforeAfterSliderProps {
  beforeImageUrl: string;
  afterImageUrl: string;
  beforeAlt?: string;
  afterAlt?: string;
  initialPosition?: number;
  className?: string;
}

export function BeforeAfterSlider({
  beforeImageUrl,
  afterImageUrl,
  beforeAlt = 'Hình ảnh trước khi làm',
  afterAlt = 'Hình ảnh sau khi làm',
  initialPosition = 50,
  className = '',
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updatePosition(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    if (e.touches[0]) {
      updatePosition(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      updatePosition(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !e.touches[0]) return;
      updatePosition(e.touches[0].clientX);
    };

    const handleStopDragging = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleStopDragging);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleStopDragging);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleStopDragging);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleStopDragging);
    };
  }, [isDragging, updatePosition]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setSliderPosition((prev) => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      setSliderPosition((prev) => Math.min(100, prev + 5));
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none cursor-ew-resize rounded-2xl border border-salon-gold/30 shadow-luxury-dark ${className}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-valuenow={Math.round(sliderPosition)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Thanh trượt so sánh ảnh trước và sau khi làm tóc"
    >
      {/* 1. Underlying Image: After (Sau khi làm) */}
      <img
        src={afterImageUrl}
        alt={afterAlt}
        className="w-full h-full object-cover block pointer-events-none"
      />
      <span className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-[11px] font-bold bg-salon-noir/80 text-salon-gold-light border border-salon-gold/40 backdrop-blur-md shadow-sm">
        SAU KHI LÀM
      </span>

      {/* 2. Overlaid Image: Before (Trước khi làm) with dynamic clip-path */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{
          clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
        }}
      >
        <img
          src={beforeImageUrl}
          alt={beforeAlt}
          className="w-full h-full object-cover block pointer-events-none"
        />
        <span className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-[11px] font-bold bg-salon-noir/80 text-neutral-300 border border-white/20 backdrop-blur-md shadow-sm">
          TRƯỚC KHI LÀM
        </span>
      </div>

      {/* 3. Dividing Vertical Line & Handle Knob */}
      <div
        className="absolute top-0 bottom-0 z-20 pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Line */}
        <div className="absolute top-0 bottom-0 -left-[1px] w-[2px] bg-gradient-to-b from-salon-gold-light via-salon-gold to-salon-gold-dark shadow-gold-glow" />

        {/* Knob */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-salon-noir border-2 border-salon-gold flex items-center justify-center shadow-gold-glow text-salon-gold pointer-events-auto cursor-ew-resize">
          <ChevronLeft className="w-3.5 h-3.5 -mr-0.5" />
          <ChevronRight className="w-3.5 h-3.5 -ml-0.5" />
        </div>
      </div>
    </div>
  );
}
