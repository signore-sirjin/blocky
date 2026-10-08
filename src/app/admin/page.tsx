'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type Application = {
  id: string;
  email: string;
  interest: string | null;
  experience: string | null;
  consent: boolean;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  createdAt: string;
};

type AdminData = {
  total: number;
  interestCounts: Record<string, number>;
  campaignCounts: Record<string, number>;
  applications: Application[];
};

const INTEREST_LABELS: Record<string, string> = {
  spam: '스팸 문자 분류',
  app: '앱 알림 관리',
  both: '둘 다',
  unsure: '아직 모르겠음',
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Application>>({});
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/applications');
      if (res.status === 403) {
        setError('관리자 권한이 없습니다.');
        return;
      }
      if (!res.ok) throw new Error('불러오기 실패');
      const json = await res.json();
      setData(json);
    } catch {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (app: Application) => {
    setEditingId(app.id);
    setEditForm({
      email: app.email,
      interest: app.interest || '',
      experience: app.experience || '',
      consent: app.consent,
    });
    setActionError('');
  };

  const handleSave = async () => {
    setActionError('');
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...editForm }),
      });
      if (!res.ok) {
        const err = await res.json();
        setActionError(err.error || '수정 실패');
        return;
      }
      setEditingId(null);
      fetchData();
    } catch {
      setActionError('수정 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 신청 내역을 삭제하시겠습니까?')) return;
    setActionError('');
    try {
      const res = await fetch(`/api/admin/applications?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setActionError('삭제 실패');
        return;
      }
      fetchData();
    } catch {
      setActionError('삭제 중 오류가 발생했습니다.');
    }
  };

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">불러오는 중...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => router.push('/admin/login')} className="text-blocky underline">
            로그인으로
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Blocky 관리자</h1>
          <div className="flex items-center gap-4">
            <a
              href="/api/admin/export"
              className="text-sm text-blocky hover:underline font-medium"
            >
              CSV 내보내기
            </a>
            <span className="text-sm text-gray-500">{session?.user?.email}</span>
            <button
              onClick={() => router.push('/api/auth/signout')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* 통계 */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-3">통계</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-sm text-gray-500 mb-1">총 고유 신청 수</p>
              <p className="text-2xl font-bold text-gray-900">{data.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-sm text-gray-500 mb-2">관심 기능별 응답</p>
              <div className="space-y-1">
                {Object.entries(data.interestCounts).map(([key, count]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-600">{INTEREST_LABELS[key] || key}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                ))}
                {Object.keys(data.interestCounts).length === 0 && (
                  <p className="text-sm text-gray-400">데이터 없음</p>
                )}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-sm text-gray-500 mb-2">유입 캠페인별 신청 수</p>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {Object.entries(data.campaignCounts).map(([key, count]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate">{key}</span>
                    <span className="font-medium text-gray-900 ml-2 shrink-0">{count}</span>
                  </div>
                ))}
                {Object.keys(data.campaignCounts).length === 0 && (
                  <p className="text-sm text-gray-400">데이터 없음</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 신청 목록 */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-3">신청 목록</h2>
          {actionError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 mb-3">
              {actionError}
            </div>
          )}
          {data.applications.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">
              아직 신청 내역이 없습니다.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">이메일</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">관심 기능</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">경험</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">캠페인</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">신청 시각</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.applications.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        {editingId === app.id ? (
                          <>
                            <td className="px-4 py-2">
                              <input
                                type="email"
                                value={editForm.email || ''}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <select
                                value={editForm.interest || ''}
                                onChange={(e) => setEditForm({ ...editForm, interest: e.target.value })}
                                className="px-2 py-1 border border-gray-200 rounded text-sm"
                              >
                                <option value="">없음</option>
                                <option value="spam">스팸 문자 분류</option>
                                <option value="app">앱 알림 관리</option>
                                <option value="both">둘 다</option>
                                <option value="unsure">아직 모르겠음</option>
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={editForm.experience || ''}
                                onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })}
                                className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                              />
                            </td>
                            <td className="px-4 py-2 text-gray-400">—</td>
                            <td className="px-4 py-2 text-gray-400">—</td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <button onClick={handleSave} className="text-blocky hover:underline mr-2 text-sm">저장</button>
                              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:underline text-sm">취소</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-gray-900">{app.email}</td>
                            <td className="px-4 py-3 text-gray-600">{app.interest ? INTEREST_LABELS[app.interest] || app.interest : '—'}</td>
                            <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{app.experience || '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{app.utmCampaign || '—'}</td>
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                              {new Date(app.createdAt).toLocaleString('ko-KR')}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <button onClick={() => handleEdit(app)} className="text-blocky hover:underline mr-2 text-sm">수정</button>
                              <button onClick={() => handleDelete(app.id)} className="text-red-500 hover:underline text-sm">삭제</button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
