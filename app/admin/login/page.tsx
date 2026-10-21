'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, type LoginInput } from '@/lib/validations/auth';
import { Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/admin';

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setServerError(result.error || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
        return;
      }

      // Successful login -> Redirect with hard navigation to ensure cookie attachment and server session load
      window.location.href = redirectPath;
    } catch {
      setServerError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    }
  };

  return (
    <div className="glass-luxury rounded-2xl p-6 md:p-8 shadow-luxury-dark border border-salon-gold/20 relative">
      {/* Demo Credentials Box */}
      <div className="mb-6 p-4 rounded-xl bg-salon-gold/10 border border-salon-gold/30 text-xs text-neutral-300 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-salon-gold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Tài Khoản Quản Trị Hệ Thống
          </span>
          <button
            type="button"
            onClick={() => {
              setValue('email', 'admin@congnguyenhair.vn', { shouldValidate: true });
              setValue('password', 'Admin@123456', { shouldValidate: true });
            }}
            className="px-2.5 py-1 rounded-md bg-salon-gold text-salon-noir font-bold text-[11px] hover:bg-salon-gold-light transition active:scale-95 shadow-sm"
          >
            ⚡ Điền Nhanh
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-black/40 p-2.5 rounded-lg border border-salon-gold/15 font-mono">
          <div>
            <span className="text-neutral-400 block text-[10px]">Email đăng nhập:</span>
            <span className="text-white font-medium select-all">admin@congnguyenhair.vn</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[10px]">Mật khẩu:</span>
            <span className="text-white font-medium select-all">Admin@123456</span>
          </div>
        </div>
      </div>

      {/* Server Error Alert */}
      {serverError && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs md:text-sm">{serverError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Email Field */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider">
            Địa chỉ Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
              <Mail className="w-4 h-4" />
            </div>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="admin@congnguyenhair.vn"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B0F17]/60 border text-white text-sm placeholder-neutral-500 focus:outline-none transition ${
                errors.email
                  ? 'border-red-500/60 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-neutral-700/80 focus:border-salon-gold focus:ring-1 focus:ring-salon-gold'
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
              <span>{errors.email.message}</span>
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider">
              Mật khẩu
            </label>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••••••"
              className={`w-full pl-10 pr-11 py-2.5 rounded-xl bg-[#0B0F17]/60 border text-white text-sm placeholder-neutral-500 focus:outline-none transition ${
                errors.password
                  ? 'border-red-500/60 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-neutral-700/80 focus:border-salon-gold focus:ring-1 focus:ring-salon-gold'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-white transition"
              tabIndex={-1}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
              <span>{errors.password.message}</span>
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-salon-gold via-salon-gold-light to-salon-gold text-salon-noir font-semibold text-sm tracking-wide shadow-gold-glow hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-salon-noir" />
              <span>Đang xác thực...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Đăng Nhập Quản Trị</span>
            </>
          )}
        </button>
      </form>

      {/* Footer Back link */}
      <div className="mt-6 pt-4 border-t border-neutral-800 text-center">
        <Link
          href="/"
          className="text-xs text-neutral-400 hover:text-salon-gold-light transition inline-flex items-center gap-1"
        >
          ← Quay lại Website Salon
        </Link>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-b from-salon-noir via-[#121620] to-salon-charcoal relative overflow-hidden">
      {/* Ambient background gold glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-salon-gold/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Atelier Logo / Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-salon-gold/30 bg-salon-gold/10 text-salon-gold-light text-xs font-semibold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-salon-gold" />
            Haute Coiffure Atelier
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold gold-text-gradient tracking-tight">
            Công Nguyễn Hair Salon Admin
          </h1>
          <p className="text-sm text-neutral-400">
            Hệ thống quản trị và vận hành salon cao cấp
          </p>
        </div>

        {/* Login Form wrapped in Suspense for useSearchParams */}
        <Suspense
          fallback={
            <div className="glass-luxury rounded-2xl p-8 text-center text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-salon-gold mx-auto" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
