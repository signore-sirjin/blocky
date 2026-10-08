'use client';

/**
 * GA4 측정 — gtag.js(GA4) 스크립트를 로드하고 page_view 이벤트를 자동 전송합니다.
 * GA4 측정 ID: G-Q6MR3B10CD
 * 관리자 페이지에서는 GA 이벤트를 전송하지 않습니다.
 */
import Script from 'next/script';
import { usePathname } from 'next/navigation';

const GA_ID = 'G-Q6MR3B10CD';

export default function Analytics() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') ?? false;

  if (isAdmin) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: true });
        `}
      </Script>
    </>
  );
}
