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

// Helper functions for localStorage
const getStoredAdmins = (): AdminUser[] => {
  if (typeof window === 'undefined') return [];
  const admins = localStorage.getItem(ADMIN_USERS_STORAGE_KEY);
  return admins ? JSON.parse(admins) : [];
};

const saveStoredAdmins = (admins: AdminUser[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(admins));
};

const getStoredUsers = (): Record<string, SimulatedUser> => {
  if (typeof window === 'undefined') return {};
  const users = localStorage.getItem(SIMULATED_USERS_STORAGE_KEY);
  return users ? JSON.parse(users) : {};
};

const saveStoredUsers = (users: Record<string, SimulatedUser>) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SIMULATED_USERS_STORAGE_KEY, JSON.stringify(users));
};

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

  // Admin-specific data
  const [dynamicallyAddedManagers, setDynamicallyAddedManagers] = useState<AdminUser[]>([]);
  const [predefinedUsers] = useState<AdminUser[]>([
    {
      id: 'admin-1',
      email: 'admin@askimcandles.com',
      name: 'Super Admin',
      role: 'ADMIN',
      isPredefined: true,
      isBlocked: false,
    },
    {
      id: 'manager-1',
      email: 'manager@askimcandles.com',
      name: 'Store Manager',
      role: 'MANAGER',
      isPredefined: true,
      isBlocked: false,
    },
  ]);

  // Load dynamic managers on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAdmins = getStoredAdmins();
      setDynamicallyAddedManagers(storedAdmins);
    }
  }, []);

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

  // Registration functions
  const registerStep1 = useCallback(async (email: string, password: string, confirmPassword: string): Promise<boolean> => {
    setIsLoading(true);
    
    if (password !== confirmPassword) {
      toast({
        title: 'Registration Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      setIsLoading(false);
      return false;
    }

    const users = getStoredUsers();
    if (users[email.toLowerCase()]) {
      toast({
        title: 'Registration Failed',
        description: 'An account with this email already exists',
        variant: 'destructive',
      });
      setIsLoading(false);
      return false;
    }

    setRegistrationData({
      email: email.toLowerCase(),
      password,
      id: Date.now().toString(),
    });
    
    setIsLoading(false);
    return true;
  }, [toast]);

  const registerStep2 = useCallback(async (firstName: string, lastName: string): Promise<boolean> => {
    setIsLoading(true);
    
    if (!registrationData?.email || !registrationData?.password) {
      toast({
        title: 'Registration Error',
        description: 'Previous registration data is missing',
        variant: 'destructive',
      });
      setIsLoading(false);
      return false;
    }

    const updatedRegData = {
      ...registrationData,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      isRegistered: true,
      isConfirmed: false,
    };
    
    setRegistrationData(updatedRegData);
    
    const users = getStoredUsers();
    users[updatedRegData.email!] = updatedRegData as SimulatedUser;
    saveStoredUsers(users);
    
    setIsLoading(false);
    return true;
  }, [registrationData, toast]);

  const confirmAccount = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    
    if (!registrationData?.email || !registrationData?.isRegistered) {
      toast({
        title: 'Confirmation Error',
        description: 'No pending registration found',
        variant: 'destructive',
      });
      setIsLoading(false);
      return false;
    }

    const users = getStoredUsers();
    const userToConfirm = users[registrationData.email];
    
    if (userToConfirm) {
      userToConfirm.isConfirmed = true;
      users[registrationData.email] = userToConfirm;
      saveStoredUsers(users);
      setRegistrationData(null);
      
      toast({
        title: 'Account Confirmed',
        description: 'You can now login',
      });
      
      setIsLoading(false);
      return true;
    }
    
    toast({
      title: 'Confirmation Error',
      description: 'Could not find user to confirm',
      variant: 'destructive',
    });
    setIsLoading(false);
    return false;
  }, [registrationData, toast]);

  // Admin management functions
  const addManager = useCallback(async (managerData: Omit<AdminUser, 'id' | 'isPredefined'>): Promise<boolean> => {
    if (!isAdmin) return false;
    
    const existingAdmins = getStoredAdmins();
    const allUsers = [...predefinedUsers, ...existingAdmins];
    
    if (allUsers.some(user => user.email === managerData.email)) {
      toast({
        title: 'Error',
        description: 'A user with this email already exists',
        variant: 'destructive',
      });
      return false;
    }

    const newManager: AdminUser = {
      ...managerData,
      id: Date.now().toString(),
      isPredefined: false,
      isBlocked: false,
    };

    const updatedAdmins = [...existingAdmins, newManager];
    saveStoredAdmins(updatedAdmins);
    setDynamicallyAddedManagers(updatedAdmins);
    
    logAdminAction('ADD_MANAGER', currentUser?.email || '', `Added manager: ${newManager.email}`);
    
    toast({
      title: 'Manager Added',
      description: `Manager ${newManager.name} has been added successfully`,
    });
    
    return true;
  }, [isAdmin, predefinedUsers, currentUser?.email, toast]);

  const toggleBlockManagerStatus = useCallback((managerId: string) => {
    if (!isAdmin) return;
    
    const existingAdmins = getStoredAdmins();
    const updatedAdmins = existingAdmins.map(admin => 
      admin.id === managerId ? { ...admin, isBlocked: !admin.isBlocked } : admin
    );
    
    saveStoredAdmins(updatedAdmins);
    setDynamicallyAddedManagers(updatedAdmins);
    
    const manager = updatedAdmins.find(admin => admin.id === managerId);
    if (manager) {
      logAdminAction(
        manager.isBlocked ? 'BLOCK_MANAGER' : 'UNBLOCK_MANAGER',
        currentUser?.email || '',
        `${manager.isBlocked ? 'Blocked' : 'Unblocked'} manager: ${manager.email}`
      );
      
      toast({
        title: manager.isBlocked ? 'Manager Blocked' : 'Manager Unblocked',
        description: `${manager.name} has been ${manager.isBlocked ? 'blocked' : 'unblocked'}`,
      });
    }
  }, [isAdmin, currentUser?.email, toast]);

  const updateManagerDetails = useCallback((managerId: string, updates: Partial<AdminUser>) => {
    if (!isAdmin) return;
    
    const existingAdmins = getStoredAdmins();
    
    // Check for email conflicts if email is being updated
    if (updates.email) {
      const allUsers = [...predefinedUsers, ...existingAdmins];
      const emailExists = allUsers.some(user => user.email === updates.email && user.id !== managerId);
      
      if (emailExists) {
        toast({
          title: 'Update Failed',
          description: 'A user with this email already exists',
          variant: 'destructive',
        });
        return;
      }
    }
    
    const updatedAdmins = existingAdmins.map(admin => 
      admin.id === managerId ? { ...admin, ...updates } : admin
    );
    
    saveStoredAdmins(updatedAdmins);
    setDynamicallyAddedManagers(updatedAdmins);
    
    const manager = updatedAdmins.find(admin => admin.id === managerId);
    if (manager) {
      logAdminAction('UPDATE_MANAGER', currentUser?.email || '', `Updated manager: ${manager.email}`);
      
      toast({
        title: 'Manager Updated',
        description: `${manager.name} has been updated successfully`,
      });
    }
  }, [isAdmin, predefinedUsers, currentUser?.email, toast]);

  const deleteManager = useCallback((managerId: string) => {
    if (!isAdmin) return;
    
    const existingAdmins = getStoredAdmins();
    const managerToDelete = existingAdmins.find(admin => admin.id === managerId);
    
    if (!managerToDelete) return;
    
    const updatedAdmins = existingAdmins.filter(admin => admin.id !== managerId);
    saveStoredAdmins(updatedAdmins);
    setDynamicallyAddedManagers(updatedAdmins);
    
    logAdminAction('DELETE_MANAGER', currentUser?.email || '', `Deleted manager: ${managerToDelete.email}`);
    
    toast({
      title: 'Manager Deleted',
      description: `${managerToDelete.name} has been deleted`,
    });
  }, [isAdmin, currentUser?.email, toast]);

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
    // Session info
    currentUser,
    isAuthenticated,
    isLoading: status === 'loading' || isLoading,
    
    // User type checks
    isAdmin,
    isManager,
    isAdminOrManager,
    userType,
    isPredefined,
    
    // Session details
    sessionStartTime,
    sessionUserAgent,
    
    // Auth functions
    login: loginUser,
    loginAdmin,
    logout,
    
    // Registration functions
    registerStep1,
    registerStep2,
    confirmAccount,
    registrationData,
    setRegistrationData,
    
    // Admin management
    predefinedUsers,
    dynamicallyAddedManagers,
    addManager,
    toggleBlockManagerStatus,
    updateManagerDetails,
    deleteManager,
    
    // Legacy compatibility
    currentAdminUser: userType === 'admin' ? currentUser : null,
  };
};