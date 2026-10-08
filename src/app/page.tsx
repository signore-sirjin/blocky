'use client';

import { useState, useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/ga';

type FormState = {
  email: string;
  interest: string;
  experience: string;
  consent: boolean;
};

const EMPTY_FORM: FormState = {
  email: '',
  interest: '',
  experience: '',
  consent: false,
};

const INTEREST_OPTIONS = [
  { value: 'spam', label: '스팸 문자 분류' },
  { value: 'app', label: '앱 알림 관리' },
  { value: 'both', label: '둘 다' },
  { value: 'unsure', label: '아직 모르겠음' },
];

export default function HomePage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formStarted, setFormStarted] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const consentRef = useRef<HTMLInputElement>(null);

  // UTM 파라미터 추출 (신청 단계까지 유지)
  const [utm, setUtm] = useState<Record<string, string>>({});
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUtm({
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      utm_content: params.get('utm_content') || '',
    });
  }, []);

  const handleFieldChange = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (!formStarted) {
      setFormStarted(true);
      trackEvent('prereg_form_start');
    }
    // Clear field-level error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.email.trim()) {
      newErrors.email = '이메일을 입력해 주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해 주세요.';
    }
    if (!form.consent) {
      newErrors.consent = '개인정보 처리에 동의해 주셔야 신청할 수 있습니다.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          interest: form.interest || null,
          experience: form.experience.trim() || null,
          consent: form.consent,
          utm,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setErrors({ email: '이미 신청된 이메일입니다.' });
        } else {
          setSubmitError(data.error || '신청 중 오류가 발생했습니다. 다시 시도해 주세요.');
        }
        return;
      }
      // 저장 성공 → 완료 화면 + GA generate_lead
      setSubmitted(true);
      trackEvent('generate_lead');
    } catch {
      setSubmitError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  // CTA 클릭 → 폼으로 스크롤 + GA 이벤트
  const handleCTA = () => {
    trackEvent('prereg_cta_click');
    document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 sm:p-10 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-blocky" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">사전 신청이 완료되었습니다.</h1>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Blocky 출시 소식을 해당 이메일로 안내드릴 예정입니다.<br />
            입력해 주셔서 감사합니다.
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-gray-600 text-left leading-relaxed">
            <p className="font-medium text-gray-800 mb-1">안내</p>
            <ul className="list-disc list-inside space-y-1">
              <li>현재 개발 준비 중이며, 사전 신청은 이용 확정을 의미하지 않습니다.</li>
              <li>신청 철회 또는 삭제 요청은 rlatpwls019@gmail.com 으로 문의해 주세요.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 pt-20 pb-12 sm:pt-28 sm:pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blocky px-4 py-1.5 rounded-full text-sm font-medium mb-8">
          <span className="w-2 h-2 bg-blocky rounded-full animate-pulse" />
          개발 준비 중
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6 tracking-tight">
          쏟아지는 알림 속,<br />중요한 소식을 놓치지 않도록.
        </h1>
        <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-10 max-w-xl mx-auto">
          스팸 문자부터 과도한 앱 알림까지. AI와 사용자 선호를 바탕으로 불필요한 알림을 줄이는 서비스를 준비하고 있습니다.
        </p>
        <button
          onClick={handleCTA}
          className="bg-blocky hover:bg-blocky-dark text-white font-semibold px-8 py-4 rounded-xl text-base sm:text-lg shadow-md hover:shadow-lg transition-all duration-200"
        >
          사전 신청하기
        </button>
      </section>

      {/* 소개 카드 */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-blocky" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">스팸 문자 분류</h3>
            <p className="text-sm text-gray-600 leading-relaxed">AI가 스팸 문자를 자동으로 분류합니다. (향후 개발 예정)</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-blocky" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">앱 알림 관리</h3>
            <p className="text-sm text-gray-600 leading-relaxed">사용자 선호에 따라 알림을 관리합니다. (향후 개발 예정)</p>
          </div>
        </div>
      </section>

      {/* 신청 폼 */}
      <section id="apply" className="max-w-xl mx-auto px-4 pb-20">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">사전 신청</h2>
          <p className="text-sm text-gray-500 mb-6">이메일을 남겨주시면 출시 안내를 보내드립니다.</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* 이메일 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder="example@email.com"
                className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-blocky focus:border-transparent transition text-base`}
                disabled={submitting}
                autoComplete="email"
              />
              {errors.email && <p className="mt-1.5 text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* 관심 기능 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                관심 기능 <span className="text-gray-400 text-xs">(선택)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {INTEREST_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleFieldChange('interest', opt.value === form.interest ? '' : opt.value)}
                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition ${
                      form.interest === opt.value
                        ? 'border-blocky bg-blue-50 text-blocky'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                    }`}
                    disabled={submitting}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 불편했던 경험 */}
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1.5">
                불편했던 경험 <span className="text-gray-400 text-xs">(선택)</span>
              </label>
              <textarea
                id="experience"
                value={form.experience}
                onChange={(e) => handleFieldChange('experience', e.target.value)}
                placeholder="스팸 문자나 알림 때문에 불편했던 경험을 자유롭게 적어 주세요."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blocky focus:border-transparent transition text-base resize-none"
                disabled={submitting}
              />
            </div>

            {/* 개인정보 안내 + 동의 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <button
                type="button"
                onClick={() => setShowPrivacy(!showPrivacy)}
                className="flex items-center justify-between w-full text-sm font-medium text-gray-700"
              >
                <span>개인정보 처리 안내</span>
                <svg className={`w-4 h-4 transition-transform ${showPrivacy ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showPrivacy && (
                <div className="mt-3 text-xs text-gray-600 leading-relaxed space-y-2">
                  <p><span className="font-medium text-gray-800">수집 목적:</span> 사전 신청 접수, 개발·출시 안내, 고객 요구 파악</p>
                  <p><span className="font-medium text-gray-800">수집 항목:</span> 이메일, 선택 응답, 신청 시각, 동의 기록, 유입 캠페인 정보</p>
                  <p><span className="font-medium text-gray-800">담당자:</span> 김세진</p>
                  <p><span className="font-medium text-gray-800">문의 이메일:</span> rlatpwls019@gmail.com</p>
                  <p><span className="font-medium text-gray-800">보유 기간:</span> 2026년 11월 30일까지</p>
                  <p><span className="font-medium text-gray-800">신청 철회 및 삭제 요청:</span> rlatpwls019@gmail.com 으로 요청해 주세요.</p>
                </div>
              )}
            </div>

            {/* 동의 체크박스 */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  ref={consentRef}
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => handleFieldChange('consent', e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded border-gray-300 text-blocky focus:ring-blocky focus:ring-offset-0 cursor-pointer shrink-0"
                  disabled={submitting}
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  위 개인정보 처리 안내를 확인했으며, 개인정보 수집 및 이용에 동의합니다.
                </span>
              </label>
              {errors.consent && <p className="mt-1.5 text-sm text-red-500 ml-8">{errors.consent}</p>}
            </div>

            {/* 서버 에러 */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                {submitError}
              </div>
            )}

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blocky hover:bg-blocky-dark text-white font-semibold py-4 rounded-xl text-base shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? '신청 중...' : '신청 완료'}
            </button>

            <p className="text-xs text-gray-400 text-center leading-relaxed">
              현재 개발 준비 중이며, 사전 신청은 이용 확정을 의미하지 않습니다.
            </p>
          </form>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-sm font-semibold text-gray-800 mb-1">Blocky</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            담당자: 김세진 · 문의: rlatpwls019@gmail.com<br />
            보유 기간: 2026년 11월 30일까지
          </p>
        </div>
      </footer>
    </div>
  );
}
