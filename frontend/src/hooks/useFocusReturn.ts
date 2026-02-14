import { useEffect, useRef } from 'react';

/**
 * Hook for saving and restoring focus
 * Useful for modals, dialogs, and other temporary UI elements
 */
export function useFocusReturn(enabled: boolean = true): void {
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Save the currently focused element
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Cleanup function - restore focus
    return () => {
      if (
        previousActiveElementRef.current &&
        document.body.contains(previousActiveElementRef.current)
      ) {
        // Small delay to ensure the DOM is ready
        setTimeout(() => {
          previousActiveElementRef.current?.focus();
        }, 10);
      }
    };
  }, [enabled]);
}

export default useFocusReturn;
