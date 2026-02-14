/**
 * Focus management utilities for keyboard navigation
 * Helps manage focus for accessibility
 */

/**
 * Selector for focusable elements
 */
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];

  const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  return Array.from(elements).filter((el) => {
    // Filter out hidden elements
    return el.offsetParent !== null && !el.hasAttribute('hidden');
  });
}

/**
 * Get the first focusable element in a container
 */
export function getFirstFocusableElement(container: HTMLElement | null): HTMLElement | null {
  const elements = getFocusableElements(container);
  return elements[0] || null;
}

/**
 * Get the last focusable element in a container
 */
export function getLastFocusableElement(container: HTMLElement | null): HTMLElement | null {
  const elements = getFocusableElements(container);
  return elements[elements.length - 1] || null;
}

/**
 * Move focus to the first focusable element
 */
export function moveFocusToFirstElement(container: HTMLElement | null): void {
  const firstElement = getFirstFocusableElement(container);
  if (firstElement) {
    firstElement.focus();
  }
}

/**
 * Move focus to the last focusable element
 */
export function moveFocusToLastElement(container: HTMLElement | null): void {
  const lastElement = getLastFocusableElement(container);
  if (lastElement) {
    lastElement.focus();
  }
}

/**
 * Save the currently focused element
 */
let savedFocusElement: HTMLElement | null = null;

export function saveFocus(): void {
  savedFocusElement = document.activeElement as HTMLElement;
}

/**
 * Restore focus to the previously saved element
 */
export function restoreFocus(fallbackElement?: HTMLElement | null): void {
  if (savedFocusElement && document.body.contains(savedFocusElement)) {
    savedFocusElement.focus();
    savedFocusElement = null;
  } else if (fallbackElement) {
    fallbackElement.focus();
  }
}

/**
 * Get the next focusable element in a list
 */
export function getNextFocusableElement(
  elements: HTMLElement[],
  currentElement: HTMLElement,
  loop: boolean = false
): HTMLElement | null {
  const currentIndex = elements.indexOf(currentElement);
  if (currentIndex === -1) return elements[0] || null;

  const nextIndex = currentIndex + 1;
  if (nextIndex < elements.length) {
    return elements[nextIndex];
  }

  return loop ? elements[0] : null;
}

/**
 * Get the previous focusable element in a list
 */
export function getPreviousFocusableElement(
  elements: HTMLElement[],
  currentElement: HTMLElement,
  loop: boolean = false
): HTMLElement | null {
  const currentIndex = elements.indexOf(currentElement);
  if (currentIndex === -1) return elements[elements.length - 1] || null;

  const prevIndex = currentIndex - 1;
  if (prevIndex >= 0) {
    return elements[prevIndex];
  }

  return loop ? elements[elements.length - 1] : null;
}

/**
 * Check if an element is visible and focusable
 */
export function isElementFocusable(element: HTMLElement): boolean {
  if (element.hasAttribute('hidden')) return false;
  if (element.offsetParent === null) return false;
  if (element.hasAttribute('disabled')) return false;
  if (element.getAttribute('tabindex') === '-1') return false;

  return true;
}

/**
 * Focus the element with a specific data attribute value
 */
export function focusElementByDataAttribute(
  container: HTMLElement,
  attribute: string,
  value: string
): boolean {
  const element = container.querySelector<HTMLElement>(`[data-${attribute}="${value}"]`);
  if (element && isElementFocusable(element)) {
    element.focus();
    return true;
  }
  return false;
}

/**
 * Create a focus trap within a container
 * Returns a cleanup function
 */
export function createFocusTrap(container: HTMLElement): () => void {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const focusableElements = getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      // Shift + Tab
      if (activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  // Focus first element when trap is created
  moveFocusToFirstElement(container);

  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}
