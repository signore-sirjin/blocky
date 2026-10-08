import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// 관리자 인증: ADMIN_EMAILS 환경변수에 등록된 이메일만 접근 가능
// 비밀번호는 사용하지 않고, 이메일 기반으로 관리자 권한을 확인합니다.
// 실제 운영에서는 이메일 링크 로그인(magic link) 또는 OAuth 사용을 권장합니다.

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: '관리자 로그인',
      credentials: {
        email: { label: '이메일', type: 'email' },
        password: { label: '비밀번호', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const adminEmails = (process.env.ADMIN_EMAILS || '')
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean);

        if (!adminEmails.includes(credentials.email)) return null;

        // 비밀번호 확인: ADMIN_PASSWORD 환경변수와 비교
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminPassword || credentials.password !== adminPassword) {
          return null;
        }

        return { id: credentials.email, email: credentials.email, name: '관리자' };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.email = user.email;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.email = token.email as string;
      return session;
    },
  },
};
