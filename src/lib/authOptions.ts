
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  pages: {
    signIn: '/login', 
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        if (token.userId) { 
          session.user.id = token.userId as string;
        } else if (token.sub) { 
          session.user.id = token.sub;
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        // For Google, user.id is available and is the Google ID
        if (user.id) {
          token.userId = user.id;
        }
      }
      return token;
    }
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};
