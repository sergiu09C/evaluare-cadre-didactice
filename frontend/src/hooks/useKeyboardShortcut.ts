import { useEffect, useCallback } from 'react';
import { isInputElement, matchesShortcut, type KeyboardShortcut } from '../utils/keyboard';

interface UseKeyboardShortcutOptions extends KeyboardShortcut {
  /**
   * Callback function when shortcut is triggered
   */
  onShortcut: (event: KeyboardEvent) => void;
  /**
   * Whether to prevent default behavior
   * @default true
   */
  preventDefault?: boolean;
  /**
   * Whether the shortcut is enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Whether to skip the shortcut when focused on input elements
   * @default true (except for Escape key)
   */
  skipOnInput?: boolean;
}

/**
 * Hook for registering global keyboard shortcuts
 *
 * @example
 * useKeyboardShortcut({
 *   key: 'k',
 *   ctrlKey: true,
 *   onShortcut: () => console.log('Ctrl+K pressed'),
 * });
 */
export function useKeyboardShortcut(options: UseKeyboardShortcutOptions): void {
  const {
    onShortcut,
    preventDefault = true,
    enabled = true,
    skipOnInput = true,
    ...shortcut
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Skip if focused on input element (except for Escape key)
      if (skipOnInput && shortcut.key !== 'Escape' && isInputElement(event.target)) {
        return;
      }

      // Check if the shortcut matches
      if (matchesShortcut(event, shortcut)) {
        if (preventDefault) {
          event.preventDefault();
        }
        onShortcut(event);
      }
    },
    [enabled, onShortcut, preventDefault, skipOnInput, shortcut]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

export default useKeyboardShortcut;
