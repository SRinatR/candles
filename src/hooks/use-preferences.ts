'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  notifications: boolean;
  emailNotifications: boolean;
}

const defaultPreferences: UserPreferences = {
  language: 'en',
  theme: 'light',
  sidebarCollapsed: false,
  notifications: true,
  emailNotifications: true,
};

export function usePreferences() {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Загрузка настроек с сервера
  const loadPreferences = async () => {
    if (!session?.user?.id) {
      setPreferences(defaultPreferences);
      setIsLoaded(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/preferences?userId=${session.user.id}`);
      
      if (response.ok) {
        const data = await response.json();
        const userPrefs = {
          language: data.language || defaultPreferences.language,
          theme: data.theme || defaultPreferences.theme,
          sidebarCollapsed: data.settings?.sidebarCollapsed ?? defaultPreferences.sidebarCollapsed,
          notifications: data.settings?.notifications ?? defaultPreferences.notifications,
          emailNotifications: data.settings?.emailNotifications ?? defaultPreferences.emailNotifications,
        };
        setPreferences(userPrefs);
      } else {
        setPreferences(defaultPreferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      setPreferences(defaultPreferences);
    } finally {
      setIsLoading(false);
      setIsLoaded(true);
    }
  };

  // Обновление настроек
  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    const updatedPreferences = { ...preferences, ...newPreferences };
    
    if (!session?.user?.id) {
      setPreferences(updatedPreferences);
      return true;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          theme: updatedPreferences.theme,
          language: updatedPreferences.language,
          settings: {
            sidebarCollapsed: updatedPreferences.sidebarCollapsed,
            notifications: updatedPreferences.notifications,
            emailNotifications: updatedPreferences.emailNotifications,
          }
        }),
      });
      
      if (response.ok) {
        setPreferences(updatedPreferences);
        return true;
      } else {
        console.error('Failed to update preferences');
        return false;
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Обновление отдельного параметра
  const updatePreference = async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    return updatePreferences({ [key]: value });
  };

  // Сброс настроек к значениям по умолчанию
  const resetPreferences = async () => {
    return updatePreferences(defaultPreferences);
  };

  // Загрузка настроек при монтировании
  useEffect(() => {
    if (!isLoaded && session !== undefined) {
      loadPreferences();
    }
  }, [isLoaded, session]);

  return {
    preferences,
    isLoading,
    isLoaded,
    updatePreferences,
    updatePreference,
    resetPreferences,
    loadPreferences,
  };
}

// Хук для работы с локальными настройками (fallback для случаев, когда API недоступен)
export function useLocalPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    if (typeof window === 'undefined') return defaultPreferences;
    
    try {
      const stored = localStorage.getItem('user-preferences');
      if (stored) {
        return { ...defaultPreferences, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading local preferences:', error);
    }
    
    return defaultPreferences;
  });

  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('user-preferences', JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving local preferences:', error);
      }
    }
  };

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    updatePreferences({ [key]: value });
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user-preferences');
    }
  };

  return {
    preferences,
    updatePreferences,
    updatePreference,
    resetPreferences,
  };
}
