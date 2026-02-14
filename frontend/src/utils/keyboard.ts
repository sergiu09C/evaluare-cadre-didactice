/**
 * Keyboard utility constants and helper functions
 * For WCAG 2.1 AAA keyboard accessibility
 */

// Key constants
export const Keys = {
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;

// Number keys for Likert scale
export const NumberKeys = ['1', '2', '3', '4', '5'] as const;

/**
 * Check if a key is a modifier key
 */
export function isModifierKey(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
}

/**
 * Check if a key is a navigation key
 */
export function isNavigationKey(key: string): boolean {
  return [
    Keys.ARROW_UP,
    Keys.ARROW_DOWN,
    Keys.ARROW_LEFT,
    Keys.ARROW_RIGHT,
    Keys.HOME,
    Keys.END,
    Keys.PAGE_UP,
    Keys.PAGE_DOWN,
  ].includes(key);
}

/**
 * Check if the target is an input element where we should not intercept keys
 */
export function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  const isEditable = target.isContentEditable;

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    isEditable
  );
}

/**
 * Prevent default for a specific key
 */
export function preventDefaultForKey(event: KeyboardEvent, key: string): void {
  if (event.key === key) {
    event.preventDefault();
  }
}

/**
 * Check if event matches a keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
}

export function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  return (
    event.key === shortcut.key &&
    event.ctrlKey === !!shortcut.ctrlKey &&
    event.metaKey === !!shortcut.metaKey &&
    event.altKey === !!shortcut.altKey &&
    event.shiftKey === !!shortcut.shiftKey
  );
}

/**
 * Get human-readable representation of a keyboard shortcut
 */
export function getShortcutLabel(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.metaKey) parts.push('⌘');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');

  parts.push(shortcut.key);

  return parts.join('+');
}
