
import type { NextAuthOptions, User } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { AdminUser, SimulatedUser } from '@/lib/types';

const prisma = new PrismaClient();

// Helper functions for database access
const getUserByEmail = async (email: string) => {
  try {
    return await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        isBlocked: true
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

const createUserFromOAuth = async (email: string, name: string, image?: string) => {
  try {
    return await prisma.user.create({
      data: {
        email,
        name,
        role: 'USER',
        isBlocked: false
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBlocked: true
      }
    });
  } catch (error) {
    console.error('Error creating OAuth user:', error);
    return null;
  }
};

// Fallback to localStorage for development (when database is not available)
const getStoredUsers = (): Record<string, SimulatedUser> => {
  if (typeof window === 'undefined') return {};
  const users = localStorage.getItem('scentSationalSimulatedUsers');
  return users ? JSON.parse(users) : {};
};

const getStoredAdmins = (): AdminUser[] => {
  if (typeof window === 'undefined') return [];
  const admins = localStorage.getItem('adminUsers');
  return admins ? JSON.parse(admins) : [];
};

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        userType: { label: 'User Type', type: 'text' }, // 'user' or 'admin'
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.toLowerCase();
        const password = credentials.password;
        const userType = credentials.userType || 'user';

        if (userType === 'admin') {
          // Try database first
          try {
            const dbUser = await getUserByEmail(email);
            
            if (dbUser && !dbUser.isBlocked && (dbUser.role === 'ADMIN' || dbUser.role === 'MANAGER')) {
              // Verify password
              const isValidPassword = dbUser.password 
                ? await bcrypt.compare(password, dbUser.password)
                : false;
              
              if (isValidPassword) {
                const isSuperAdmin = dbUser.id === 'super-admin-001' || dbUser.email === 'superadmin@askimcandles.com';
                
                return {
                  id: dbUser.id,
                  email: dbUser.email,
                  name: dbUser.name || '',
                  role: dbUser.role,
                  userType: 'admin',
                  isPredefined: isSuperAdmin,
                } as User & { role: string; userType: string; isPredefined: boolean };
              }
            }
          } catch (error) {
            console.error('Database authentication error:', error);
          }

          // Fallback to localStorage for development
          const storedAdmins = getStoredAdmins();
          const dynamicAdmin = storedAdmins.find(
            admin => admin.email === email && admin.password === password && !admin.isBlocked
          );
          
          if (dynamicAdmin) {
            return {
              id: dynamicAdmin.id,
              email: dynamicAdmin.email,
              name: dynamicAdmin.name,
              role: dynamicAdmin.role,
              userType: 'admin',
              isPredefined: false,
            } as User & { role: string; userType: string; isPredefined: boolean };
          }
        } else {
          // Try database first for regular users
          try {
            const dbUser = await getUserByEmail(email);
            
            if (dbUser && !dbUser.isBlocked && dbUser.role === 'USER') {
              // Verify password
              const isValidPassword = dbUser.password 
                ? await bcrypt.compare(password, dbUser.password)
                : false;
              
              if (isValidPassword) {
                return {
                  id: dbUser.id,
                  email: dbUser.email,
                  name: dbUser.name || '',
                  role: dbUser.role,
                  userType: 'user',
                } as User & { role: string; userType: string };
              }
            }
          } catch (error) {
            console.error('Database authentication error for user:', error);
          }

          // Fallback to localStorage for development
          const users = getStoredUsers();
          const user = users[email];
          
          if (user && user.password === password && user.isConfirmed) {
            return {
              id: user.id,
              email: user.email,
              name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
              userType: 'user',
            } as User & { userType: string };
          }
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.userId as string;
        (session.user as any).role = token.role;
        (session.user as any).userType = token.userType;
        (session.user as any).isPredefined = token.isPredefined;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        if (account.provider === 'google') {
          // For Google OAuth, check if user exists in database
          try {
            let dbUser = await getUserByEmail(user.email!);
            
            if (!dbUser) {
              // Create new user in database
              dbUser = await createUserFromOAuth(
                user.email!,
                user.name || '',
                user.image
              );
            }
            
            if (dbUser) {
              token.userId = dbUser.id;
              token.role = dbUser.role;
              token.userType = 'user';
            } else {
              token.userId = user.id;
              token.userType = 'user';
            }
          } catch (error) {
            console.error('Error handling Google OAuth user:', error);
            token.userId = user.id;
            token.userType = 'user';
          }
        } else if (account.provider === 'credentials') {
          token.userId = user.id;
          token.role = (user as any).role;
          token.userType = (user as any).userType;
          token.isPredefined = (user as any).isPredefined;
        }
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // Handle admin redirects
      if (url.includes('userType=admin')) {
        return `${baseUrl}/admin/dashboard`;
      }
      // Handle regular user redirects
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  },
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};
