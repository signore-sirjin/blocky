FROM node:22-slim

WORKDIR /app

# Prisma에 필요한 OpenSSL 라이브러리 설치
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# 의존성 설치에 필요한 파일만 복사
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# 의존성 설치
RUN npm install

# 소스 코드는 bind-mount로 제공되므로 COPY하지 않음 (dev 모드)

# 데이터 디렉토리
RUN mkdir -p /app/data

EXPOSE 3000

# 시작 명령: prisma db push + next dev
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && exec npx next dev -p 3000 -H 0.0.0.0"]
