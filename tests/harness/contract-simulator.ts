/**
 * High-Fidelity Contract Simulator for Dual-Track Opaque-Box E2E Testing
 * Strictly enforces interface contracts and validation schemas defined in PROJECT.md
 */

import {
  MOCK_USERS,
  SAMPLE_HAIRSTYLES,
  SAMPLE_HAIR_COLORS,
  SAMPLE_SERVICES,
  SAMPLE_SITE_SETTINGS,
  VALID_IMAGE_BASE64_PNG
} from '../fixtures/mock-data.ts';
import type { HttpResponse } from './types.ts';

export interface SimulatorState {
  hairstyles: any[];
  colors: any[];
  services: any[];
  banners: any[];
  articles: any[];
  bookings: any[];
  auditLogs: any[];
  siteSettings: any;
  sessions: Map<string, any>;
  idempotencyLocks: Map<string, any>;
}

export class ContractSimulator {
  private state: SimulatorState;

  constructor() {
    this.state = this.getInitialState();
  }

  public reset() {
    this.state = this.getInitialState();
  }

  private getInitialState(): SimulatorState {
    const defaultBanners = [
      {
        id: 'ban-01',
        title: 'Bộ Sưu Tập Tóc Hoàng Gia Mùa Thu',
        subtitle: 'Khám phá phong cách thanh lịch cùng Master Stylist',
        imageUrl: '/images/banners/autumn-collection.jpg',
        ctaLink: '/hairstyles',
        order: 1,
        active: true
      }
    ];

    const defaultArticles = [
      {
        id: 'art-01',
        title: 'Bí Quyết Giữ Nếp Tóc Layer Suốt 24 Giờ',
        slug: 'bi-quyet-giu-nep-toc-layer-suot-24-gio',
        content: 'Chăm sóc tóc layer đòi hỏi kỹ thuật sấy phồng và dưỡng chất chuyên sâu...',
        category: 'CARE_TIPS',
        seoTitle: 'Bí Quyết Giữ Nếp Tóc Layer Chuẩn Salon | Blog Làm Đẹp',
        seoDescription: 'Hướng dẫn chi tiết từ chuyên gia cách sấy và dưỡng tóc layer tại nhà.',
        published: true,
        createdAt: new Date().toISOString()
      }
    ];

    const defaultSessions = new Map<string, any>();
    // Pre-populate valid mock user sessions
    for (const [key, user] of Object.entries(MOCK_USERS)) {
      defaultSessions.set(user.token, user);
    }

    return {
      hairstyles: JSON.parse(JSON.stringify(SAMPLE_HAIRSTYLES)),
      colors: JSON.parse(JSON.stringify(SAMPLE_HAIR_COLORS)),
      services: JSON.parse(JSON.stringify(SAMPLE_SERVICES)),
      banners: defaultBanners,
      articles: defaultArticles,
      bookings: [],
      auditLogs: [],
      siteSettings: JSON.parse(JSON.stringify(SAMPLE_SITE_SETTINGS)),
      sessions: defaultSessions,
      idempotencyLocks: new Map()
    };
  }

  // Handle simulated HTTP request
  public async handleRequest(
    method: string,
    urlPath: string,
    body: any = null,
    headers: Record<string, string> = {}
  ): Promise<HttpResponse> {
    const startTime = Date.now();
    const url = new URL(urlPath, 'http://localhost:3000');
    const pathname = url.pathname;
    const searchParams = url.searchParams;

    // RBAC Authentication check for /api/admin/*
    if (pathname.startsWith('/api/admin')) {
      const authHeader = headers['authorization'] || headers['Authorization'];
      const cookieHeader = headers['cookie'] || headers['Cookie'];
      let token = '';

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      } else if (cookieHeader) {
        const match = cookieHeader.match(/session=([^;]+)/);
        if (match) token = match[1];
      }

      const sessionUser = this.state.sessions.get(token);
      if (!sessionUser) {
        return this.createResponse(401, { error: 'Unauthorized: Session missing or invalid' }, startTime);
      }

      // Role Permission Matrix Enforcement
      const role = sessionUser.role;
      const permError = this.checkRbacPermissions(role, pathname, method);
      if (permError) {
        return this.createResponse(403, { error: permError }, startTime);
      }
    }

    // Route dispatching
    try {
      // 1. Auth routes
      if (pathname === '/api/auth/login' && method === 'POST') {
        return this.handleLogin(body, startTime);
      }
      if (pathname === '/api/auth/session' && method === 'GET') {
        return this.handleSession(headers, startTime);
      }
      if (pathname === '/api/auth/logout' && method === 'POST') {
        return this.handleLogout(headers, startTime);
      }

      // 2. Public endpoints
      if (pathname === '/api/public/home' && method === 'GET') {
        return this.createResponse(200, {
          branding: this.state.siteSettings,
          banners: this.state.banners.filter(b => b.active),
          categories: ['Nam', 'Nữ', 'Nhuộm', 'Chăm sóc'],
          trendingHairstyles: this.state.hairstyles.slice(0, 4),
          services: this.state.services,
          articles: this.state.articles.filter(a => a.published)
        }, startTime);
      }

      if (pathname === '/api/public/hairstyles' && method === 'GET') {
        let results = [...this.state.hairstyles];
        const gender = searchParams.get('gender');
        const style = searchParams.get('style');
        const length = searchParams.get('length');
        const faceShape = searchParams.get('faceShape');
        const texture = searchParams.get('texture');
        const careEffort = searchParams.get('careEffort') || searchParams.get('careLevel');

        if (gender) results = results.filter(h => h.gender.toLowerCase() === gender.toLowerCase());
        if (style) results = results.filter(h => h.style.toLowerCase() === style.toLowerCase());
        if (length) results = results.filter(h => h.length.toLowerCase() === length.toLowerCase());
        if (faceShape) results = results.filter(h => h.faceShape.toLowerCase() === faceShape.toLowerCase());
        if (texture) results = results.filter(h => h.texture.toLowerCase() === texture.toLowerCase());
        if (careEffort) results = results.filter(h => h.careLevel.toLowerCase() === careEffort.toLowerCase());

        return this.createResponse(200, {
          items: results,
          total: results.length,
          page: 1,
          pageSize: 20
        }, startTime);
      }

      if (pathname.startsWith('/api/public/hairstyles/') && method === 'GET') {
        const slug = pathname.replace('/api/public/hairstyles/', '');
        const found = this.state.hairstyles.find(h => h.slug === slug || h.id === slug);
        if (!found) {
          return this.createResponse(404, { error: 'Hairstyle not found' }, startTime);
        }
        return this.createResponse(200, found, startTime);
      }

      if (pathname === '/api/public/colors' && method === 'GET') {
        return this.createResponse(200, {
          colors: this.state.colors,
          tones: ['WARM', 'COOL', 'NEUTRAL']
        }, startTime);
      }

      if (pathname === '/api/public/services' && method === 'GET') {
        return this.createResponse(200, {
          services: this.state.services
        }, startTime);
      }

      if (pathname === '/api/public/articles' && method === 'GET') {
        return this.createResponse(200, {
          articles: this.state.articles.filter(a => a.published)
        }, startTime);
      }

      // 3. Try-On API
      if (pathname === '/api/try-on' && method === 'POST') {
        return this.handleTryOn(body, startTime);
      }

      // 4. Booking API
      if (pathname === '/api/bookings' && method === 'POST') {
        return this.handleCreateBooking(body, startTime);
      }

      // 5. Admin endpoints
      if (pathname === '/api/admin/dashboard' && method === 'GET') {
        const pendingCount = this.state.bookings.filter(b => b.status === 'PENDING').length;
        const todayStr = new Date().toISOString().split('T')[0];
        const todayCount = this.state.bookings.filter(b => b.bookingDate === todayStr).length;

        return this.createResponse(200, {
          totalHairstyles: this.state.hairstyles.length,
          totalColors: this.state.colors.length,
          totalServices: this.state.services.length,
          totalArticles: this.state.articles.length,
          pendingBookingsCount: pendingCount,
          todayBookingsCount: todayCount,
          recentAuditLogs: this.state.auditLogs.slice(-5)
        }, startTime);
      }

      // Admin Hairstyle CRUD
      if (pathname === '/api/admin/hairstyles' && method === 'GET') {
        return this.createResponse(200, this.state.hairstyles, startTime);
      }
      if (pathname === '/api/admin/hairstyles' && method === 'POST') {
        if (!body.name || !body.slug) {
          return this.createResponse(400, { error: 'Tên và đường dẫn kiểu tóc là bắt buộc' }, startTime);
        }
        const newStyle = {
          id: `hs-${Date.now()}`,
          ...body,
          createdAt: new Date().toISOString()
        };
        this.state.hairstyles.push(newStyle);
        this.recordAudit('CREATE', 'HAIRSTYLE', newStyle.id, { name: newStyle.name });
        return this.createResponse(201, newStyle, startTime);
      }
      if (pathname.startsWith('/api/admin/hairstyles/') && method === 'PUT') {
        const id = pathname.replace('/api/admin/hairstyles/', '');
        const idx = this.state.hairstyles.findIndex(h => h.id === id);
        if (idx === -1) return this.createResponse(404, { error: 'Hairstyle not found' }, startTime);
        this.state.hairstyles[idx] = { ...this.state.hairstyles[idx], ...body, updatedAt: new Date().toISOString() };
        this.recordAudit('UPDATE', 'HAIRSTYLE', id, body);
        return this.createResponse(200, this.state.hairstyles[idx], startTime);
      }
      if (pathname.startsWith('/api/admin/hairstyles/') && method === 'DELETE') {
        const id = pathname.replace('/api/admin/hairstyles/', '');
        const idx = this.state.hairstyles.findIndex(h => h.id === id);
        if (idx === -1) return this.createResponse(404, { error: 'Hairstyle not found' }, startTime);
        const deleted = this.state.hairstyles.splice(idx, 1)[0];
        this.recordAudit('DELETE', 'HAIRSTYLE', id, { name: deleted.name });
        return this.createResponse(200, { success: true, id }, startTime);
      }

      // Admin Banner CRUD
      if (pathname === '/api/admin/banners' && method === 'GET') {
        return this.createResponse(200, this.state.banners, startTime);
      }
      if (pathname === '/api/admin/banners' && method === 'POST') {
        const newBanner = { id: `ban-${Date.now()}`, ...body, createdAt: new Date().toISOString() };
        this.state.banners.push(newBanner);
        this.recordAudit('CREATE', 'BANNER', newBanner.id, { title: newBanner.title });
        return this.createResponse(201, newBanner, startTime);
      }
      if (pathname.startsWith('/api/admin/banners/') && method === 'PUT') {
        const id = pathname.replace('/api/admin/banners/', '');
        const idx = this.state.banners.findIndex(b => b.id === id);
        if (idx === -1) return this.createResponse(404, { error: 'Banner not found' }, startTime);
        this.state.banners[idx] = { ...this.state.banners[idx], ...body };
        this.recordAudit('UPDATE', 'BANNER', id, body);
        return this.createResponse(200, this.state.banners[idx], startTime);
      }

      // Admin Color CRUD
      if (pathname === '/api/admin/colors' && method === 'GET') {
        return this.createResponse(200, this.state.colors, startTime);
      }
      if (pathname === '/api/admin/colors' && method === 'POST') {
        const newColor = { id: `col-${Date.now()}`, ...body };
        this.state.colors.push(newColor);
        this.recordAudit('CREATE', 'HAIR_COLOR', newColor.id, { name: newColor.name });
        return this.createResponse(201, newColor, startTime);
      }

      // Admin Service CRUD
      if (pathname === '/api/admin/services' && method === 'GET') {
        return this.createResponse(200, this.state.services, startTime);
      }
      if (pathname === '/api/admin/services' && method === 'POST') {
        const newService = { id: `srv-${Date.now()}`, ...body };
        this.state.services.push(newService);
        this.recordAudit('CREATE', 'SERVICE', newService.id, { name: newService.name });
        return this.createResponse(201, newService, startTime);
      }

      // Admin Bookings & Lifecycle
      if (pathname === '/api/admin/bookings' && method === 'GET') {
        return this.createResponse(200, this.state.bookings, startTime);
      }
      if (pathname.match(/^\/api\/admin\/bookings\/[^/]+\/status$/) && method === 'PUT') {
        const id = pathname.split('/')[4];
        const booking = this.state.bookings.find(b => b.id === id);
        if (!booking) return this.createResponse(404, { error: 'Booking not found' }, startTime);
        const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
        if (!validStatuses.includes(body.status)) {
          return this.createResponse(400, { error: `Invalid status: ${body.status}` }, startTime);
        }
        booking.status = body.status;
        if (body.notes) booking.internalNotes = body.notes;
        if (body.stylistId) booking.stylistId = body.stylistId;
        this.recordAudit('UPDATE_STATUS', 'BOOKING', id, { newStatus: body.status });
        return this.createResponse(200, booking, startTime);
      }

      // Admin Site Settings
      if (pathname === '/api/admin/settings' && method === 'GET') {
        return this.createResponse(200, this.state.siteSettings, startTime);
      }
      if (pathname === '/api/admin/settings' && method === 'PUT') {
        this.state.siteSettings = { ...this.state.siteSettings, ...body };
        this.recordAudit('UPDATE', 'SITE_SETTINGS', 'global', body);
        return this.createResponse(200, this.state.siteSettings, startTime);
      }

      // Admin Audit Logs
      if (pathname === '/api/admin/audit-logs' && method === 'GET') {
        return this.createResponse(200, { logs: this.state.auditLogs }, startTime);
      }

      // Not found
      return this.createResponse(404, { error: `Not found: ${method} ${pathname}` }, startTime);
    } catch (err: any) {
      return this.createResponse(500, { error: err.message || 'Internal simulator error' }, startTime);
    }
  }

  // RBAC Permission Check
  private checkRbacPermissions(role: string, pathname: string, method: string): string | null {
    if (pathname.startsWith('/api/admin/settings') || pathname.startsWith('/api/admin/users')) {
      if (role !== 'SUPER_ADMIN') {
        return `Forbidden: Only SUPER_ADMIN can access settings/users (Current role: ${role})`;
      }
    }

    if (pathname.startsWith('/api/admin/audit-logs')) {
      if (role !== 'SUPER_ADMIN') {
        return `Forbidden: Only SUPER_ADMIN can view audit logs (Current role: ${role})`;
      }
    }

    if (pathname.startsWith('/api/admin/bookings')) {
      if (role !== 'SUPER_ADMIN' && role !== 'BOOKING_STAFF') {
        return `Forbidden: Role ${role} cannot manage bookings`;
      }
    }

    if (
      pathname.startsWith('/api/admin/hairstyles') ||
      pathname.startsWith('/api/admin/banners') ||
      pathname.startsWith('/api/admin/colors') ||
      pathname.startsWith('/api/admin/services') ||
      pathname.startsWith('/api/admin/before-after')
    ) {
      if (role !== 'SUPER_ADMIN' && role !== 'CONTENT_ADMIN') {
        return `Forbidden: Role ${role} cannot mutate catalog content`;
      }
    }

    if (pathname.startsWith('/api/admin/articles')) {
      if (role !== 'SUPER_ADMIN' && role !== 'CONTENT_ADMIN' && role !== 'EDITOR') {
        return `Forbidden: Role ${role} cannot edit articles`;
      }
    }

    return null;
  }

  // Handle Authentication
  private handleLogin(body: any, startTime: number): HttpResponse {
    if (!body || !body.email || !body.password) {
      return this.createResponse(400, { error: 'Email và mật khẩu là bắt buộc' }, startTime);
    }

    const matched = Object.values(MOCK_USERS).find(
      u => u.email.toLowerCase() === body.email.toLowerCase() && u.password === body.password
    );

    if (!matched) {
      return this.createResponse(401, { error: 'Email hoặc mật khẩu không chính xác' }, startTime);
    }

    return this.createResponse(200, {
      token: matched.token,
      user: {
        id: matched.id,
        email: matched.email,
        name: matched.name,
        role: matched.role
      }
    }, startTime, {
      'Set-Cookie': `session=${matched.token}; Path=/; HttpOnly; SameSite=Lax`
    });
  }

  private handleSession(headers: Record<string, string>, startTime: number): HttpResponse {
    const authHeader = headers['authorization'] || headers['Authorization'];
    const cookieHeader = headers['cookie'] || headers['Cookie'];
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (cookieHeader) {
      const match = cookieHeader.match(/session=([^;]+)/);
      if (match) token = match[1];
    }

    const user = this.state.sessions.get(token);
    if (!user) {
      return this.createResponse(401, { authenticated: false, error: 'Chưa đăng nhập' }, startTime);
    }

    return this.createResponse(200, {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }, startTime);
  }

  private handleLogout(headers: Record<string, string>, startTime: number): HttpResponse {
    return this.createResponse(200, { success: true }, startTime, {
      'Set-Cookie': `session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly`
    });
  }

  // Handle Try-On Request with Strict Privacy & Size Controls
  private handleTryOn(body: any, startTime: number): HttpResponse {
    if (!body) {
      return this.createResponse(400, { error: 'Yêu cầu không có nội dung' }, startTime);
    }

    // Check file buffer/base64
    let bufferLength = 0;
    if (Buffer.isBuffer(body.imageBuffer)) {
      bufferLength = body.imageBuffer.length;
    } else if (typeof body.imageBase64 === 'string') {
      bufferLength = Buffer.byteLength(body.imageBase64, 'base64');
    }

    if (bufferLength === 0) {
      return this.createResponse(400, { error: 'Dữ liệu ảnh không hợp lệ hoặc rỗng' }, startTime);
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (bufferLength > MAX_SIZE) {
      return this.createResponse(413, {
        error: `Kích thước ảnh (${(bufferLength / (1024 * 1024)).toFixed(2)}MB) vượt quá giới hạn tối đa cho phép là 5MB`
      }, startTime);
    }

    // Supported MIME types
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    const mime = body.mimeType || 'image/jpeg';
    if (!validMimes.includes(mime)) {
      return this.createResponse(400, {
        error: `Định dạng ảnh không được hỗ trợ: ${mime}. Chỉ chấp nhận jpeg, png, webp.`
      }, startTime);
    }

    if (!body.hairstyleId) {
      return this.createResponse(400, { error: 'Vui lòng chọn kiểu tóc cần thử nghiệm' }, startTime);
    }

    // Generate responsive demo simulation composite
    const mockOutput: any = {
      resultImageBase64: VALID_IMAGE_BASE64_PNG,
      mimeType: mime,
      isMock: true,
      provider: 'demo-hair-try-on-v1',
      processingTimeMs: Math.max(15, Date.now() - startTime),
      appliedStyleId: body.hairstyleId,
      appliedColorId: body.hairColorId || null,
      privacyValidated: true // Asserts memory-only zero disk persistence
    };

    return this.createResponse(200, mockOutput, startTime);
  }

  // Handle Booking Submission with Strict Zod Validation & Idempotency
  private handleCreateBooking(body: any, startTime: number): HttpResponse {
    if (!body) {
      return this.createResponse(400, { error: 'Thiếu dữ liệu đặt lịch' }, startTime);
    }

    const errors: Record<string, string> = {};

    // 1. serviceId
    if (!body.serviceId || typeof body.serviceId !== 'string' || body.serviceId.trim() === '') {
      errors.serviceId = 'Vui lòng chọn dịch vụ';
    }

    // 2. customerName: 2 to 100 chars
    if (!body.customerName || typeof body.customerName !== 'string') {
      errors.customerName = 'Họ tên là bắt buộc';
    } else if (body.customerName.trim().length < 2) {
      errors.customerName = 'Họ tên tối thiểu 2 ký tự';
    } else if (body.customerName.length > 100) {
      errors.customerName = 'Họ tên tối đa 100 ký tự';
    }

    // 3. customerPhone: regex ^(0|\+84)[3|5|7|8|9][0-9]{8}$
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    if (!body.customerPhone || typeof body.customerPhone !== 'string' || !phoneRegex.test(body.customerPhone)) {
      errors.customerPhone = 'Số điện thoại không hợp lệ (định dạng Việt Nam 10 chữ số)';
    }

    // 4. customerEmail optional
    if (body.customerEmail && typeof body.customerEmail === 'string' && body.customerEmail.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.customerEmail)) {
        errors.customerEmail = 'Email không hợp lệ';
      }
    }

    // 5. bookingDate: YYYY-MM-DD and not in the past
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!body.bookingDate || !dateRegex.test(body.bookingDate)) {
      errors.bookingDate = 'Ngày hẹn không hợp lệ (định dạng YYYY-MM-DD)';
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      if (body.bookingDate < todayStr) {
        errors.bookingDate = 'Không thể đặt lịch vào ngày trong quá khứ';
      }
    }

    // 6. bookingTime: HH:mm and within 08:30 - 20:30
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!body.bookingTime || !timeRegex.test(body.bookingTime)) {
      errors.bookingTime = 'Giờ hẹn không hợp lệ (định dạng HH:mm)';
    } else {
      if (body.bookingTime < '08:30' || body.bookingTime > '20:30') {
        errors.bookingTime = 'Giờ hẹn phải nằm trong khung giờ mở cửa (08:30 - 20:30)';
      }
    }

    // 7. notes max 500 chars
    if (body.notes && typeof body.notes === 'string' && body.notes.length > 500) {
      errors.notes = 'Ghi chú tối đa 500 ký tự';
    }

    if (Object.keys(errors).length > 0) {
      return this.createResponse(400, { error: 'Validation failed', details: errors }, startTime);
    }

    // Anti-duplicate submission / Idempotency check
    if (body.idempotencyKey) {
      const existing = this.state.idempotencyLocks.get(body.idempotencyKey);
      if (existing) {
        return this.createResponse(200, existing, startTime);
      }
    }

    const bookingRecord = {
      id: `bk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      bookingCode: `BK${Math.floor(100000 + Math.random() * 900000)}`,
      serviceId: body.serviceId,
      hairstyleId: body.hairstyleId || null,
      hairColorId: body.hairColorId || null,
      stylistId: body.stylistId || null,
      bookingDate: body.bookingDate,
      bookingTime: body.bookingTime,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail || null,
      notes: body.notes || '',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    this.state.bookings.push(bookingRecord);

    if (body.idempotencyKey) {
      this.state.idempotencyLocks.set(body.idempotencyKey, bookingRecord);
    }

    return this.createResponse(201, bookingRecord, startTime);
  }

  // Audit Logging Helper
  private recordAudit(action: string, entity: string, entityId: string, diff: any) {
    this.state.auditLogs.push({
      id: `aud-${Date.now()}`,
      action,
      entity,
      entityId,
      timestamp: new Date().toISOString(),
      details: diff
    });
  }

  // HTTP Response builder
  private createResponse(
    status: number,
    data: any,
    startTime: number,
    extraHeaders: Record<string, string> = {}
  ): HttpResponse {
    const rawText = typeof data === 'string' ? data : JSON.stringify(data);
    return {
      status,
      ok: status >= 200 && status < 300,
      headers: {
        'content-type': 'application/json',
        ...extraHeaders
      },
      data,
      rawText,
      durationMs: Date.now() - startTime
    };
  }
}
