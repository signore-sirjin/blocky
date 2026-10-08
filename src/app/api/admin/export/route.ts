import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
  if (!adminEmails.includes(session.user.email)) return null;
  return session;
}

// GET /api/admin/export — CSV 내보내기 (UTF-8 BOM 포함)
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const applications = await prisma.application.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const interestLabels: Record<string, string> = {
    spam: '스팸 문자 분류',
    app: '앱 알림 관리',
    both: '둘 다',
    unsure: '아직 모르겠음',
  };

  const headers = [
    '이메일', '관심 기능', '불편했던 경험', '동의 여부',
    'UTM Source', 'UTM Medium', 'UTM Campaign', 'UTM Content',
    '신청 시각',
  ];

  const escapeCsv = (val: string | null | undefined): string => {
    if (val == null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = applications.map((app) => [
    escapeCsv(app.email),
    escapeCsv(app.interest ? interestLabels[app.interest] || app.interest : ''),
    escapeCsv(app.experience),
    app.consent ? '동의' : '미동의',
    escapeCsv(app.utmSource),
    escapeCsv(app.utmMedium),
    escapeCsv(app.utmCampaign),
    escapeCsv(app.utmContent),
    escapeCsv(app.createdAt.toISOString()),
  ].join(','));

  // UTF-8 BOM 추가 (한글 깨짐 방지)
  const bom = '\uFEFF';
  const csv = bom + headers.join(',') + '\n' + rows.join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="blocky-applications.csv"',
    },
  });
}
