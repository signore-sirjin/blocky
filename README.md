# Blocky — 사전 신청 MVP

## 개요
- 서비스 소개, 사전 신청, 관리자 페이지, Google Analytics 4 측정으로 구성된 MVP
- AI 스팸 분류와 휴대폰 알림 차단은 향후 개발 예정 기능으로 안내
- 대표 색상: #2563EB (블루), SUIT 웹폰트 적용

## 기술 스택
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite (Base44 DB 역할)
- NextAuth.js (관리자 인증, Credentials provider)
- Google Analytics 4 (G-Q6MR3B10CD)

## 환경 변수
| 변수 | 설명 | 필수 |
|------|------|------|
| `DATABASE_URL` | SQLite DB 경로 | ✅ |
| `NEXTAUTH_SECRET` | NextAuth JWT 서명 비밀키 | ✅ |
| `NEXTAUTH_URL` | 앱 URL | ✅ |
| `ADMIN_EMAILS` | 관리자 이메일 (쉼표 구분) | ✅ |
| `ADMIN_PASSWORD` | 관리자 로그인 비밀번호 | ✅ |

## 실행 (Docker Compose)
```bash
docker compose -f docker-compose.base44.yml up -d --build
```

## 개발 (로컬)
```bash
npm install
npx prisma db push
npm run dev
```

## 관리자 접속
1. `/admin/login` 에서 로그인
2. `ADMIN_EMAILS`에 등록된 이메일 + `ADMIN_PASSWORD` 입력
3. `/admin`에서 신청 내역 조회·수정·삭제·CSV 내보내기

## Google Analytics 4
- 측정 ID: G-Q6MR3B10CD
- page_view: 소개 페이지 방문 (자동)
- prereg_cta_click: 사전 신청 버튼 클릭
- prereg_form_start: 신청 폼 작성 시작
- generate_lead: DB 저장 성공 시에만 전송
- 관리자 페이지는 GA 측정 제외
- 개인 식별 정보(이메일, 자유 입력)는 GA에 전송하지 않음
