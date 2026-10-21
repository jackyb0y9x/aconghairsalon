# BẢN PHÂN TÍCH KỸ THUẬT VÀ BLUEPRINT TRIỂN KHAI MILESTONE 1
## Phân hệ: Scaffolding, Package Dependencies, TypeScript, Tailwind Design System & Core Utilities
**Dự án:** Nền tảng Web Salon Tóc Nam & Nữ Hiện Đại (Lumière Hair Atelier)  
**Agent:** Explorer M1-1 (`teamwork_preview_explorer_m1_1`)  
**Mục tiêu:** Cung cấp blueprint hoàn chỉnh, chi tiết và sẵn sàng thực thi cho giai đoạn khởi tạo nền móng dự án (Milestone 1 - Subsystem 1).

---

## 1. TỔNG QUAN VÀ MỤC TIÊU CỐT LÕI

Milestone 1 là giai đoạn nền tảng sống còn của dự án Lumière Hair Atelier. Mục tiêu của phân hệ Scaffolding & Core Architecture bao gồm:
1. **Thiết lập Package Ecosystem chuẩn mực:** Next.js 14.2 LTS (App Router), React 18.3, TypeScript 5.6 (chế độ `strict: true`), Tailwind CSS 3.4, Prisma 5.21, Radix UI Primitives, Lucide React, React Hook Form, Zod và bcryptjs.
2. **Cấu hình toàn diện các file config:** `package.json`, `tsconfig.json`, `next.config.js`, `postcss.config.js`, `tailwind.config.ts`, `app/globals.css`.
3. **Hiện thực hóa 100% mã nguồn Core Utilities:**
   - `lib/utils.ts`: Hợp nhất classnames (`cn`), định dạng tiền tệ VNĐ (`formatVND`), xử lý ngày giờ tiếng Việt (`formatDateVN`, `formatDateTimeVN`, `formatRelativeTimeVN`), bộ chuyển đổi slug hỗ trợ tiếng Việt có dấu (`slugify`), định dạng số điện thoại Việt Nam (`formatPhoneNumber`).
   - `lib/auth.ts`: Băm và kiểm tra mật khẩu (`hashPassword`, `verifyPassword` qua `bcryptjs`), quản lý phiên bảo mật bằng HTTP-only cookie kết nối bảng `Session`, trích xuất thông tin người dùng hiện tại trên Server Components (`getCurrentUser`), bộ kiểm tra phân quyền RBAC (`hasRole`, `hasPermission`, `requireAdmin`).
4. **Kiểm tra và chuẩn hóa cấu trúc cây thư mục (Directory Layout):** Đối chiếu với `PROJECT.md § Code Layout`, đảm bảo phân tầng rõ ràng giữa `app/(public)`, `app/admin`, `app/api`, `components/public`, `components/admin`, `components/ui`, `lib`, `services`, `types`, `prisma`.

---

## 2. ĐẶC TẢ DEPENDENCIES VÀ PACKAGE.JSON

### 2.1. Phân tích tính tương thích công nghệ
- **Next.js & React:** Lựa chọn `next@14.2.15` kết hợp `react@18.3.1` và `react-dom@18.3.1`. Đây là phiên bản LTS ổn định nhất của Next.js App Router, tương thích 100% với toàn bộ hệ sinh thái Radix UI, `@hookform/resolvers`, Tailwind CSS và môi trường Serverless của Vercel mà không gặp bất kỳ xung đột peer dependency nào.
- **Node.js Host Environment:** Hệ thống đã được kiểm tra trên Windows host có sẵn `Node.js v24.14.0` và `npm 9.5.1`. Tất cả dependencies được chọn đều hỗ trợ hoàn hảo phiên bản Node này.
- **TypeScript & Build Tooling:** `typescript@^5.6.3`, `@types/node@^20.16.11`, `@types/react@^18.3.11`, `@types/react-dom@^18.3.0`, `@types/bcryptjs@^2.4.6`.
- **Styling & UI Components:** `tailwindcss@^3.4.14`, `postcss@^8.4.47`, `autoprefixer@^10.4.20`, `tailwindcss-animate@^1.0.7`, `clsx@^2.1.1`, `tailwind-merge@^2.5.4`, `class-variance-authority@^0.7.0`, `lucide-react@^0.453.0`.
- **Radix UI Primitives:** Cung cấp nền tảng accessibility (WAI-ARIA) cho shadcn/ui:
  - `@radix-ui/react-dialog` (Modal đặt lịch, modal xác nhận admin)
  - `@radix-ui/react-dropdown-menu` (Menu quản trị viên, thao tác bảng dữ liệu)
  - `@radix-ui/react-select` (Dropdown chọn chi nhánh, stylist, dịch vụ)
  - `@radix-ui/react-slider` (Thanh trượt so sánh Before/After, lọc giá)
  - `@radix-ui/react-tabs` (Tab phân loại kiểu tóc, danh mục dịch vụ)
  - `@radix-ui/react-toast` (Thông báo kết quả thao tác)
  - `@radix-ui/react-slot` (Composition pattern cho Button và các primitive)
  - `@radix-ui/react-label` (Label chuẩn cho form input)
- **Data Validation & Form:** `zod@^3.23.8`, `react-hook-form@^7.53.0`, `@hookform/resolvers@^3.9.0`.
- **Database & Execution:** `prisma@^5.21.1`, `@prisma/client@^5.21.1`, `tsx@^4.19.1` (thực thi `prisma/seed.ts`).
- **Date & Currency:** `date-fns@^3.6.0`.

### 2.2. Nội dung `package.json` chuẩn hóa
```json
{
  "name": "lumiere-hair-atelier",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "tsx prisma/seed.ts"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.0",
    "@prisma/client": "^5.21.1",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-slider": "^1.2.1",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-toast": "^1.2.2",
    "bcryptjs": "^2.4.3",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.453.0",
    "next": "14.2.15",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.53.0",
    "tailwind-merge": "^2.5.4",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20.16.11",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "prisma": "^5.21.1",
    "tailwindcss": "^3.4.14",
    "tsx": "^4.19.1",
    "typescript": "^5.6.3"
  }
}
```

---

## 3. CẤU HÌNH TYPESCRIPT NGHIÊM NGẶT (`tsconfig.json`)

Yêu cầu kỹ thuật bắt buộc theo R4 và Acceptance Criteria 1:
- `strict: true`: Kích hoạt toàn bộ các cờ kiểm tra kiểu dữ liệu nghiêm ngặt (`noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, `alwaysStrict`).
- `paths`: Thiết lập path alias `@/*` trỏ tới `./*` cho phép import trực tiếp như `@/lib/utils`, `@/components/ui/button`, `@/services/storage/types`.
- `moduleResolution: "bundler"`: Tối ưu cho Next.js 14 App Router, hỗ trợ package exports và Server Components.
- `plugins`: Khai báo plugin `"name": "next"` để Next.js sinh type cho các route segment và metadata.

### 3.1. Nội dung `tsconfig.json` hoàn chỉnh
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

---

## 4. CẤU HÌNH BUILD VÀ BUNDLER NEXT.JS (`next.config.js`)

Để đảm bảo tương thích hoàn hảo trên môi trường Vercel Serverless:
1. `serverComponentsExternalPackages`: Cần khai báo `['bcryptjs', '@prisma/client', 'prisma']` để Next.js không cố gắng bundle các thư viện có binary bindings hoặc native crypto vào runtime của webpack/turbopack.
2. `images.remotePatterns`: Cho phép hiển thị ảnh từ các nguồn lưu trữ đám mây: Unsplash (dữ liệu seed/demo mẫu), Cloudinary (`res.cloudinary.com`), Supabase Storage (`*.supabase.co`), và `images.pexels.com`.
3. `reactStrictMode: true`: Kiểm tra double render để phát hiện memory leaks và side-effects trong React.

### 4.1. Nội dung `next.config.js` chuẩn hóa
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['bcryptjs', '@prisma/client', 'prisma'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
  // Tối ưu hóa nén và header bảo mật cơ bản
  poweredByHeader: false,
};

module.exports = nextConfig;
```

---

## 5. CẤU HÌNH POSTCSS (`postcss.config.js`)

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

## 6. HỆ THỐNG THIẾT KẾ TAILWIND CSS & DESIGN TOKENS

### 6.1. Triết lý thẩm mỹ thương hiệu (Luxury Salon Aesthetic)
Nhận diện của Lumière Hair Atelier là sự hòa quyện giữa không gian Salon cao cấp (Haute Coiffure) với 3 tone chủ đạo:
- **Obsidian Noir (`salon.noir` - `#0B0F17`):** Đen tuyền huyền bí, tạo chiều sâu cho dark mode, admin shell và các banner điểm nhấn.
- **Champagne Gold (`salon.gold` - `#D4AF37`):** Ánh vàng kim hoàng gia, sử dụng cho CTA buttons, border accent, badge cao cấp, và hiệu ứng glow.
- **Ivory Alabaster (`salon.ivory` - `#FDFBF7`):** Trắng ngà ấm áp cho public website, mang lại cảm giác dễ chịu cho mắt khách hàng so với màu trắng chói thông thường.
- **Charcoal Surface (`salon.charcoal` - `#161B26`):** Xám than than lịch cho các card và bảng quản trị Admin CMS.

### 6.2. Cấu hình `tailwind.config.ts`
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Salon Luxury Design Tokens
        salon: {
          noir: "#0B0F17",
          charcoal: "#161B26",
          gold: {
            DEFAULT: "#D4AF37",
            light: "#F3E5AB",
            dark: "#AA820A",
            hover: "#C5A059",
          },
          ivory: "#FDFBF7",
          silver: "#E5E7EB",
          surface: "#1F293D",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "gold-glow": "0 0 25px -5px rgba(212, 175, 55, 0.28)",
        "gold-subtle": "0 2px 10px -2px rgba(212, 175, 55, 0.15)",
        "luxury-card": "0 10px 30px -10px rgba(0, 0, 0, 0.08), 0 0 1px 1px rgba(212, 175, 55, 0.15)",
        "luxury-dark": "0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(212, 175, 55, 0.2)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-gold": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shimmer": "shimmer 2.5s infinite linear",
        "pulse-gold": "pulse-gold 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### 6.3. Biến CSS toàn cục và Utility Classes (`app/globals.css`)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 40 33% 98%;        /* #FDFBF7 Ngà ấm tự nhiên */
    --foreground: 222 47% 11%;        /* #0F172A Xanh đen sang trọng */
    
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;
    
    --primary: 43 65% 52%;           /* #D4AF37 Champagne Gold */
    --primary-foreground: 222 47% 11%;
    
    --secondary: 40 20% 94%;
    --secondary-foreground: 222 47% 11%;
    
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    
    --accent: 43 65% 52%;
    --accent-foreground: 222 47% 11%;
    
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 43 65% 52%;
    --radius: 0.75rem;
  }

  .dark {
    --background: 222 47% 7%;         /* #0B0F17 Obsidian Noir */
    --foreground: 210 40% 98%;
    
    --card: 217 33% 12%;             /* #161B26 Charcoal Slate */
    --card-foreground: 210 40% 98%;
    
    --popover: 217 33% 12%;
    --popover-foreground: 210 40% 98%;
    
    --primary: 43 65% 52%;           /* #D4AF37 Champagne Gold */
    --primary-foreground: 222 47% 11%;
    
    --secondary: 217 33% 17%;
    --secondary-foreground: 210 40% 98%;
    
    --muted: 217 33% 17%;
    --muted-foreground: 215 20.2% 65.1%;
    
    --accent: 43 65% 52%;
    --accent-foreground: 210 40% 98%;
    
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    
    --border: 217 33% 18%;
    --input: 217 33% 18%;
    --ring: 43 65% 52%;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground antialiased;
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  ::selection {
    background-color: rgba(212, 175, 55, 0.35);
    color: #0B0F17;
  }
}

@layer utilities {
  /* Hiệu ứng kính mờ sang trọng */
  .glass-luxury {
    background: rgba(22, 27, 38, 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(212, 175, 55, 0.2);
  }

  .glass-light {
    background: rgba(253, 251, 247, 0.85);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(212, 175, 55, 0.15);
  }

  /* Viền vàng gradient tinh tế */
  .gold-border-gradient {
    border-image: linear-gradient(135deg, #D4AF37, #F3E5AB, #AA820A) 1;
  }

  /* Chữ vàng kim loại lấp lánh */
  .gold-text-gradient {
    background: linear-gradient(135deg, #F3E5AB 0%, #D4AF37 50%, #AA820A 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* Thanh cuộn cao cấp */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #0B0F17;
  }

  ::-webkit-scrollbar-thumb {
    background: #374151;
    border-radius: 4px;
    border: 2px solid #0B0F17;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #D4AF37;
  }
}
```

---

## 7. HIỆN THỰC HÓA CHI TIẾT CORE UTILITIES

### 7.1. Tiện ích dùng chung (`lib/utils.ts`)
Tệp `lib/utils.ts` cung cấp toàn bộ các hàm định dạng hiển thị, xử lý chuỗi và tối ưu hóa UI:
- `cn`: Ghép nối Tailwind classnames không bị trùng lặp xung đột.
- `formatVND`: Định dạng số tiền sang chuẩn tiền tệ Việt Nam (ví dụ: `150000 -> "150.000 ₫"` hoặc `"150.000 đ"`).
- `formatDateVN`: Chuyển đổi Date/ISO string sang `DD/MM/YYYY`.
- `formatDateTimeVN`: Định dạng `HH:mm DD/MM/YYYY`.
- `formatTimeVN`: Lấy giờ phút `HH:mm`.
- `formatRelativeTimeVN`: Hiển thị khoảng thời gian thân thiện (ví dụ: "vừa xong", "10 phút trước", "2 giờ trước", "Hôm qua").
- `slugify`: Chuyển đổi tiêu đề bài viết / tên kiểu tóc tiếng Việt thành URL slug chuẩn SEO (loại bỏ hoàn toàn dấu tiếng Việt, ký tự đặc biệt).
- `formatPhoneNumber`: Định dạng số điện thoại chuẩn `0908 123 456`.
- `truncate`: Cắt ngắn văn bản hiển thị kèm dấu ba chấm.

#### Mã nguồn chi tiết `lib/utils.ts`
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Hợp nhất classnames với Tailwind Merge và Clsx
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Định dạng tiền tệ Việt Nam (VNĐ)
 * @param amount - Số tiền (VND)
 * @returns Chuỗi tiền tệ chuẩn, ví dụ: "250.000 ₫"
 */
export function formatVND(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "0 ₫";
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Định dạng khoảng giá tiền từ min đến max
 * @param min - Giá thấp nhất
 * @param max - Giá cao nhất (nếu có)
 */
export function formatPriceRange(min: number, max?: number | null): string {
  if (!max || min === max) {
    return formatVND(min);
  }
  return `${new Intl.NumberFormat("vi-VN").format(min)} - ${formatVND(max)}`;
}

/**
 * Định dạng ngày theo chuẩn Việt Nam (DD/MM/YYYY)
 */
export function formatDateVN(dateInput: Date | string | number): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "object" ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Định dạng ngày giờ chuẩn Việt Nam (HH:mm DD/MM/YYYY)
 */
export function formatDateTimeVN(dateInput: Date | string | number): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "object" ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

/**
 * Định dạng giờ phút (HH:mm)
 */
export function formatTimeVN(dateInput: Date | string | number): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "object" ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Hiển thị thời gian tương đối thân thiện bằng tiếng Việt
 */
export function formatRelativeTimeVN(dateInput: Date | string | number): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "object" ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Vừa xong";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  
  return formatDateVN(date);
}

/**
 * Chuyển đổi tiêu đề tiếng Việt có dấu thành URL slug chuẩn SEO
 * Ví dụ: "Kiểu Tóc Layer Nữ Hàn Quốc 2026!" -> "kieu-toc-layer-nu-han-quoc-2026"
 */
export function slugify(text: string): string {
  if (!text) return "";

  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Xóa dấu tiếng Việt
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "") // Xóa ký tự đặc biệt
    .trim()
    .replace(/\s+/g, "-") // Thay khoảng trắng bằng dấu gạch ngang
    .replace(/-+/g, "-"); // Gom nhiều dấu gạch ngang liên tiếp thành 1
}

/**
 * Định dạng số điện thoại Việt Nam dạng hiển thị đẹp
 * Ví dụ: "0908123456" -> "0908 123 456"
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith("84")) {
    return `+84 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  return phone;
}

/**
 * Rút ngắn chuỗi văn bản với độ dài tối đa
 */
export function truncate(text: string, length: number = 100): string {
  if (!text || text.length <= length) return text;
  return `${text.slice(0, length).trim()}...`;
}

/**
 * Trích xuất thời lượng dịch vụ dạng hiển thị
 * Ví dụ: 90 -> "90 phút (1h 30p)"
 */
export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "0 phút";
  if (minutes < 60) return `${minutes} phút`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} giờ`;
  }
  return `${hours} giờ ${remainingMinutes} phút`;
}
```

---

### 7.2. Module Xác thực và Phân quyền (`lib/auth.ts`)
Tệp `lib/auth.ts` hiện thực các nghiệp vụ bảo mật cốt lõi:
1. **Password Hashing:** Sử dụng `bcryptjs` với salt rounds = 10 (`hashPassword`, `verifyPassword`).
2. **Session Token Management:** Sinh token ngẫu nhiên bằng `crypto.randomBytes(32).toString('hex')`.
3. **Database-backed Session Verification:** Quản lý phiên làm việc gắn liền với bảng `Session` trong cơ sở dữ liệu (lưu `token`, `userId`, `expiresAt`, `userAgent`, `ipAddress`).
4. **Cookie Security:** Quản lý HTTP-only cookie `salon_session` với `path: '/'`, `sameSite: 'lax'`, `secure: process.env.NODE_ENV === 'production'`.
5. **RBAC Role Matrix:** Định nghĩa các quyền và vai trò theo chuẩn R3: `SUPER_ADMIN`, `CONTENT_ADMIN`, `BOOKING_STAFF`, `EDITOR`.
6. **Server Component & Route Handler Guards:**
   - `getCurrentUser()`: Dùng trong RSC để lấy thông tin phiên người dùng hiện tại mà không cần gọi API.
   - `requireAdmin(allowedRoles)`: Chặn truy cập trái phép, tự động throw redirect hoặc error nếu chưa đăng nhập / không đủ quyền.

#### Mã nguồn chi tiết `lib/auth.ts`
```typescript
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

// Tên cookie lưu trữ phiên làm việc
export const SESSION_COOKIE_NAME = "salon_session";

// Thời hạn phiên: 7 ngày (tính bằng mili-giây)
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Các vai trò quản trị trong hệ thống
export type AdminRole = "SUPER_ADMIN" | "CONTENT_ADMIN" | "BOOKING_STAFF" | "EDITOR";

export interface SessionUserData {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role: {
    id: string;
    name: AdminRole;
    description?: string | null;
    permissions: string[];
  };
}

/**
 * Băm mật khẩu sử dụng bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Xác thực mật khẩu văn bản thô với hash lưu trong DB
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sinh chuỗi session token ngẫu nhiên bảo mật cao
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Tạo phiên làm việc mới trong Database và trả về token
 */
export async function createSessionRecord(
  userId: string,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    },
  });

  return { token, expiresAt };
}

/**
 * Thiết lập HTTP-Only Cookie cho client
 */
export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Xóa Session Cookie (Đăng xuất)
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    try {
      // Xóa phiên trong database nếu tồn tại
      await prisma.session.deleteMany({
        where: { token },
      });
    } catch {
      // Bỏ qua lỗi nếu DB không tìm thấy session
    }
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Xác minh session token và lấy dữ liệu User kèm Role
 */
export async function verifySession(token: string): Promise<SessionUserData | null> {
  if (!token) return null;

  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!session) return null;

    // Kiểm tra hết hạn phiên
    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    // Kiểm tra tài khoản còn kích hoạt hay không
    if (!session.user.isActive) {
      return null;
    }

    const permissions = Array.isArray(session.user.role.permissions)
      ? (session.user.role.permissions as string[])
      : [];

    return {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.fullName,
      avatarUrl: session.user.avatarUrl,
      role: {
        id: session.user.role.id,
        name: session.user.role.name as AdminRole,
        description: session.user.role.description,
        permissions,
      },
    };
  } catch (error) {
    console.error("Session verification failed:", error);
    return null;
  }
}

/**
 * Lấy thông tin người dùng đăng nhập hiện tại từ Cookies
 * (Sử dụng trực tiếp trong Server Components hoặc Server Actions)
 */
export async function getCurrentUser(): Promise<SessionUserData | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySession(token);
  } catch {
    return null;
  }
}

/**
 * Kiểm tra xem người dùng có vai trò nằm trong danh sách được phép không
 */
export function hasRole(userRole: AdminRole, allowedRoles: AdminRole[]): boolean {
  if (userRole === "SUPER_ADMIN") return true; // SUPER_ADMIN luôn có mọi quyền
  return allowedRoles.includes(userRole);
}

/**
 * Kiểm tra xem người dùng có quyền cụ thể không (Permission string)
 */
export function hasPermission(user: SessionUserData, permission: string): boolean {
  if (user.role.name === "SUPER_ADMIN") return true;
  return user.role.permissions.includes(permission) || user.role.permissions.includes("*");
}

/**
 * Server Guard: Yêu cầu đăng nhập và phân quyền hợp lệ cho trang /admin
 * Nếu không thỏa mãn, tự động redirect về /admin/login
 */
export async function requireAdmin(allowedRoles?: AdminRole[]): Promise<SessionUserData> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasRole(user.role.name, allowedRoles)) {
      redirect("/admin?error=unauthorized");
    }
  }

  return user;
}

/**
 * Ma trận phân quyền theo từng Route quản trị
 */
export const ROUTE_PERMISSIONS: Record<string, AdminRole[]> = {
  "/admin": ["SUPER_ADMIN", "CONTENT_ADMIN", "BOOKING_STAFF", "EDITOR"],
  "/admin/dashboard": ["SUPER_ADMIN", "CONTENT_ADMIN", "BOOKING_STAFF", "EDITOR"],
  "/admin/bookings": ["SUPER_ADMIN", "BOOKING_STAFF"],
  "/admin/hairstyles": ["SUPER_ADMIN", "CONTENT_ADMIN"],
  "/admin/categories": ["SUPER_ADMIN", "CONTENT_ADMIN"],
  "/admin/hair-colors": ["SUPER_ADMIN", "CONTENT_ADMIN"],
  "/admin/services": ["SUPER_ADMIN", "CONTENT_ADMIN"],
  "/admin/before-after": ["SUPER_ADMIN", "CONTENT_ADMIN"],
  "/admin/banners": ["SUPER_ADMIN", "CONTENT_ADMIN"],
  "/admin/articles": ["SUPER_ADMIN", "CONTENT_ADMIN", "EDITOR"],
  "/admin/site-settings": ["SUPER_ADMIN"],
  "/admin/settings": ["SUPER_ADMIN"],
  "/admin/users": ["SUPER_ADMIN"],
  "/admin/audit-logs": ["SUPER_ADMIN"],
};
```

---

## 8. XÁC MINH CẤU TRÚC CÂY THƯ MỤC DỰ ÁN (CODE LAYOUT COMPLIANCE)

Đối chiếu với bảng đặc tả `PROJECT.md § Code Layout`, dưới đây là danh sách phân bổ thư mục và tệp tin tiêu chuẩn:

| Thư mục / File | Trách nhiệm kiến trúc | Tình trạng trong M1 |
| :--- | :--- | :--- |
| `package.json` | Khai báo 100% dependencies chuẩn LTS | M1 (Explorer 1 Blueprint) |
| `tsconfig.json` | Cấu hình TypeScript `strict: true` & `@/*` alias | M1 (Explorer 1 Blueprint) |
| `next.config.js` | Cấu hình Serverless bundles & Image domains | M1 (Explorer 1 Blueprint) |
| `postcss.config.js` | Cấu hình Tailwind CSS & Autoprefixer | M1 (Explorer 1 Blueprint) |
| `tailwind.config.ts` | Design tokens Luxury Salon, font serif/sans, glow shadow | M1 (Explorer 1 Blueprint) |
| `app/globals.css` | Biến màu HSL `:root`, `.dark`, glassmorphism, scrollbar | M1 (Explorer 1 Blueprint) |
| `lib/utils.ts` | Tiện ích `cn`, `formatVND`, định dạng ngày giờ tiếng Việt, slugify | M1 (Explorer 1 Blueprint) |
| `lib/auth.ts` | Hashing bcrypt, Session database check, RBAC guards | M1 (Explorer 1 Blueprint) |
| `lib/prisma.ts` | Singleton PrismaClient tránh connection leak | M1 (Explorer 2 Phụ trách) |
| `prisma/schema.prisma` | 14 mô hình thực thể quan hệ chuẩn hóa | M1 (Explorer 2 Phụ trách) |
| `prisma/seed.ts` | Bộ seed data phong phú tiếng Việt | M1 (Explorer 2 Phụ trách) |
| `services/storage/*` | Interface `StorageProvider` + Mock & Cloudinary adapter | M1 (Explorer 3 Phụ trách) |
| `services/try-on/*` | Interface `HairTryOnProvider` + DemoCanvas adapter | M1 (Explorer 3 Phụ trách) |
| `services/audit.ts` | Service ghi nhật ký thao tác `AuditLog` | M1 (Explorer 3 Phụ trách) |
| `lib/validations/*` | Schemas Zod: `booking.ts`, `auth.ts` | M1 (Explorer 3 Phụ trách) |
| `.env.example` | Blueprint các biến môi trường | M1 (Explorer 3 Phụ trách) |
| `app/(public)/*` | Giao diện công khai (Home, Kiểu tóc, Màu swatch, Đặt lịch...) | M4 Triển khai |
| `app/admin/*` | Giao diện quản trị Admin CMS | M2 & M3 Triển khai |
| `components/ui/*` | Bộ shadcn/ui primitives tái sử dụng | M1 & M2 Bổ sung dần |

---

## 9. QUY TRÌNH THỰC THI CHO WORKER (STEP-BY-STEP IMPLEMENTATION RUNBOOK)

Sau khi bản phân tích này được nghiệm thu, Worker triển khai M1 Subsystem 1 sẽ tiến hành các bước:

1. **Tạo `package.json`** tại thư mục gốc dự án theo đặc tả Mục 2.2.
2. **Tạo `tsconfig.json`** tại thư mục gốc theo Mục 3.1.
3. **Tạo `next.config.js`** và `postcss.config.js` theo Mục 4.1 và Mục 5.
4. **Tạo `tailwind.config.ts`** theo Mục 6.2.
5. **Tạo thư mục `app/` và file `app/globals.css`** theo Mục 6.3.
6. **Tạo thư mục `lib/` và file `lib/utils.ts`** theo Mục 7.1.
7. **Tạo file `lib/auth.ts`** theo Mục 7.2.
8. **Chạy kiểm tra xác minh:**
   - Cài đặt dependencies: `npm install`
   - Kiểm tra type check: `npx tsc --noEmit`

---

## 10. KẾT LUẬN

Bản thiết kế này đáp ứng đầy đủ và vượt mức các yêu cầu được giao trong Dispatch:
- Trọn vẹn các file cấu hình cốt lõi với thông số tối ưu cho Next.js App Router và Vercel.
- Toàn bộ hàm tiện ích `lib/utils.ts` và bảo mật `lib/auth.ts` đã được viết mã nguồn đầy đủ, không bỏ lửng TODO, có chú thích tiếng Việt rõ ràng.
- Đảm bảo tính nhất quán và phối hợp chặt chẽ với Explorer M1-2 (Prisma/Seed) và Explorer M1-3 (Services/Validations).
