# Technical Analysis & Implementation Blueprint: Admin Authentication, Session API & RBAC Route Protection

**Agent**: M2 Explorer 1  
**Milestone**: M2 - Auth, RBAC & Admin Core  
**Date**: 2026-10-19  
**Target Files to Create/Update**:
- `app/api/auth/login/route.ts` (New)
- `app/api/auth/logout/route.ts` (New)
- `app/api/auth/session/route.ts` (New)
- `app/admin/login/page.tsx` (New)
- `app/admin/layout.tsx` (New)
- `middleware.ts` (New)
- `lib/auth.ts` (Enhancement with API RBAC guard & token extractor)

---

## 1. Executive Summary & Problem Boundary

This investigation delivers the end-to-end blueprint for the **Admin Authentication, Session Subsystem, and Role-Based Access Control (RBAC)** of Lumière Hair Atelier. 

The subsystem protects administrative routes (`/admin/*`) and administrative mutation APIs (`/api/admin/*`) against unauthorized access, session tampering, privilege escalation, and credential brute-force attacks, while providing an opulent, luxury atelier user experience on the login portal.

### Key Architectural Requirements Analyzed:
1. **Credentials Validation & Session Issuance (`POST /api/auth/login`)**:
   - Strict Zod schema parsing with `LoginSchema`.
   - Constant-time bcrypt hash comparison (`bcrypt.compare`).
   - Active user status check (`isActive === true`).
   - High-entropy 32-byte crypto hex session token generation.
   - Database persistence in `Session` table (7-day TTL).
   - Immutable security event auditing in `AuditLog` via `services/audit.ts`.
   - Dual HTTP-only cookie issuance (`salon_session` primary, `session` fallback for test clients).
2. **Session Termination (`POST /api/auth/logout`)**:
   - Extraction of session token from Authorization Bearer header or cookies.
   - Database invalidation (`prisma.session.deleteMany`).
   - Audit trail creation (`AUTH_LOGOUT`).
   - Immediate cookie expiration (`maxAge: 0`).
3. **Identity & Session Verification (`GET /api/auth/session`)**:
   - Multi-channel token extraction (Bearer header, `salon_session`, `session`).
   - Rejection with HTTP 401 when unauthenticated or expired.
   - Response payload providing both flat strings (`role`, `name`) for test assertions (`TC1.23`, `TC1.25`) and full metadata for UI rendering.
4. **Admin Login Page (`app/admin/login/page.tsx`)**:
   - Atelier Luxury Dark/Gold theme (`salon.noir` #0B0F17, `salon.charcoal` #161B26, `salon.gold` #D4AF37).
   - Glassmorphic card container (`glass-luxury`, `shadow-luxury-dark`).
   - React Hook Form + Zod resolver with inline validation errors.
   - Interactive password toggle, animated loading indicator (`Loader2`), error alert dismissals, and post-login redirection with query param preservation (`?redirect=/admin/...`).
5. **Multi-Tier RBAC & Route Protection**:
   - **Tier 1 (Edge Runtime)**: Next.js `middleware.ts` fast cookie check for `/admin/*` (bypassing `/admin/login`).
   - **Tier 2 (Server Component Guard)**: `app/admin/layout.tsx` running `requireAdmin()` with Prisma DB verification, separating `/admin/login` to prevent recursive redirect loops.
   - **Tier 3 (API Route Guard)**: `checkApiRbacPermission()` enforcing the 4-role matrix (`SUPER_ADMIN`, `CONTENT_ADMIN`, `BOOKING_STAFF`, `EDITOR`) with verbatim error messages matching E2E test suites (`TC2.12` - `TC2.16`, `TC4.10`, `TC4.11`).

---

## 2. Current Codebase State & Inventory

| Component | Current State | Notes |
|---|---|---|
| `prisma/schema.prisma` | **Ready** | Contains `Role`, `User`, `Session`, `AuditLog` with explicit relations and indexes. |
| `lib/auth.ts` | **Partial** | Contains `hashPassword`, `verifyPassword`, `generateSessionToken`, `verifySession`, `getCurrentUser`, `hasRole`, `requireAdmin`, `ROUTE_PERMISSIONS`. Needs token extractor for headers/cookies and API RBAC helper. |
| `lib/validations/auth.ts` | **Ready** | Contains `LoginSchema` and `ChangePasswordSchema`. |
| `services/audit.ts` | **Ready** | Contains `logAuditEvent()` with fail-safe error handling and correct field mapping to Prisma `AuditLog`. |
| `app/globals.css` & `tailwind.config.ts` | **Ready** | Luxury atelier tokens configured (`salon-noir`, `salon-charcoal`, `salon-gold`, `glass-luxury`, `shadow-luxury-dark`). |
| `app/api/auth/*` | **Missing** | Need `login/route.ts`, `logout/route.ts`, `session/route.ts`. |
| `app/admin/login/page.tsx` | **Missing** | Needs implementation. |
| `app/admin/layout.tsx` | **Missing** | Needs implementation with server session check. |
| `middleware.ts` | **Missing** | Needs implementation for edge route interception. |

---

## 3. Deep Dive 1: Auth Route Handlers Blueprint

### 3.1 `app/api/auth/login/route.ts`

#### Technical Flow:
1. Parse incoming JSON request body. If body is missing or unparseable, return HTTP 400 `{ error: 'Email và mật khẩu là bắt buộc' }`.
2. Validate with `LoginSchema.safeParse(body)`. If validation fails, return HTTP 400 with validation message.
3. Query Prisma for user:
   ```ts
   const user = await prisma.user.findUnique({
     where: { email: validatedData.email.toLowerCase().trim() },
     include: { role: true },
   });
   ```
4. Verify user exists and `user.isActive === true`.
   - If not found or inactive: Return HTTP 401 `{ error: 'Email hoặc mật khẩu không chính xác' }`.
   - Optional: Log security violation in `AuditLog`.
5. Compare password with `verifyPassword(password, user.passwordHash)` using bcrypt.
   - If mismatch: Return HTTP 401 `{ error: 'Email hoặc mật khẩu không chính xác' }`.
6. Generate 32-byte session token: `const token = generateSessionToken();`.
7. Compute `expiresAt`: `new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)`.
8. Persist session in database:
   ```ts
   await prisma.session.create({
     data: {
       sessionToken: token,
       userId: user.id,
       expiresAt,
       ipAddress: getClientIp(req),
       userAgent: req.headers.get('user-agent'),
     },
   });
   ```
9. Record audit event:
   ```ts
   await logAuditEvent({
     userId: user.id,
     userEmail: user.email,
     userName: user.fullName,
     userRole: user.role.name,
     action: 'AUTH_LOGIN',
     entity: 'Auth',
     entityId: user.id,
     details: { loginAt: new Date().toISOString(), role: user.role.name },
     ipAddress: getClientIp(req),
     userAgent: req.headers.get('user-agent'),
   });
   ```
10. Return HTTP 200 with JSON payload:
    ```json
    {
      "token": "<32-byte-hex-token>",
      "user": {
        "id": "usr-...",
        "email": "admin@luxurysalon.vn",
        "name": "Master Director",
        "fullName": "Master Director",
        "role": "SUPER_ADMIN",
        "avatarUrl": "...",
        "permissions": ["*"]
      }
    }
    ```
11. Set response cookies:
    - Primary cookie: `salon_session` (HTTP-only, Secure in prod, SameSite Lax, Path `/`, Expires `expiresAt`).
    - Fallback cookie: `session` (for test harness and legacy compatibility).

#### Complete Implementation Blueprint:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_MS } from '@/lib/auth';
import { LoginSchema } from '@/lib/validations/auth';
import { logAuditEvent } from '@/services/audit';

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Email và mật khẩu là bắt buộc' }, { status: 400 });
    }

    if (!body || !body.email || !body.password) {
      return NextResponse.json({ error: 'Email và mật khẩu là bắt buộc' }, { status: 400 });
    }

    const validation = LoginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Dữ liệu đăng nhập không hợp lệ' },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers.get('user-agent') || undefined;

    // Lookup user in DB
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      await logAuditEvent({
        action: 'SECURITY_VIOLATION',
        entity: 'Auth',
        details: { reason: 'Login attempt on invalid or inactive user', email },
        ipAddress,
        userAgent,
      });
      return NextResponse.json({ error: 'Email hoặc mật khẩu không chính xác' }, { status: 401 });
    }

    // Verify bcrypt password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role.name,
        action: 'SECURITY_VIOLATION',
        entity: 'Auth',
        entityId: user.id,
        details: { reason: 'Incorrect password entered', email },
        ipAddress,
        userAgent,
      });
      return NextResponse.json({ error: 'Email hoặc mật khẩu không chính xác' }, { status: 401 });
    }

    // Generate Session Token and Expiration
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

    // Save session in DB
    await prisma.session.create({
      data: {
        sessionToken: token,
        userId: user.id,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // Record Audit Log
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userName: user.fullName,
      userRole: user.role.name,
      action: 'AUTH_LOGIN',
      entity: 'Auth',
      entityId: user.id,
      details: {
        loginAt: new Date().toISOString(),
        role: user.role.name,
      },
      ipAddress,
      userAgent,
    });

    const permissions = Array.isArray(user.role.permissions)
      ? (user.role.permissions as string[])
      : [];

    // Construct response
    const response = NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.fullName,
          fullName: user.fullName,
          role: user.role.name,
          avatarUrl: user.avatarUrl,
          permissions,
        },
      },
      { status: 200 }
    );

    // Set HTTP-Only Cookie
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });

    // Fallback cookie for test harness and legacy HTTP clients
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });

    return response;
  } catch (error) {
    console.error('Unhandled error in /api/auth/login:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống khi đăng nhập' }, { status: 500 });
  }
}
```

---

### 3.2 `app/api/auth/logout/route.ts`

#### Technical Flow:
1. Extract token from:
   - `req.headers.get('authorization')` (strip `'Bearer '`)
   - `req.cookies.get(SESSION_COOKIE_NAME)?.value`
   - `req.cookies.get('session')?.value`
2. If token exists:
   - Find session in database to retrieve actor details.
   - Delete all matching sessions (`prisma.session.deleteMany({ where: { sessionToken: token } })`).
   - If session user was found, record audit event (`action: 'AUTH_LOGOUT'`).
3. Clear cookies (`SESSION_COOKIE_NAME` and `session`) with `maxAge: 0` and expired date.
4. Return HTTP 200 `{ success: true }`.

#### Complete Implementation Blueprint:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME } from '@/lib/auth';
import { logAuditEvent } from '@/services/audit';

function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const salonCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (salonCookie) return salonCookie;
  const legacyCookie = req.cookies.get('session')?.value;
  if (legacyCookie) return legacyCookie;
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const token = extractToken(req);
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || undefined;

    if (token) {
      try {
        const session = await prisma.session.findUnique({
          where: { sessionToken: token },
          include: { user: { include: { role: true } } },
        });

        if (session && session.user) {
          await logAuditEvent({
            userId: session.user.id,
            userEmail: session.user.email,
            userName: session.user.fullName,
            userRole: session.user.role.name,
            action: 'AUTH_LOGOUT',
            entity: 'Auth',
            entityId: session.user.id,
            details: { logoutAt: new Date().toISOString() },
            ipAddress,
            userAgent,
          });
        }

        await prisma.session.deleteMany({
          where: { sessionToken: token },
        });
      } catch (dbError) {
        console.warn('Session deletion ignored or session not found in DB:', dbError);
      }
    }

    const response = NextResponse.json({ success: true }, { status: 200 });

    // Expire cookies
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });

    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error('Unhandled error in /api/auth/logout:', error);
    return NextResponse.json({ success: true }, { status: 200 }); // Fail-safe logout
  }
}
```

---

### 3.3 `app/api/auth/session/route.ts`

#### Technical Flow:
1. Extract token from Bearer header or cookies (`SESSION_COOKIE_NAME`, `session`).
2. If token is missing:
   - Return HTTP 401 `{ authenticated: false, error: 'Chưa đăng nhập' }`.
3. Verify session via `verifySession(token)`:
   - Query Prisma for `Session` with `sessionToken == token`.
   - If not found or `expiresAt < now()` or `user.isActive === false`:
     Return HTTP 401 `{ authenticated: false, error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' }`.
4. If valid:
   - Return HTTP 200:
     ```json
     {
       "authenticated": true,
       "user": {
         "id": "usr-...",
         "email": "...",
         "name": "Content Lead",
         "fullName": "Content Lead",
         "role": "CONTENT_ADMIN",
         "avatarUrl": "...",
         "permissions": [...]
       }
     }
     ```

#### Complete Implementation Blueprint:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth';

function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const salonCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (salonCookie) return salonCookie;
  const legacyCookie = req.cookies.get('session')?.value;
  if (legacyCookie) return legacyCookie;
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const token = extractToken(req);

    if (!token) {
      return NextResponse.json(
        { authenticated: false, error: 'Chưa đăng nhập' },
        { status: 401 }
      );
    }

    const userData = await verifySession(token);
    if (!userData) {
      return NextResponse.json(
        { authenticated: false, error: 'Phiên làm việc không tồn tại hoặc đã hết hạn' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.fullName,
          fullName: userData.fullName,
          role: userData.role.name,
          avatarUrl: userData.avatarUrl,
          permissions: userData.role.permissions,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unhandled error in /api/auth/session:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Lỗi xác minh phiên làm việc' },
      { status: 500 }
    );
  }
}
```

---

## 4. Deep Dive 2: Admin Login Page (`app/admin/login/page.tsx`)

### 4.1 UI Design System & Aesthetic Structure
The login page represents the high-end Haute Coiffure Atelier brand:
- **Atmospheric Palette**: Deep obsidian noir (`#0B0F17`) with radial gold gradient ambiance (`radial-gradient(ellipse at top, rgba(212, 175, 55, 0.15), transparent 70%)`).
- **Glassmorphic Card**:
  - `bg-[#161B26]/80 backdrop-blur-xl`
  - Border: `1px solid rgba(212, 175, 55, 0.2)`
  - Shadow: `shadow-luxury-dark`
- **Branding Elements**:
  - Gold badge: `HAUTE COIFFURE ATELIER` in champagne gold caps with letter spacing.
  - Heading: `Lumière Admin Portal` in `font-serif gold-text-gradient`.
  - Subtitle: `Đăng nhập để điều hành hệ thống salon tóc chuyên nghiệp`.
- **Form Controls**:
  - High-contrast inputs (`bg-[#0B0F17]/60 border-neutral-700/80 focus:border-salon-gold focus:ring-1 focus:ring-salon-gold text-white placeholder-neutral-500`).
  - Leading icons (`Mail`, `Lock` from `lucide-react`).
  - Password visibility toggle (`Eye`, `EyeOff`).
  - Submit Button: `bg-gradient-to-r from-salon-gold to-salon-gold-hover text-salon-noir font-semibold hover:opacity-95 transition shadow-gold-glow`.
- **Interactive States**:
  - Loading spinner with `Loader2` rotating.
  - Error banner with alert icon and dismissal.
  - Preservation of `redirect` query parameter for smooth post-login navigation.

### 4.2 Complete Implementation Blueprint
```tsx
'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, type LoginInput } from '@/lib/validations/auth';
import { Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/admin';

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
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

      // Successful login -> Redirect to admin dashboard or destination
      router.push(redirectPath);
      router.refresh();
    } catch (err) {
      setServerError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    }
  };

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
            Lumière Admin
          </h1>
          <p className="text-sm text-neutral-400">
            Hệ thống quản trị và vận hành salon cao cấp
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-luxury rounded-2xl p-6 md:p-8 shadow-luxury-dark border border-salon-gold/20 relative">
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
                  placeholder="admin@luxurysalon.vn"
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
      </div>
    </div>
  );
}
```

---

## 5. Deep Dive 3: RBAC Middleware & Layout Protection

### 5.1 Defense-in-Depth Architecture

```
                    Visitor / Client Request
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Edge Middleware (`middleware.ts`)                         │
│ - Pattern matcher: `/admin/:path*`                          │
│ - Skip `/admin/login`                                       │
│ - Check existence of `salon_session` / `session` cookie     │
│ - Fast redirect to `/admin/login?redirect=...` if no cookie │
│ - Inject header `x-current-path: <pathname>`                │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Server Layout Guard (`app/admin/layout.tsx`)              │
│ - Server Component executing in Node.js runtime             │
│ - Bypass guard for `/admin/login`                           │
│ - Execute `requireAdmin()` with Prisma DB verification      │
│ - Validate session expiration & user.isActive               │
│ - If invalid: Redirect to `/admin/login`                    │
│ - Render Admin Shell with user profile & role permissions   │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. API Route Handler Guard (`checkApiRbacPermission`)        │
│ - Extract token from Bearer header or cookies               │
│ - Query DB session + user role                              │
│ - Check role against 4-tier matrix:                         │
│     * SUPER_ADMIN: All routes                               │
│     * CONTENT_ADMIN: Content, Catalog, Articles             │
│     * BOOKING_STAFF: Bookings only                          │
│     * EDITOR: Articles only                                 │
│ - Return strict HTTP 401 (no auth) or 403 (forbidden)       │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Next.js Edge Middleware (`middleware.ts`)

#### Technical Requirements:
- Intercept all paths under `/admin/:path*`.
- When requesting `/admin/login`:
  - If already possessing a valid session cookie, redirect directly to `/admin`.
  - Otherwise allow request.
- When requesting any other `/admin/*` path:
  - If cookie `salon_session` or `session` is missing, redirect immediately to `/admin/login?redirect=${encodeURIComponent(pathname)}`.
- Pass header `x-current-path` to downstream Server Components so `app/admin/layout.tsx` knows the exact pathname.

#### Complete Implementation Blueprint:
```typescript
import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/admin/:path*'],
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionToken = req.cookies.get('salon_session')?.value || req.cookies.get('session')?.value;

  // 1. Allow unauthenticated access to /admin/login
  if (pathname === '/admin/login') {
    // If user already has a session token, forward to /admin
    if (sessionToken) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    return NextResponse.next();
  }

  // 2. Protect all other /admin routes
  if (!sessionToken) {
    const loginUrl = new URL('/admin/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Forward request with path header for server layout inspection
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-current-path', pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
```

---

### 5.3 Server Layout Guard (`app/admin/layout.tsx`)

#### Technical Requirements:
- Prevent infinite redirect loops: If the incoming request is for `/admin/login`, render `{children}` directly without invoking `requireAdmin()`.
- For all other admin routes:
  - Call `requireAdmin()` from `lib/auth.ts`.
  - Fetch active user data from Prisma DB.
  - If session is invalid, expired, or user is inactive, `requireAdmin()` redirects to `/admin/login`.
  - Provide Admin Shell wrapper (prepared for Milestone 2 Explorer 2 / Admin Shell Implementer).

#### Complete Implementation Blueprint:
```tsx
import React from 'react';
import { headers } from 'next/headers';
import { requireAdmin, getCurrentUser } from '@/lib/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hệ Thống Quản Trị | Lumière Hair Atelier',
  description: 'Trung tâm điều hành và quản lý salon tóc cao cấp',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = headers();
  const currentPath = headerList.get('x-current-path') || '';

  // If on login page, render clean children layout without admin shell
  if (currentPath === '/admin/login') {
    return <>{children}</>;
  }

  // Server-side strict database session and role verification
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-salon-noir text-neutral-100 flex flex-col">
      {/* Admin Shell Container: Navigation & Header provided by Admin Shell components */}
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
}
```

---

### 5.4 Granular API RBAC Guard (`lib/auth.ts` extension)

To satisfy the boundary tests (`TC2.12` - `TC2.16`, `TC4.10`, `TC4.11`), the API routes need an authoritative RBAC guard.

#### Verbatim Test Assertions & Required Responses:
| Test ID | Test Target | Role | Expected HTTP Status | Expected Error Substring |
|---|---|---|---|---|
| `TC2.12` | `PUT /api/admin/settings` | `BOOKING_STAFF` | 403 Forbidden | `Forbidden`, `SUPER_ADMIN` |
| `TC2.13` | `GET /api/admin/audit-logs` | `BOOKING_STAFF` | 403 Forbidden | `Forbidden`, `audit logs` |
| `TC2.14` | `PUT /api/admin/bookings/*/status` | `CONTENT_ADMIN` | 403 Forbidden | `Forbidden`, `cannot manage bookings` |
| `TC2.15` | `POST/DELETE /api/admin/hairstyles` | `EDITOR` | 403 Forbidden | `Forbidden` |
| `TC2.16` | `POST /api/admin/banners` | `EDITOR` | 403 Forbidden | `Forbidden` |
| `TC1.27` | `/api/admin/*` unauthenticated | None | 401 Unauthorized | `Unauthorized` |
| `TC4.10` | Forged session token | None | 401 Unauthorized | `Unauthorized` |

#### Helper Function to Add to `lib/auth.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';

/**
 * Extracts session token from Request headers (Bearer token) or Cookies (salon_session / session)
 */
export function extractAuthToken(req: Request | NextRequest): string | null {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  const cookieHeader = req.headers.get('cookie') || req.headers.get('Cookie');
  if (cookieHeader) {
    const salonMatch = cookieHeader.match(/salon_session=([^;]+)/);
    if (salonMatch) return salonMatch[1].trim();
    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    if (sessionMatch) return sessionMatch[1].trim();
  }

  return null;
}

/**
 * Checks API RBAC permissions for a given role and pathname
 */
export function checkApiRbacPermission(role: AdminRole, pathname: string, method?: string): { allowed: boolean; error?: string } {
  // SUPER_ADMIN has unrestricted access to everything
  if (role === 'SUPER_ADMIN') {
    return { allowed: true };
  }

  // Site Settings & User Management: SUPER_ADMIN only
  if (pathname.startsWith('/api/admin/settings') || pathname.startsWith('/api/admin/site-settings') || pathname.startsWith('/api/admin/users')) {
    return {
      allowed: false,
      error: `Forbidden: Only SUPER_ADMIN can access settings/users (Current role: ${role})`,
    };
  }

  // Audit Logs: SUPER_ADMIN only
  if (pathname.startsWith('/api/admin/audit-logs')) {
    return {
      allowed: false,
      error: `Forbidden: Only SUPER_ADMIN can view audit logs (Current role: ${role})`,
    };
  }

  // Bookings management: SUPER_ADMIN and BOOKING_STAFF only
  if (pathname.startsWith('/api/admin/bookings')) {
    if (role !== 'BOOKING_STAFF') {
      return {
        allowed: false,
        error: `Forbidden: Role ${role} cannot manage bookings`,
      };
    }
  }

  // Content Catalog CRUD: SUPER_ADMIN and CONTENT_ADMIN only
  if (
    pathname.startsWith('/api/admin/hairstyles') ||
    pathname.startsWith('/api/admin/banners') ||
    pathname.startsWith('/api/admin/colors') ||
    pathname.startsWith('/api/admin/hair-colors') ||
    pathname.startsWith('/api/admin/services') ||
    pathname.startsWith('/api/admin/before-after') ||
    pathname.startsWith('/api/admin/categories')
  ) {
    if (role !== 'CONTENT_ADMIN') {
      return {
        allowed: false,
        error: `Forbidden: Role ${role} cannot mutate catalog content`,
      };
    }
  }

  // Blog Articles: SUPER_ADMIN, CONTENT_ADMIN, and EDITOR
  if (pathname.startsWith('/api/admin/articles')) {
    if (role !== 'CONTENT_ADMIN' && role !== 'EDITOR') {
      return {
        allowed: false,
        error: `Forbidden: Role ${role} cannot edit articles`,
      };
    }
  }

  return { allowed: true };
}

/**
 * High-level API Route Authenticator & Guard
 * Usage in any /api/admin/* route:
 * const auth = await authenticateAdminRequest(req);
 * if ('errorResponse' in auth) return auth.errorResponse;
 * const { user } = auth;
 */
export async function authenticateAdminRequest(
  req: Request | NextRequest
): Promise<{ user: SessionUserData } | { errorResponse: NextResponse }> {
  const token = extractAuthToken(req);

  if (!token) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Session missing or invalid' },
        { status: 401 }
      ),
    };
  }

  const user = await verifySession(token);
  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Session missing or invalid' },
        { status: 401 }
      ),
    };
  }

  const url = new URL(req.url, 'http://localhost:3000');
  const permCheck = checkApiRbacPermission(user.role.name, url.pathname, req.method);
  if (!permCheck.allowed) {
    return {
      errorResponse: NextResponse.json(
        { error: permCheck.error || 'Forbidden: Insufficient privileges' },
        { status: 403 }
      ),
    };
  }

  return { user };
}
```

---

## 6. Integration & Compatibility Considerations

### 6.1 Test Harness & Client Reconciliation
- **Session Cookie Matching**: The E2E test client (`tests/harness/client.ts`) uses regex `/session=([^;]+)/`. Setting both `salon_session` and `session` in `Set-Cookie` guarantees 100% compatibility with both standard browsers and testing frameworks.
- **Header Parsing**: `extractAuthToken()` accepts both `Authorization: Bearer <token>` and `Cookie` headers.
- **Database Seed Alignment**:
  - `prisma/seed.ts` seeds admin accounts under `@lumierehair.vn`.
  - `tests/fixtures/mock-data.ts` uses `@luxurysalon.vn`.
  - Recommendation for the Implementer: In `prisma/seed.ts`, ensure that both `@lumierehair.vn` and `@luxurysalon.vn` accounts are seeded, or include the `MOCK_USERS` from `mock-data.ts` so live tests can execute without account discrepancies.

---

## 7. Implementation Checklist for M2 Implementer

1. [ ] Update `lib/auth.ts` with `extractAuthToken`, `checkApiRbacPermission`, and `authenticateAdminRequest`.
2. [ ] Create `app/api/auth/login/route.ts` with Zod validation, bcrypt password check, Prisma session record, AuditLog event, and dual-cookie setting.
3. [ ] Create `app/api/auth/logout/route.ts` with session invalidation, AuditLog event, and cookie clearance.
4. [ ] Create `app/api/auth/session/route.ts` returning authenticated user profile and assigned role.
5. [ ] Create `app/admin/login/page.tsx` with luxury atelier aesthetic, React Hook Form, Zod validation, and redirect logic.
6. [ ] Create `middleware.ts` for Edge route protection on `/admin/*`.
7. [ ] Create `app/admin/layout.tsx` for server-side layout verification.
8. [ ] Run `npx tsc --noEmit` to verify type safety.
9. [ ] Run `npm run test:e2e` to verify complete test suite passing.
