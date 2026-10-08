import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/applications — 사전 신청 생성
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, interest, experience, consent, utm } = body;

    // 서버 측 필수 검증
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: '이메일을 입력해 주세요.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: '올바른 이메일 형식을 입력해 주세요.' }, { status: 400 });
    }
    if (consent !== true) {
      return NextResponse.json({ error: '개인정보 처리에 동의해 주셔야 신청할 수 있습니다.' }, { status: 400 });
    }

    // 중복 이메일 방지 (DB unique constraint)
    const existing = await prisma.application.findUnique({
      where: { email: email.trim() },
    });
    if (existing) {
      return NextResponse.json({ error: '이미 신청된 이메일입니다.' }, { status: 409 });
    }

    // interest 검증
    const validInterests = ['spam', 'app', 'both', 'unsure'];
    const safeInterest = interest && validInterests.includes(interest) ? interest : null;
    const safeExperience = typeof experience === 'string' ? experience.trim() || null : null;

    const utmData = {
      utmSource: utm?.utm_source || null,
      utmMedium: utm?.utm_medium || null,
      utmCampaign: utm?.utm_campaign || null,
      utmContent: utm?.utm_content || null,
    };

    await prisma.application.create({
      data: {
        email: email.trim(),
        interest: safeInterest,
        experience: safeExperience,
        consent: true,
        ...utmData,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    // P2002 = unique constraint violation (중복)
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: '이미 신청된 이메일입니다.' }, { status: 409 });
    }
    console.error('Application creation error:', err);
    return NextResponse.json({ error: '신청 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
