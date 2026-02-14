import { useEffect, useRef } from 'react';
import { getFocusableElements } from '../utils/focusManagement';

/**
 * Hook for trapping focus within a container (e.g., modals)
 * Automatically handles Tab/Shift+Tab navigation
 * Restores focus when component unmounts
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  enabled: boolean = true
): React.RefObject<T> {
  const containerRef = useRef<T>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    // Save the currently focused element
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;

    // Focus the first focusable element in the container
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
      // Small delay to ensure the container is rendered
      setTimeout(() => {
        focusableElements[0]?.focus();
      }, 10);
    }

    // Handle Tab key to trap focus
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements(container);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab - move to previous element
        if (activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab - move to next element
        if (activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus to the previous element
      if (previousActiveElementRef.current && document.body.contains(previousActiveElementRef.current)) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [enabled]);

  return containerRef;
}

export default useFocusTrap;
