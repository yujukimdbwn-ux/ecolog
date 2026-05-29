import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/components/AuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'EcoLog — 나만의 생태 도감',
  description: '사진으로 생물을 기록하고 AI가 종 정보를 채워 주는 시민과학 웹앱',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'EcoLog',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: '#1B4332',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
