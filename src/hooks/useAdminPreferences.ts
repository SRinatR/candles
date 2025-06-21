'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface AdminPreferences {
  theme: 'light' | 'dark';
  language: 'en' | 'ru';
}

interface UseAdminPreferencesReturn {
  preferences: AdminPreferences | null;
  isLoading: boolean;
  updateTheme: (theme: 'light' | 'dark') => Promise<void>;
  updateLanguage: (language: 'en' | 'ru') => Promise<void>;
  updatePreferences: (preferences: Partial<AdminPreferences>) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAdminPreferences(): UseAdminPreferencesReturn {
  const { data: session, status } = useSession();
  const [preferences, setPreferences] = useState<AdminPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/preferences');
      
      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }

      const data = await response.json();
      setPreferences(data);
      
      // Применяем тему к документу
      if (data.theme) {
        document.documentElement.classList.toggle('dark', data.theme === 'dark');
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      // Fallback к значениям по умолчанию
      setPreferences({
        theme: 'light',
        language: 'en',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, status]);

  const updatePreferences = useCallback(async (updates: Partial<AdminPreferences>) => {
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch('/api/admin/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      // Обновляем локальное состояние
      setPreferences(prev => prev ? { ...prev, ...updates } : null);
      
      // Применяем тему к документу если она обновилась
      if (updates.theme) {
        document.documentElement.classList.toggle('dark', updates.theme === 'dark');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }, [session]);

  const updateTheme = useCallback(async (theme: 'light' | 'dark') => {
    await updatePreferences({ theme });
  }, [updatePreferences]);

  const updateLanguage = useCallback(async (language: 'en' | 'ru') => {
    await updatePreferences({ language });
  }, [updatePreferences]);

  const refetch = useCallback(async () => {
    await fetchPreferences();
  }, [fetchPreferences]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    isLoading,
    updateTheme,
    updateLanguage,
    updatePreferences,
    refetch,
  };
}