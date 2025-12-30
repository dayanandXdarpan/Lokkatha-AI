/**
 * Theme Store - Manages state-wise cultural themes
 * Automatically switches theme based on user's selected state
 * Supports manual override via settings
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { settings } from './settings';
import { getThemeForState, STATE_THEMES, type StateTheme } from '$lib/themes/stateThemes';

export interface ThemePreferences {
  autoTheme: boolean; // Auto-switch based on state
  manualThemeId: string | null; // Manual override theme
}

const THEME_STORAGE_KEY = 'lokkatha_theme_prefs';

// Load theme preferences from localStorage
function loadThemePreferences(): ThemePreferences {
  if (!browser) {
    return {
      autoTheme: true,
      manualThemeId: null,
    };
  }

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        autoTheme: parsed.autoTheme ?? true,
        manualThemeId: parsed.manualThemeId ?? null,
      };
    }
  } catch (error) {
    console.error('Failed to load theme preferences:', error);
  }

  return {
    autoTheme: true,
    manualThemeId: null,
  };
}

// Create theme preferences store
function createThemePreferencesStore() {
  const { subscribe, set, update } = writable<ThemePreferences>(loadThemePreferences());

  return {
    subscribe,
    set: (value: ThemePreferences) => {
      if (browser) {
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(value));
      }
      set(value);
    },
    update: (fn: (prefs: ThemePreferences) => ThemePreferences) => {
      update((prefs) => {
        const updated = fn(prefs);
        if (browser) {
          localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(updated));
        }
        return updated;
      });
    },

    // Helper methods
    enableAutoTheme: () => {
      update((prefs) => ({ ...prefs, autoTheme: true }));
    },

    disableAutoTheme: () => {
      update((prefs) => ({ ...prefs, autoTheme: false }));
    },

    setManualTheme: (themeId: string) => {
      update((prefs) => ({
        ...prefs,
        autoTheme: false,
        manualThemeId: themeId,
      }));
    },

    clearManualTheme: () => {
      update((prefs) => ({
        ...prefs,
        autoTheme: true,
        manualThemeId: null,
      }));
    },
  };
}

export const themePreferences = createThemePreferencesStore();

/**
 * Current active theme - derived from settings and theme preferences
 * Automatically switches based on state selection or manual override
 */
export const currentTheme = derived(
  [settings, themePreferences],
  ([$settings, $themePrefs]) => {
    // Manual override takes precedence
    if (!$themePrefs.autoTheme && $themePrefs.manualThemeId) {
      return STATE_THEMES[$themePrefs.manualThemeId] || STATE_THEMES.default;
    }

    // Auto theme based on selected state
    if ($settings.state) {
      return getThemeForState($settings.state);
    }

    // Default theme
    return STATE_THEMES.default;
  }
);

/**
 * Apply theme to document root
 * Sets CSS custom properties for colors, patterns, etc.
 */
export function applyTheme(theme: StateTheme) {
  if (!browser) return;

  const root = document.documentElement;

  // Apply color variables
  root.style.setProperty('--primary', theme.colors.primary);
  root.style.setProperty('--primary-dark', theme.colors.primaryDark);
  root.style.setProperty('--secondary', theme.colors.secondary);
  root.style.setProperty('--accent', theme.colors.accent);
  root.style.setProperty('--bg', theme.colors.bg);
  root.style.setProperty('--bg-secondary', theme.colors.bgSecondary);
  root.style.setProperty('--text', theme.colors.text);
  root.style.setProperty('--text-secondary', theme.colors.textSecondary);

  // Apply pattern class
  if (theme.pattern) {
    root.setAttribute('data-pattern', theme.pattern);
  } else {
    root.removeAttribute('data-pattern');
  }

  // Apply border style
  if (theme.borderStyle) {
    root.setAttribute('data-border-style', theme.borderStyle);
  } else {
    root.removeAttribute('data-border-style');
  }

  // Apply custom font if specified
  if (theme.font) {
    root.style.setProperty('--theme-font', theme.font);
  } else {
    root.style.removeProperty('--theme-font');
  }

  // Store theme metadata as data attributes
  root.setAttribute('data-theme-id', theme.id);
  root.setAttribute('data-theme-name', theme.name);
  root.setAttribute('data-art-form', theme.artForm);
}

/**
 * Get theme illustration for welcome card
 */
export function getThemeIllustration(theme: StateTheme): string {
  return theme.illustration;
}

/**
 * Get theme description
 */
export function getThemeDescription(theme: StateTheme): string {
  return theme.description;
}

/**
 * Theme change notification
 * Shows a brief message when theme changes
 */
export function notifyThemeChange(theme: StateTheme) {
  if (!browser) return;

  const message = `Theme: ${theme.displayName}`;
  console.log('🎨', message, '-', theme.description);

  // You can integrate with your notification system here
  // For now, just log to console
}

/**
 * Check if current theme is dark
 */
export const isDarkTheme = derived(currentTheme, ($theme) => {
  // Check if background is dark based on RGB values
  const bg = $theme.colors.bg;
  if (bg.startsWith('#')) {
    const r = parseInt(bg.slice(1, 3), 16);
    const g = parseInt(bg.slice(3, 5), 16);
    const b = parseInt(bg.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  }
  return false;
});

/**
 * Get contrast color for text (black or white) based on background
 */
export function getContrastColor(backgroundColor: string): string {
  if (!backgroundColor.startsWith('#')) return '#000000';

  const r = parseInt(backgroundColor.slice(1, 3), 16);
  const g = parseInt(backgroundColor.slice(3, 5), 16);
  const b = parseInt(backgroundColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Generate gradient background for header
 */
export function getThemeGradient(theme: StateTheme): string {
  return `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%)`;
}

/**
 * Get theme-specific pattern CSS
 */
export function getPatternCSS(patternName: string): string {
  const patterns: Record<string, string> = {
    chikankari: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M20 5 L25 15 L35 15 L27 22 L30 32 L20 25 L10 32 L13 22 L5 15 L15 15 Z\' fill=\'%23f0f0f0\' opacity=\'0.1\'/%3E%3C/svg%3E")',
    madhubani: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'20\' fill=\'none\' stroke=\'%23f0f0f0\' stroke-width=\'2\' opacity=\'0.1\'/%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'10\' fill=\'none\' stroke=\'%23f0f0f0\' stroke-width=\'1\' opacity=\'0.1\'/%3E%3C/svg%3E")',
    warli: 'url("data:image/svg+xml,%3Csvg width=\'50\' height=\'50\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'25\' cy=\'10\' r=\'3\' fill=\'%23f0f0f0\' opacity=\'0.1\'/%3E%3Cline x1=\'25\' y1=\'13\' x2=\'25\' y2=\'25\' stroke=\'%23f0f0f0\' stroke-width=\'1\' opacity=\'0.1\'/%3E%3C/svg%3E")',
    kolam: 'url("data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M40 10 L50 30 L70 40 L50 50 L40 70 L30 50 L10 40 L30 30 Z\' fill=\'none\' stroke=\'%23f0f0f0\' stroke-width=\'2\' opacity=\'0.1\'/%3E%3C/svg%3E")',
    geometric: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)',
    // Add more patterns as needed
  };

  return patterns[patternName] || 'none';
}

/**
 * Export all themes for settings page
 */
export const allThemes = getAllThemes();

function getAllThemes() {
  return Object.values(STATE_THEMES);
}
