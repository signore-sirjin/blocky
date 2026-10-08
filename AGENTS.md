# Blocky — AGENTS.md

## 프로젝트 개요
Blocky는 AI 스팸·앱 알림 관리 서비스의 사전 신청 MVP. Next.js 14 App Router + TypeScript + Tailwind CSS + Prisma(SQLite) + NextAuth.js.

## 환경 변수
- `DATABASE_URL`: SQLite 경로 (기본 `file:/app/data/blocky.db`)
- `NEXTAUTH_SECRET`: JWT 서명 키 (개발용 플레이스홀더 자동 생성됨, 운영 시 교체)
- `ADMIN_PASSWORD`: 관리자 로그인 비밀번호 (개발용 플레이스홀더 자동 생성됨, 운영 시 교체)
- `ADMIN_EMAILS`: 관리자 이메일, 쉼표 구분 (기본 `rlatpwls019@gmail.com`)
- `NEXTAUTH_URL`: 앱 URL (기본 `http://localhost:3000`)
- `.env.base44-defaults`가 플레이스홀더 제공, `/run/base44/app.env`가 실제 시크릿으로 override

## 실행
```bash
docker compose -f docker-compose.base44.yml up -d --build
```
소스 코드는 bind-mount되어 live reload 적용. `WATCHPACK_POLLING=true`로 파일 감시 활성화.

## 중요 규칙
- 가짜 후기·신청 내역·성과 수치를 표시하지 않음 (빈 DB에서 시작)
- GA4에 개인 식별 정보(이메일, 자유 입력) 전송 금지
- 관리자 페이지는 GA 측정 제외
- 중복 이메일 방지: Prisma `@@unique([email])` + 서버 측 사전 확인
- generate_lead 이벤트는 DB 저장 성공 시에만 전송
- UTM 파라미터(utm_source/medium/campaign/content) 신청 시 DB에 저장

## 관리자 접속
1. `/admin/login` → 이메일(`ADMIN_EMAILS`에 등록된) + 비밀번호(`ADMIN_PASSWORD`)
2. `/admin` → 신청 내역 조회/수정/삭제, CSV 내보내기(UTF-8 BOM 포함)

## 테스트 순서
1. `/` 접속 → 소개 화면 확인, GA page_view 확인
2. "사전 신청하기" 클릭 → 폼 스크롤, prereg_cta_click 확인
3. 폼 작성 시작 → prereg_form_start 확인
4. 이메일+동의 후 제출 → 완료 화면, generate_lead 확인
5. 동일 이메일 재제출 → 중복 에러(409) 확인
6. `/admin/login` → 로그인 후 신청 내역 확인
7. CSV 내보내기 → 한글 정상 표시 확인
