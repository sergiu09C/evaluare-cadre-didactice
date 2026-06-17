import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import type { AccessibilityPreferences, AccessibilityContextType } from '../types';

const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  theme: 'light',
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  // Load from localStorage immediately
  useEffect(() => {
    const saved = localStorage.getItem('accessibility_preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged = { ...DEFAULT_PREFERENCES, ...parsed };
        setPreferences(merged);
        applyPreferences(merged);
      } catch {
        // ignore malformed storage
      }
    }
    setLoading(false);
  }, []);

  // Sync with backend on login
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) syncWithBackend();
  }, []);

  // React to system theme changes when theme is "system"
  useEffect(() => {
    if (preferences.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyPreferences(preferences);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preferences.theme]);

  const applyPreferences = (prefs: AccessibilityPreferences) => {
    const root = document.documentElement;
    let effectiveTheme = prefs.theme;
    if (prefs.theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    root.setAttribute('data-theme', effectiveTheme);
    // Clasa .dark pe <html> pentru Tailwind darkMode: 'class'
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const syncWithBackend = async () => {
    try {
      const response = await api.getUserPreferences();
      if (response.preferences) {
        const merged = { ...DEFAULT_PREFERENCES, ...response.preferences };
        setPreferences(merged);
        localStorage.setItem('accessibility_preferences', JSON.stringify(merged));
        applyPreferences(merged);
      }
    } catch {
      // non-blocking
    }
  };

  const updatePreference = async <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    localStorage.setItem('accessibility_preferences', JSON.stringify(updated));
    applyPreferences(updated);

    const token = localStorage.getItem('token');
    if (token) {
      try {
        await api.updateUserPreferences({ [key]: value });
      } catch {
        // non-blocking
      }
    }
  };

  const resetToDefaults = async () => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.setItem('accessibility_preferences', JSON.stringify(DEFAULT_PREFERENCES));
    applyPreferences(DEFAULT_PREFERENCES);

    const token = localStorage.getItem('token');
    if (token) {
      try {
        await api.updateUserPreferences(DEFAULT_PREFERENCES);
      } catch {
        // non-blocking
      }
    }
  };

  return (
    <AccessibilityContext.Provider value={{ preferences, loading, updatePreference, resetToDefaults, syncWithBackend }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility must be used within an AccessibilityProvider');
  return context;
}
