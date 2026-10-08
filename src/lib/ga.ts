/**
 * 커스텀 GA4 이벤트 전송 헬퍼 (클라이언트 전용)
 * 관리자 페이지에서는 이벤트를 전송하지 않습니다.
 * 개인 식별 정보(이메일, 자유 입력)는 GA에 전송하지 않습니다.
 */
export function trackEvent(eventName: string, _params?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  const pathname = window.location.pathname;
  if (pathname.startsWith('/admin')) return;
  if (typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', eventName);
  }
}

export const GA_ID = 'G-Q6MR3B10CD';
