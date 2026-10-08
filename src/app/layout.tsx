import type { Metadata } from 'next';
import './globals.css';
import Analytics from '@/components/Analytics';

export const metadata: Metadata = {
  title: 'Blocky — AI 스팸·알림 관리 서비스 사전 신청',
  description:
    '스팸 문자부터 과도한 앱 알림까지. AI와 사용자 선호를 바탕으로 불필요한 알림을 줄이는 서비스를 준비하고 있습니다.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
