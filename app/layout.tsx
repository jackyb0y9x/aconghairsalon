import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Công Nguyễn Hair Salon | Salon Tóc Nam & Nữ Hiện Đại',
  description:
    'Công Nguyễn Hair Salon - Địa chỉ tạo mẫu tóc nam nữ uy tín hàng đầu tại Nguyệt Áng 3, An Khánh, Hải Phòng. Cắt, uốn, nhuộm, phục hồi tóc chuyên sâu kết hợp công nghệ thử tóc trực quan.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="scroll-smooth dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('salon_theme');
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        {children}
      </body>
    </html>
  );
}
