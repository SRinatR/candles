
"use client";

import type { AdminUser, AdminRole } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { logAdminAction } from '@/admin/lib/admin-logger';
import type { AdminLocale } from '@/admin/lib/i18n-config-admin';
import { i18nAdmin } from '@/admin/lib/i18n-config-admin';
import { getAdminDictionary } from '@/admin/lib/getAdminDictionary';
import type enAdminMessages from '@/admin/dictionaries/en.json';

type AdminLoginStrings = typeof enAdminMessages.adminLoginPage;
type AdminContextToastStrings = typeof enAdminMessages.adminContextToasts;

interface AuthStrings {
  login: AdminLoginStrings | null;
  contextToasts: AdminContextToastStrings | null;
}

const fallbackLoginStrings: AdminLoginStrings = { title: "Admin Panel", description: "Please sign in to manage Askim candles.", emailLabel: "Email Address", emailPlaceholder: "admin@example.com", passwordLabel: "Password", passwordPlaceholder: "••••••••", signInButton: "Sign In", signingInButton: "Signing In...", restrictedAccess: "Access to this panel is restricted to authorized personnel only.", loading: "Loading admin panel...", loginSuccessTitle: "Admin Login Successful", loginWelcomeMessage: "Welcome, {name}!", loginErrorTitle: "Admin Login Failed", loginErrorDescRequired: "Email and password are required.", loginErrorDescInvalid: "Invalid email or password. Please check your credentials and try again.", loginErrorDescBlockedStatus: "Blocked", loginSuccessDescActiveStatus: "Active" };
const fallbackContextToastStrings: AdminContextToastStrings = { logoutSuccessTitle: "Logged Out", logoutSuccessDesc: "You have been successfully logged out from the admin panel.", addManagerSuccessTitle: "Manager Added (Simulated)", addManagerSuccessDesc: "{name} ({email}) has been 'added' as a manager. This change is client-side (localStorage).", addManagerErrorEmailExistsTitle: "Failed to Add Manager", addManagerErrorEmailExistsDesc: "An account with this email address already exists. Please use a different email.", managerBlockedToastTitle: "Manager Blocked", managerUnblockedToastTitle: "Manager Unblocked", managerStatusUpdatedToastDesc: "{name} status updated to {status}.", accountBlockedErrorDesc: "This account is blocked. Please contact an administrator.", managerDetailsUpdatedTitle: "Manager Updated (Simulated)", managerDetailsUpdatedDesc: "Details for {name} have been updated locally.", managerDeletedTitle: "Manager Deleted (Simulated)", managerDeletedDesc: "{name} has been deleted locally."};

interface AdminAuthContextType {
  currentAdminUser: AdminUser | null;
  sessionStartTime: string | null;
  sessionUserAgent: string | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  role: AdminRole | null;
  predefinedUsers: Record<string, AdminUser>;
  dynamicallyAddedManagers: AdminUser[];
  addManager: (name: string, email: string, pass: string) => Promise<boolean>;
  toggleBlockManagerStatus: (emailToToggle: string) => Promise<void>;
  updateManagerDetails: (originalEmail: string, newName: string, newEmail: string) => Promise<boolean>;
  deleteManager: (emailToDelete: string) => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_STORAGE_KEY = 'askimAdminUser';
const DYNAMIC_MANAGERS_STORAGE_KEY = 'askimDynamicManagers';
const ADMIN_SESSION_START_TIME_KEY = 'askimAdminSessionStartTime';
const ADMIN_SESSION_USER_AGENT_KEY = 'askimAdminSessionUserAgent';

const initialPredefinedUsers: Record<string, AdminUser> = {
  'admin@askimcandles.com': {
    id: 'admin001',
    email: 'admin@askimcandles.com',
    name: 'Store Administrator',
    role: 'ADMIN',
    password: 'adminpass', 
    isPredefined: true,
    isBlocked: false,
  },
  'manager@askimcandles.com': {
    id: 'manager001',
    email: 'manager@askimcandles.com',
    name: 'Store Manager',
    role: 'MANAGER',
    password: 'managerpass', 
    isPredefined: true,
    isBlocked: false,
  },
};

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentAdminUser, setCurrentAdminUser] = useState<AdminUser | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [sessionUserAgent, setSessionUserAgent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  
  const [predefinedUsers] = useState<Record<string, AdminUser>>(initialPredefinedUsers);
  const [dynamicallyAddedManagers, setDynamicallyAddedManagers] = useState<AdminUser[]>([]);
  const [currentAdminLocale, setCurrentAdminLocale] = useState<AdminLocale>(i18nAdmin.defaultLocale);
  const [authStrings, setAuthStrings] = useState<AuthStrings>({ login: fallbackLoginStrings, contextToasts: fallbackContextToastStrings });

  useEffect(() => {
    const storedLocale = localStorage.getItem('admin-lang') as AdminLocale | null;
    const localeToLoad = storedLocale && i18nAdmin.locales.includes(storedLocale) ? storedLocale : i18nAdmin.defaultLocale;
    setCurrentAdminLocale(localeToLoad);

    async function loadTranslations() {
      try {
        const dict = await getAdminDictionary(localeToLoad);
        setAuthStrings({ 
          login: dict.adminLoginPage || fallbackLoginStrings, 
          contextToasts: dict.adminContextToasts || fallbackContextToastStrings
        });
      } catch (error) {
        console.error("Failed to load admin translations for context:", error);
        setAuthStrings({ login: fallbackLoginStrings, contextToasts: fallbackContextToastStrings });
      }
    }
    loadTranslations();

    const storedUser = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (storedUser) {
      try {
        const parsedUser: AdminUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.email && parsedUser.role) {
           setCurrentAdminUser(parsedUser);
           const startTime = localStorage.getItem(ADMIN_SESSION_START_TIME_KEY);
           const userAgent = localStorage.getItem(ADMIN_SESSION_USER_AGENT_KEY);
           if (startTime) setSessionStartTime(startTime);
           if (userAgent) setSessionUserAgent(userAgent);
        } else {
          localStorage.removeItem(ADMIN_STORAGE_KEY);
          localStorage.removeItem(ADMIN_SESSION_START_TIME_KEY);
          localStorage.removeItem(ADMIN_SESSION_USER_AGENT_KEY);
        }
      } catch (error) {
        console.error("Failed to parse admin user from localStorage", error);
        localStorage.removeItem(ADMIN_STORAGE_KEY);
        localStorage.removeItem(ADMIN_SESSION_START_TIME_KEY);
        localStorage.removeItem(ADMIN_SESSION_USER_AGENT_KEY);
      }
    }

    try {
        const storedDynamicManagersRaw = localStorage.getItem(DYNAMIC_MANAGERS_STORAGE_KEY);
        if (storedDynamicManagersRaw) {
            const parsedManagers: AdminUser[] = JSON.parse(storedDynamicManagersRaw);
            if (Array.isArray(parsedManagers)) {
                setDynamicallyAddedManagers(parsedManagers);
            }
        }
    } catch (error) {
        console.error("Failed to parse dynamic managers from localStorage", error);
        localStorage.removeItem(DYNAMIC_MANAGERS_STORAGE_KEY);
    }
    setIsLoading(false);
  }, []); 

  useEffect(() => { 
    async function loadTranslationsOnLocaleChange() {
      try {
        const dict = await getAdminDictionary(currentAdminLocale);
         setAuthStrings({ 
          login: dict.adminLoginPage || fallbackLoginStrings, 
          contextToasts: dict.adminContextToasts || fallbackContextToastStrings
        });
      } catch (error) {
         console.error("Failed to load admin translations on locale change:", error);
         setAuthStrings({ login: fallbackLoginStrings, contextToasts: fallbackContextToastStrings });
      }
    }
    if (!isLoading) { 
      loadTranslationsOnLocaleChange();
    }
  }, [currentAdminLocale, isLoading]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    const lowerEmail = email.toLowerCase().trim();
    const loginStrings = authStrings.login || fallbackLoginStrings;
    const contextToastStrings = authStrings.contextToasts || fallbackContextToastStrings;

    if (!lowerEmail || !pass) {
      toast({
        title: loginStrings.loginErrorTitle,
        description: loginStrings.loginErrorDescRequired,
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    // Check predefined users first
    const predefinedUser = predefinedUsers[lowerEmail];
    if (predefinedUser) {
      if (predefinedUser.password === pass) {
        setCurrentAdminUser(predefinedUser);
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(predefinedUser));
        const startTime = new Date().toISOString();
        const userAgent = typeof window !== 'undefined' ? navigator.userAgent : 'Unknown';
        localStorage.setItem(ADMIN_SESSION_START_TIME_KEY, startTime);
        localStorage.setItem(ADMIN_SESSION_USER_AGENT_KEY, userAgent);
        setSessionStartTime(startTime);
        setSessionUserAgent(userAgent);
        logAdminAction(predefinedUser.email, loginStrings.loginSuccessTitle || "Admin Login Successful");
        toast({
          title: loginStrings.loginSuccessTitle || "Admin Login Successful",
          description: (loginStrings.loginWelcomeMessage || "Welcome, {name}!").replace('{name}', predefinedUser.name || 'Admin')
        });
        router.push('/admin/dashboard');
        setIsLoading(false);
        return true;
      }
    }

    // If not a predefined user, check dynamically added managers
    let dynamicManagersForLogin: AdminUser[] = [];
    try {
      const storedDynamicManagersRaw = localStorage.getItem(DYNAMIC_MANAGERS_STORAGE_KEY);
      if (storedDynamicManagersRaw) {
        const parsed = JSON.parse(storedDynamicManagersRaw);
        if (Array.isArray(parsed)) {
          dynamicManagersForLogin = parsed;
        }
      }
    } catch (e) {
      console.error("Error parsing dynamic managers during login:", e);
    }
    const dynamicManager = dynamicManagersForLogin.find(manager => manager.email.toLowerCase() === lowerEmail);

    if (dynamicManager) {
      if (dynamicManager.password === pass) {
        if (dynamicManager.isBlocked) {
          logAdminAction(lowerEmail, loginStrings.loginErrorDescBlockedStatus || "Blocked", { reason: "Account blocked" });
          toast({
            title: loginStrings.loginErrorTitle || "Admin Login Failed",
            description: contextToastStrings.accountBlockedErrorDesc || "This account is blocked. Please contact an administrator.",
            variant: "destructive",
            duration: 5000
          });
          setIsLoading(false);
          return false;
        }
        setCurrentAdminUser(dynamicManager);
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(dynamicManager));
        const startTime = new Date().toISOString();
        const userAgent = typeof window !== 'undefined' ? navigator.userAgent : 'Unknown';
        localStorage.setItem(ADMIN_SESSION_START_TIME_KEY, startTime);
        localStorage.setItem(ADMIN_SESSION_USER_AGENT_KEY, userAgent);
        setSessionStartTime(startTime);
        setSessionUserAgent(userAgent);
        logAdminAction(dynamicManager.email, loginStrings.loginSuccessTitle || "Admin Login Successful");
        toast({
          title: loginStrings.loginSuccessTitle || "Admin Login Successful",
          description: (loginStrings.loginWelcomeMessage || "Welcome, {name}!").replace('{name}', dynamicManager.name || 'Admin')
        });
        router.push('/admin/dashboard');
        setIsLoading(false);
        return true;
      }
    }

    // If user not found or password incorrect after checking both sources
    logAdminAction(lowerEmail, loginStrings.loginErrorDescInvalid || "Invalid credentials", { reason: "User not found or invalid password" });
    toast({
      title: loginStrings.loginErrorTitle || "Admin Login Failed",
      description: loginStrings.loginErrorDescInvalid || "Invalid email or password. Please check your credentials and try again.",
      variant: "destructive",
      duration: 5000
    });
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    const contextToastStrings = authStrings.contextToasts || fallbackContextToastStrings;
    const userEmailForLog = currentAdminUser?.email || "Unknown user";
    logAdminAction(userEmailForLog, contextToastStrings.logoutSuccessTitle || "Logged Out");
    
    setCurrentAdminUser(null);
    setSessionStartTime(null);
    setSessionUserAgent(null);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    localStorage.removeItem(ADMIN_SESSION_START_TIME_KEY);
    localStorage.removeItem(ADMIN_SESSION_USER_AGENT_KEY);

    toast({
        title: contextToastStrings.logoutSuccessTitle || "Logged Out",
        description: contextToastStrings.logoutSuccessDesc || "You have been successfully logged out from the admin panel."
    });
    router.push('/admin/login');
  };

  const addManager = async (name: string, email: string, pass: string): Promise<boolean> => {
    const lowerEmail = email.toLowerCase().trim();
    const contextToastStrings = authStrings.contextToasts || fallbackContextToastStrings;
    const allCurrentEmails = [
        ...Object.keys(predefinedUsers).map(e => e.toLowerCase()),
        ...dynamicallyAddedManagers.map(m => m.email.toLowerCase())
    ];

    if (allCurrentEmails.includes(lowerEmail)) {
        toast({
          title: contextToastStrings.addManagerErrorEmailExistsTitle || "Failed to Add Manager",
          description: contextToastStrings.addManagerErrorEmailExistsDesc || "An account with this email address already exists. Please use a different email.",
          variant: "destructive",
          duration: 5000
        });
        if (currentAdminUser?.email) {
          logAdminAction(currentAdminUser.email, "Add Manager Failed", { managerEmail: email, reason: "Email exists" });
        }
        return false;
    }
    const newManager: AdminUser = {
        id: `manager-${Date.now()}`,
        name,
        email: lowerEmail,
        password: pass, 
        role: 'MANAGER',
        isBlocked: false,
        isPredefined: false,
    };
    const updatedManagers = [...dynamicallyAddedManagers, newManager];
    setDynamicallyAddedManagers(updatedManagers);
    localStorage.setItem(DYNAMIC_MANAGERS_STORAGE_KEY, JSON.stringify(updatedManagers));
    toast({
        title: contextToastStrings.addManagerSuccessTitle || "Manager Added (Simulated)",
        description: (contextToastStrings.addManagerSuccessDesc || "{name} ({email}) has been 'added' as a manager. This change is client-side (localStorage).")
                        .replace('{name}', name)
                        .replace('{email}', email),
    });
    if (currentAdminUser?.email) {
      logAdminAction(currentAdminUser.email, contextToastStrings.addManagerSuccessTitle || "Manager Added (Simulated)", { managerEmail: email, managerName: name });
    }
    return true;
  };

  const toggleBlockManagerStatus = async (emailToToggle: string): Promise<void> => {
    const loginStrings = authStrings.login || fallbackLoginStrings;
    const contextToastStrings = authStrings.contextToasts || fallbackContextToastStrings;
    let toggledManager: AdminUser | undefined;
    const updatedManagers = dynamicallyAddedManagers.map(manager => {
        if (manager.email.toLowerCase() === emailToToggle.toLowerCase()) {
            toggledManager = { ...manager, isBlocked: !manager.isBlocked };
            return toggledManager;
        }
        return manager;
    }).filter(m => m !== undefined) as AdminUser[]; 

    setDynamicallyAddedManagers(updatedManagers);
    localStorage.setItem(DYNAMIC_MANAGERS_STORAGE_KEY, JSON.stringify(updatedManagers));

    if (toggledManager && currentAdminUser) {
        const actionMessage = toggledManager.isBlocked 
                                ? (contextToastStrings.managerBlockedToastTitle || "Manager Blocked")
                                : (contextToastStrings.managerUnblockedToastTitle || "Manager Unblocked");
        logAdminAction(currentAdminUser.email, actionMessage + " (Simulated)", { managerEmail: toggledManager.email, managerName: toggledManager.name });
        toast({
            title: actionMessage,
            description: (contextToastStrings.managerStatusUpdatedToastDesc || "{name} status updated to {status}.")
                            .replace('{name}', toggledManager.name)
                            .replace('{status}', toggledManager.isBlocked 
                                                ? (loginStrings.loginErrorDescBlockedStatus || "Blocked")
                                                : (loginStrings.loginSuccessDescActiveStatus || "Active")),
        });
    }
  };

  const updateManagerDetails = async (originalEmail: string, newName: string, newEmail: string): Promise<boolean> => {
    const contextToastStrings = authStrings.contextToasts || fallbackContextToastStrings;
    const lowerOriginalEmail = originalEmail.toLowerCase().trim();
    const lowerNewEmail = newEmail.toLowerCase().trim();
    
    if (lowerNewEmail !== lowerOriginalEmail && 
        (predefinedUsers[lowerNewEmail] || dynamicallyAddedManagers.some(m => m.email.toLowerCase() === lowerNewEmail && m.email.toLowerCase() !== lowerOriginalEmail))) {
      toast({
        title: contextToastStrings.addManagerErrorEmailExistsTitle || "Failed to Add Manager",
        description: contextToastStrings.addManagerErrorEmailExistsDesc || "An account with this email address already exists. Please use a different email.",
        variant: "destructive",
      });
      return false;
    }

    let managerUpdated = false;
    const updatedManagers = dynamicallyAddedManagers.map(manager => {
      if (manager.email.toLowerCase() === lowerOriginalEmail) {
        managerUpdated = true;
        return { ...manager, name: newName, email: newEmail };
      }
      return manager;
    });

    if (managerUpdated) {
      setDynamicallyAddedManagers(updatedManagers);
      localStorage.setItem(DYNAMIC_MANAGERS_STORAGE_KEY, JSON.stringify(updatedManagers));
      toast({
        title: contextToastStrings.managerDetailsUpdatedTitle || "Manager Updated (Simulated)",
        description: (contextToastStrings.managerDetailsUpdatedDesc || "Details for {name} have been updated locally.").replace('{name}', newName),
      });
       if (currentAdminUser?.email) {
        logAdminAction(currentAdminUser.email, contextToastStrings.managerDetailsUpdatedTitle || "Manager Updated (Simulated)", { oldEmail: originalEmail, newEmail, newName });
      }
      return true;
    }
    return false; 
  };

  const deleteManager = async (emailToDelete: string): Promise<boolean> => {
    const contextToastStrings = authStrings.contextToasts || fallbackContextToastStrings;
    const lowerEmailToDelete = emailToDelete.toLowerCase().trim();
    let managerFoundAndDeleted = false;
    let managerName = "Unknown";

    const updatedManagers = dynamicallyAddedManagers.filter(manager => {
      if (manager.email.toLowerCase() === lowerEmailToDelete) {
        managerName = manager.name;
        managerFoundAndDeleted = true;
        return false; 
      }
      return true;
    });

    if (managerFoundAndDeleted) {
      setDynamicallyAddedManagers(updatedManagers);
      localStorage.setItem(DYNAMIC_MANAGERS_STORAGE_KEY, JSON.stringify(updatedManagers));
      toast({
        title: contextToastStrings.managerDeletedTitle || "Manager Deleted (Simulated)",
        description: (contextToastStrings.managerDeletedDesc || "{name} has been deleted locally.").replace('{name}', managerName),
      });
       if (currentAdminUser?.email) {
        logAdminAction(currentAdminUser.email, contextToastStrings.managerDeletedTitle || "Manager Deleted (Simulated)", { deletedManagerEmail: emailToDelete, deletedManagerName: managerName });
      }
      return true;
    }
    return false;
  };

  const role = currentAdminUser?.role || null;
  const isAdmin = role === 'ADMIN';
  const isManager = role === 'MANAGER' || role === 'ADMIN';

  return (
    <AdminAuthContext.Provider value={{
        currentAdminUser,
        sessionStartTime,
        sessionUserAgent,
        login,
        logout,
        isLoading,
        isAdmin,
        isManager,
        role,
        predefinedUsers,
        dynamicallyAddedManagers,
        addManager,
        toggleBlockManagerStatus,
        updateManagerDetails,
        deleteManager
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

    