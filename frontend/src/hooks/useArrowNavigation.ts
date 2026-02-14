import { useEffect, RefObject } from 'react';
import { Keys } from '../utils/keyboard';
import { getFocusableElements } from '../utils/focusManagement';

interface UseArrowNavigationOptions {
  /**
   * Reference to the container element
   */
  containerRef: RefObject<HTMLElement>;
  /**
   * Direction of navigation
   */
  direction: 'horizontal' | 'vertical' | 'grid';
  /**
   * CSS selector for navigable items
   * @default - all focusable elements
   */
  itemSelector?: string;
  /**
   * Whether navigation is enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Whether to loop back to the start/end
   * @default false
   */
  loop?: boolean;
  /**
   * Whether to handle Home/End keys
   * @default true
   */
  handleHomeEnd?: boolean;
  /**
   * Number of columns in grid layout (required for grid direction)
   */
  columns?: number;
}

/**
 * Hook for arrow key navigation
 * Supports horizontal, vertical, and grid navigation patterns
 *
 * @example
 * const containerRef = useRef<HTMLDivElement>(null);
 * useArrowNavigation({
 *   containerRef,
 *   direction: 'horizontal',
 *   loop: true,
 * });
 */
export function useArrowNavigation(options: UseArrowNavigationOptions): void {
  const {
    containerRef,
    direction,
    itemSelector,
    enabled = true,
    loop = false,
    handleHomeEnd = true,
    columns,
  } = options;

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      // Get all navigable items
      const items = itemSelector
        ? Array.from(container.querySelectorAll<HTMLElement>(itemSelector))
        : getFocusableElements(container);

      if (items.length === 0) return;

      // Find current item index
      const currentIndex = items.indexOf(target);
      if (currentIndex === -1) return;

      let newIndex = currentIndex;

      switch (direction) {
        case 'horizontal':
          if (event.key === Keys.ARROW_LEFT) {
            event.preventDefault();
            newIndex = currentIndex - 1;
            if (newIndex < 0) {
              newIndex = loop ? items.length - 1 : 0;
            }
          } else if (event.key === Keys.ARROW_RIGHT) {
            event.preventDefault();
            newIndex = currentIndex + 1;
            if (newIndex >= items.length) {
              newIndex = loop ? 0 : items.length - 1;
            }
          }
          break;

        case 'vertical':
          if (event.key === Keys.ARROW_UP) {
            event.preventDefault();
            newIndex = currentIndex - 1;
            if (newIndex < 0) {
              newIndex = loop ? items.length - 1 : 0;
            }
          } else if (event.key === Keys.ARROW_DOWN) {
            event.preventDefault();
            newIndex = currentIndex + 1;
            if (newIndex >= items.length) {
              newIndex = loop ? 0 : items.length - 1;
            }
          }
          break;

        case 'grid':
          if (!columns) {
            console.warn('useArrowNavigation: columns parameter is required for grid direction');
            return;
          }

          if (event.key === Keys.ARROW_LEFT) {
            event.preventDefault();
            newIndex = currentIndex - 1;
            if (newIndex < 0) {
              newIndex = loop ? items.length - 1 : 0;
            }
          } else if (event.key === Keys.ARROW_RIGHT) {
            event.preventDefault();
            newIndex = currentIndex + 1;
            if (newIndex >= items.length) {
              newIndex = loop ? 0 : items.length - 1;
            }
          } else if (event.key === Keys.ARROW_UP) {
            event.preventDefault();
            newIndex = currentIndex - columns;
            if (newIndex < 0) {
              newIndex = loop ? items.length + newIndex : currentIndex;
            }
          } else if (event.key === Keys.ARROW_DOWN) {
            event.preventDefault();
            newIndex = currentIndex + columns;
            if (newIndex >= items.length) {
              newIndex = loop ? newIndex - items.length : currentIndex;
            }
          }
          break;
      }

      // Handle Home/End keys
      if (handleHomeEnd) {
        if (event.key === Keys.HOME) {
          event.preventDefault();
          newIndex = 0;
        } else if (event.key === Keys.END) {
          event.preventDefault();
          newIndex = items.length - 1;
        }
      }

      // Focus the new item
      if (newIndex !== currentIndex && items[newIndex]) {
        items[newIndex].focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown as EventListener);

    return () => {
      container.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [containerRef, direction, itemSelector, enabled, loop, handleHomeEnd, columns]);
}

export default useArrowNavigation;
