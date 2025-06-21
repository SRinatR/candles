"use client";

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback, useEffect } from 'react';
import type { AdminUser, SimulatedUser, AdminRole } from '@/lib/types';

// Storage keys
const ADMIN_USERS_STORAGE_KEY = 'adminUsers';
const SIMULATED_USERS_STORAGE_KEY = 'scentSationalSimulatedUsers';
const ADMIN_LOGS_STORAGE_KEY = 'adminLogs';

// Database-only authentication via NextAuth.js - no localStorage

const logAdminAction = (action: string, adminEmail: string, details?: string) => {
  if (typeof window === 'undefined') return;
  const logs = JSON.parse(localStorage.getItem(ADMIN_LOGS_STORAGE_KEY) || '[]');
  const newLog = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    action,
    adminEmail,
    details: details || '',
    userAgent: navigator.userAgent,
  };
  logs.unshift(newLog);
  // Keep only last 100 logs
  if (logs.length > 100) logs.splice(100);
  localStorage.setItem(ADMIN_LOGS_STORAGE_KEY, JSON.stringify(logs));
};

export const useUnifiedAuth = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [registrationData, setRegistrationData] = useState<Partial<SimulatedUser> | null>(null);
  const [sessionStartTime] = useState<string>(new Date().toISOString());
  const [sessionUserAgent] = useState<string>(typeof window !== 'undefined' ? navigator.userAgent : '');

  // Load registration data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRegData = localStorage.getItem('scentSationalSimulatedRegData');
      if (storedRegData) {
        setRegistrationData(JSON.parse(storedRegData));
      }
    }
  }, []);

  // Save registration data to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (registrationData) {
        localStorage.setItem('scentSationalSimulatedRegData', JSON.stringify(registrationData));
      } else {
        localStorage.removeItem('scentSationalSimulatedRegData');
      }
    }
  }, [registrationData]);

  // Current user info
  const currentUser = session?.user || null;
  const isAuthenticated = !!session;
  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const isManager = (session?.user as any)?.role === 'MANAGER';
  const isAdminOrManager = isAdmin || isManager;
  const userType = (session?.user as any)?.userType || 'user';
  const isPredefined = (session?.user as any)?.isPredefined || false;

  // No localStorage - all data comes from database via NextAuth.js

  // Login functions
  const loginUser = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        userType: 'user',
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: 'Login Failed',
          description: 'Invalid email or password',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });
      return true;
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: 'An error occurred during login',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loginAdmin = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        userType: 'admin',
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: 'Admin Login Failed',
          description: 'Invalid admin credentials',
          variant: 'destructive',
        });
        return false;
      }

      logAdminAction('LOGIN', email, 'Admin logged in successfully');
      toast({
        title: 'Admin Login Successful',
        description: `Welcome, ${email}!`,
      });
      router.push('/admin/dashboard');
      return true;
    } catch (error) {
      toast({
        title: 'Admin Login Failed',
        description: 'An error occurred during admin login',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast, router]);

  // Registration functions - now handled by database
  const registerUser = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => {
    // This should be handled by API routes that interact with the database
    // For now, return error to indicate this needs to be implemented
    return { success: false, error: 'Registration should be handled by API routes with database' };
  };

  const registerStep1 = useCallback(async (email: string, password: string, confirmPassword: string): Promise<boolean> => {
    // This should be handled by API routes that interact with the database
    toast({
      title: 'Error',
      description: 'Registration should be handled by API routes with database',
      variant: 'destructive',
    });
    return false;
  }, [toast]);

  const confirmRegistration = useCallback(async (profileData: {
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<boolean> => {
    // This should be handled by API routes that interact with the database
    toast({
      title: 'Error',
      description: 'Registration should be handled by API routes with database',
      variant: 'destructive',
    });
    return false;
  }, [toast]);

  // Admin management functions - now handled by database via API routes
  const addManager = useCallback(async (managerData: {
    email: string;
    name: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }> => {
    // This should be handled by API routes that interact with the database
    return { success: false, error: 'Manager management should be handled by API routes with database' };
  }, []);

  const updateManager = useCallback(async (managerId: string, updateData: {
    name?: string;
    email?: string;
    status?: 'ACTIVE' | 'BLOCKED';
  }): Promise<{ success: boolean; error?: string }> => {
    // This should be handled by API routes that interact with the database
    return { success: false, error: 'Manager management should be handled by API routes with database' };
  }, []);

  const deleteManager = useCallback(async (managerId: string): Promise<{ success: boolean; error?: string }> => {
    // This should be handled by API routes that interact with the database
    return { success: false, error: 'Manager management should be handled by API routes with database' };
  }, []);

  const getAllManagers = useCallback((): AdminUser[] => {
    // This should be handled by API routes that interact with the database
    return [];
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    if (userType === 'admin' && currentUser?.email) {
      logAdminAction('LOGOUT', currentUser.email, 'Admin logged out');
    }
    
    await signOut({ redirect: false });
    setRegistrationData(null);
    
    toast({
      title: 'Logged Out',
      description: 'You have been logged out successfully',
    });
    
    if (userType === 'admin') {
      router.push('/admin/login');
    } else {
      router.push('/login');
    }
  }, [userType, currentUser?.email, toast, router]);

  return {
    // Session data
    session,
    isAuthenticated,
    isAdmin,
    isManager,
    isAdminOrManager,
    userType,
    isPredefined,
    currentUser,
    isLoading: status === 'loading' || isLoading,
    
    // Authentication functions
    loginUser,
    loginAdmin,
    logout,
    
    // Registration functions (now handled by API routes)
    registerUser,
    registerStep1,
    confirmRegistration,
    registrationData,
    
    // Admin management functions (now handled by API routes)
    addManager,
    updateManager,
    deleteManager,
    getAllManagers,
  };
};