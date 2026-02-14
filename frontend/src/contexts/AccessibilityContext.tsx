import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import type { AccessibilityPreferences, AccessibilityContextType } from '../types';

const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  fontSize: 'normal',
  highContrast: false,
  reduceMotion: false,
  theme: 'light',
  dyslexiaFont: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  // 1. Load from localStorage immediately (fast)
  useEffect(() => {
    const saved = localStorage.getItem('accessibility_preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
        applyPreferences(parsed);
      } catch (error) {
        console.error('Failed to parse accessibility preferences:', error);
      }
    }
    setLoading(false);
  }, []);

  // 2. Sync with backend (authenticated users only)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      syncWithBackend();
    }
  }, []);

  // 3. Listen for system theme changes (when theme is "system")
  useEffect(() => {
    if (preferences.theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      applyPreferences(preferences);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [preferences.theme]);

  // 3. Apply preferences to DOM
  const applyPreferences = (prefs: AccessibilityPreferences) => {
    const root = document.documentElement;

    // Font size
    root.setAttribute('data-font-size', prefs.fontSize);

    // High contrast
    root.setAttribute('data-high-contrast', prefs.highContrast.toString());

    // Theme - handle "system" by detecting OS preference
    let effectiveTheme = prefs.theme;
    if (prefs.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = prefersDark ? 'dark' : 'light';
    }
    root.setAttribute('data-theme', effectiveTheme);

    // Dyslexia font
    root.setAttribute('data-dyslexia-font', prefs.dyslexiaFont.toString());

    // Reduce motion (also handled by CSS @media)
    if (prefs.reduceMotion) {
      root.style.setProperty('--animation-duration', '0.01ms');
    } else {
      root.style.removeProperty('--animation-duration');
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
    } catch (error) {
      console.error('Failed to sync preferences with backend:', error);
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

    // Sync with backend (non-blocking)
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await api.updateUserPreferences({ [key]: value });
      } catch (error) {
        console.error('Failed to save preferences to backend:', error);
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
      } catch (error) {
        console.error('Failed to reset preferences on backend:', error);
      }
    }
  };

  const value: AccessibilityContextType = {
    preferences,
    loading,
    updatePreference,
    resetToDefaults,
    syncWithBackend,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
