import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

// 관리자 권한 확인 헬퍼
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
  if (!adminEmails.includes(session.user.email)) return null;
  return session;
}

// GET /api/admin/applications — 신청 내역 조회
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  const applications = await prisma.application.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // 통계
  const total = applications.length;
  const interestCounts: Record<string, number> = {};
  const campaignCounts: Record<string, number> = {};

  for (const app of applications) {
    if (app.interest) {
      interestCounts[app.interest] = (interestCounts[app.interest] || 0) + 1;
    }
    const campaign = app.utmCampaign || '(none)';
    campaignCounts[campaign] = (campaignCounts[campaign] || 0) + 1;
  }

  return NextResponse.json({
    total,
    interestCounts,
    campaignCounts,
    applications,
  });
}

// PUT /api/admin/applications/[id] — 신청 내역 수정
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, email, interest, experience, consent } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID가 필요합니다.' }, { status: 400 });
    }

    const data: any = {};
    if (typeof email === 'string') data.email = email.trim();
    if (typeof interest === 'string') {
      const valid = ['spam', 'app', 'both', 'unsure'];
      data.interest = valid.includes(interest) ? interest : null;
    }
    if (typeof experience === 'string') data.experience = experience.trim() || null;
    if (typeof consent === 'boolean') data.consent = consent;

    const updated = await prisma.application.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('Update error:', err);
    return NextResponse.json({ error: '수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// DELETE /api/admin/applications — 신청 내역 삭제
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID가 필요합니다.' }, { status: 400 });
    }

    await prisma.application.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    return NextResponse.json({ error: '삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
