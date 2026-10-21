'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  variant?: 'header' | 'minimal' | 'admin';
}

export function ThemeToggle({ className = '', variant = 'header' }: ThemeToggleProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 1. Kiểm tra theme hiện tại từ documentElement hoặc localStorage
    const isDark =
      document.documentElement.classList.contains('dark') ||
      localStorage.getItem('salon_theme') === 'dark' ||
      (!('salon_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      setTheme('light');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);

    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('salon_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('salon_theme', 'light');
    }
  };

  // Tránh hydration mismatch khi render phía server
  if (!mounted) {
    return (
      <div
        className={`w-9 h-9 rounded-full border border-salon-gold/20 flex items-center justify-center opacity-70 ${className}`}
        aria-hidden="true"
      >
        <Moon className="w-4 h-4 text-salon-gold" />
      </div>
    );
  }

  if (variant === 'admin') {
    return (
      <button
        onClick={toggleTheme}
        type="button"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-salon-gold/20 hover:border-salon-gold/50 bg-salon-charcoal/50 text-salon-ivory text-xs font-medium transition hover:scale-102 ${className}`}
        title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
        aria-label="Cấu hình phong cách trang sáng tối"
      >
        {theme === 'dark' ? (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span className="hidden sm:inline">Chế độ Sáng</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-salon-gold" />
            <span className="hidden sm:inline">Chế độ Tối</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative group w-9 h-9 rounded-full border border-salon-gold/30 bg-salon-charcoal/70 dark:bg-salon-charcoal/90 hover:border-salon-gold hover:bg-salon-gold/15 flex items-center justify-center transition-all duration-300 shadow-gold-subtle hover:scale-105 active:scale-95 ${className}`}
      title={theme === 'dark' ? 'Bật giao diện Sáng' : 'Bật giao diện Tối'}
      aria-label="Cấu hình phong cách trang sáng tối"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-300 group-hover:text-amber-200 transition-transform group-hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-salon-gold group-hover:text-salon-gold-light transition-transform group-hover:-rotate-12" />
      )}
      <span className="sr-only">
        {theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      </span>
    </button>
  );
}
