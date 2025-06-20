
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          image: user.image
        };
      }
    })
  ],
  pages: {
    signIn: '/admin/auth/signin',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: {
              email: user.email!
            }
          });

          if (existingUser) {
            // Update existing user with Google data
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                googleId: account.providerAccountId,
                image: user.image,
                lastLoginAt: new Date()
              }
            });
            user.id = existingUser.id;
            user.role = existingUser.role;
          } else {
            // Create new user from Google profile
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                firstName: profile?.given_name || user.name?.split(' ')[0] || '',
                lastName: profile?.family_name || user.name?.split(' ').slice(1).join(' ') || '',
                googleId: account.providerAccountId,
                image: user.image,
                emailVerified: new Date(),
                lastLoginAt: new Date(),
                role: 'USER' // Default role for new users
              }
            });
            user.id = newUser.id;
            user.role = newUser.role;
          }
        } catch (error) {
          console.error('Error during Google sign in:', error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as string;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role;
      }
      
      // For existing sessions, fetch fresh user data
      if (token.sub && !user) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { role: true, isActive: true, isBlocked: true }
          });
          
          if (dbUser) {
            token.role = dbUser.role;
            // Block access for inactive or blocked users
            if (!dbUser.isActive || dbUser.isBlocked) {
              return null;
            }
          }
        } catch (error) {
          console.error('Error fetching user in JWT callback:', error);
        }
      }
      
      return token;
    }
  },
  session: {
    strategy: 'jwt'
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};
