/**
 * Test Fixtures & Authoritative Mock Data
 */

export const MOCK_USERS = {
  CONG_NGUYEN_ADMIN: {
    id: 'usr-congnguyen-admin-01',
    email: 'admin@congnguyenhair.vn',
    password: 'Admin@123456',
    name: 'Công Nguyễn (Quản Trị Viên)',
    role: 'SUPER_ADMIN' as const,
    token: 'mock-session-congnguyen-admin-token'
  },
  CONG_NGUYEN_SHORT: {
    id: 'usr-congnguyen-admin-02',
    email: 'admin@congnguyen.vn',
    password: 'Admin@123456',
    name: 'Công Nguyễn (Admin)',
    role: 'SUPER_ADMIN' as const,
    token: 'mock-session-congnguyen-short-token'
  },
  LUMIERE_ADMIN: {
    id: 'usr-lumiere-admin-00',
    email: 'admin@lumierehair.vn',
    password: 'Admin@123456',
    name: 'Nguyễn Hoàng Nam (Admin)',
    role: 'SUPER_ADMIN' as const,
    token: 'mock-session-lumiere-admin-token'
  },
  LUMIERE_CONTENT: {
    id: 'usr-lumiere-content-00',
    email: 'content@lumierehair.vn',
    password: 'Admin@123456',
    name: 'Trần Thu Thảo (Content)',
    role: 'CONTENT_ADMIN' as const,
    token: 'mock-session-lumiere-content-token'
  },
  LUMIERE_BOOKING: {
    id: 'usr-lumiere-booking-00',
    email: 'booking@lumierehair.vn',
    password: 'Admin@123456',
    name: 'Lê Minh Khang (Booking)',
    role: 'BOOKING_STAFF' as const,
    token: 'mock-session-lumiere-booking-token'
  },
  LUMIERE_EDITOR: {
    id: 'usr-lumiere-editor-00',
    email: 'editor@lumierehair.vn',
    password: 'Admin@123456',
    name: 'Phạm Hoàng Yến (Editor)',
    role: 'EDITOR' as const,
    token: 'mock-session-lumiere-editor-token'
  },
  SUPER_ADMIN: {
    id: 'usr-super-admin-01',
    email: 'admin@luxurysalon.vn',
    password: 'Password@Super123',
    name: 'Master Director',
    role: 'SUPER_ADMIN' as const,
    token: 'mock-session-super-admin-jwt'
  },
  CONTENT_ADMIN: {
    id: 'usr-content-admin-02',
    email: 'content@luxurysalon.vn',
    password: 'Password@Content123',
    name: 'Content Lead',
    role: 'CONTENT_ADMIN' as const,
    token: 'mock-session-content-admin-jwt'
  },
  BOOKING_STAFF: {
    id: 'usr-booking-staff-03',
    email: 'booking@luxurysalon.vn',
    password: 'Password@Booking123',
    name: 'Front Desk Lead',
    role: 'BOOKING_STAFF' as const,
    token: 'mock-session-booking-staff-jwt'
  },
  EDITOR: {
    id: 'usr-editor-04',
    email: 'editor@luxurysalon.vn',
    password: 'Password@Editor123',
    name: 'Beauty Editor',
    role: 'EDITOR' as const,
    token: 'mock-session-editor-jwt'
  }
};

export function getTomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

export function getPastDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

export const VALID_BOOKING_PAYLOAD = {
  serviceId: 'srv-layer-cut-vip',
  hairstyleId: 'hs-korean-wolf-cut',
  hairColorId: 'col-ash-blonde',
  stylistId: 'sty-master-tran',
  bookingDate: getTomorrowDateString(),
  bookingTime: '10:00',
  customerName: 'Nguyễn Phương Thảo',
  customerPhone: '0987654321',
  customerEmail: 'phuongthao@example.com',
  notes: 'Tư vấn thêm về uốn phồng chân tóc',
  idempotencyKey: 'a0000000-0000-0000-0000-000000000001'
};

export const MINIMAL_BOOKING_PAYLOAD = {
  serviceId: 'srv-layer-cut-vip',
  bookingDate: getTomorrowDateString(),
  bookingTime: '14:30',
  customerName: 'Lê Hoàng Long',
  customerPhone: '+84912345678'
};

// Valid 1x1 pixel PNG image base64
export const VALID_IMAGE_BASE64_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Sample 1x1 JPEG image buffer
export const SAMPLE_IMAGE_BUFFER = Buffer.from(VALID_IMAGE_BASE64_PNG, 'base64');

// Boundary Buffers: 5MB exact and 5.1MB oversized
export const BUFFER_5MB = Buffer.alloc(5 * 1024 * 1024, 0x41); // Exactly 5 MB
export const BUFFER_OVERSIZED_5_1MB = Buffer.alloc(5.1 * 1024 * 1024, 0x41); // 5.1 MB (> 5MB)
export const EMPTY_BUFFER = Buffer.alloc(0); // 0 bytes

export const SAMPLE_HAIRSTYLES = [
  {
    id: 'hs-korean-wolf-cut',
    name: 'Korean Wolf Cut Textured',
    slug: 'korean-wolf-cut-textured',
    gender: 'UNISEX',
    style: 'KOREAN',
    length: 'MEDIUM',
    faceShape: 'ROUND',
    texture: 'WAVY',
    careLevel: 'EASY',
    price: 350000,
    tags: ['wolf-cut', 'trending', 'korean'],
    images: ['/images/styles/wolf-cut-1.jpg'],
    features: ['Tỉa tầng so le tự nhiên', 'Ôm gọn xương hàm tạo hiệu ứng mặt thon'],
    careAdvice: 'Sấy tạo phồng bằng lược tròn khi tóc còn ẩm 70%'
  },
  {
    id: 'hs-classic-bob',
    name: 'French Bob Tự Nhiên',
    slug: 'french-bob-tu-nhien',
    gender: 'FEMALE',
    style: 'CLASSIC',
    length: 'SHORT',
    faceShape: 'OVAL',
    texture: 'STRAIGHT',
    careLevel: 'LOW',
    price: 300000,
    tags: ['bob', 'french', 'classic'],
    images: ['/images/styles/french-bob-1.jpg'],
    features: ['Cắt ngang cằm thanh lịch', 'Tôn vinh đường nét cổ và cằm'],
    careAdvice: 'Dùng dầu dưỡng argan vuốt nhẹ ngọn tóc'
  }
];

export const SAMPLE_HAIR_COLORS = [
  {
    id: 'col-ash-blonde',
    name: 'Khói Sữa Ánh Rêu (Ash Blonde)',
    hexCode: '#b7b4a7',
    tone: 'COOL',
    group: 'ASH',
    brightness: 'LIGHT',
    requiresBleach: true,
    skinSuitability: ['LIGHT', 'NEUTRAL'],
    maintenanceAdvice: 'Sử dụng dầu gội tím 2 lần/tuần để khử ánh vàng'
  },
  {
    id: 'col-chocolate-brown',
    name: 'Nâu Socola Tự Nhiên (Chocolate Brown)',
    hexCode: '#4a2c11',
    tone: 'WARM',
    group: 'BROWN',
    brightness: 'MEDIUM',
    requiresBleach: false,
    skinSuitability: ['LIGHT', 'MEDIUM', 'DARK'],
    maintenanceAdvice: 'Dầu gội giữ màu thảo mộc, tránh nước nóng'
  }
];

export const SAMPLE_SERVICES = [
  {
    id: 'srv-layer-cut-vip',
    name: 'Cắt Tạo Kiểu Master VIP',
    category: 'CUT',
    durationMinutes: 45,
    minPrice: 250000,
    maxPrice: 350000,
    description: 'Tư vấn dáng tóc theo tỷ lệ khuôn mặt, gội massage bấm huyệt và tạo kiểu hoàn thiện.'
  },
  {
    id: 'srv-color-perm-combo',
    name: 'Combo Uốn & Nhuộm Cao Cấp Olaplex',
    category: 'COMBO',
    durationMinutes: 180,
    minPrice: 1200000,
    maxPrice: 1800000,
    description: 'Trọn gói uốn phục hồi, nhuộm thời trang và hấp phục hồi keratin bảo vệ cấu trúc tóc.'
  }
];

export const SAMPLE_SITE_SETTINGS = {
  brandName: 'Công Nguyễn Hair Salon',
  hotline: '0988 888 888',
  address: 'Nguyệt Áng 3, An Khánh, Hải Phòng',
  openingHours: '08:30 - 20:30 Hàng ngày',
  socialFacebook: 'https://facebook.com/congnguyenhair',
  socialInstagram: 'https://instagram.com/congnguyenhair',
  defaultMetaTitle: 'Công Nguyễn Hair Salon - Đẳng Cấp Chăm Sóc & Tạo Mẫu Tóc',
  defaultMetaDescription: 'Salon tóc Nam và Nữ cao cấp tại Nguyệt Áng 3, An Khánh, Hải Phòng.'
};

export const ADVERSARIAL_PAYLOADS = {
  SQLI_NAMES: [
    "' OR '1'='1",
    "'; DROP TABLE bookings; --",
    "admin' --",
    "' UNION SELECT null, email, password FROM users --"
  ],
  XSS_NOTES: [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert(1)>",
    "javascript:/*--></title></style></textarea></script></xmp><svg/onload='+/'/+/onmouseover=1/+/[*/[]/+alert(1)//'>",
    "<iframe src='javascript:alert(1)'></iframe>"
  ],
  PATH_TRAVERSAL_FILENAMES: [
    "../../../../etc/passwd",
    "..\\..\\windows\\system32\\cmd.exe",
    "/var/www/secret.env",
    "../../../config/database.json"
  ],
  FORGED_AUTH_COOKIES: [
    "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJyb2xlIjoiU1VQRVJfQURNSU4ifQ.",
    "invalid-token-signature-xxxx",
    "session=admin; Path=/; Domain=.luxurysalon.vn; Secure; HttpOnly; SameSite=Lax"
  ]
};
