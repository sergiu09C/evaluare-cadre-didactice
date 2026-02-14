import { useEffect, RefObject } from 'react';
import { Keys } from '../utils/keyboard';

interface UseTabNavigationOptions {
  /**
   * Reference to the tablist container
   */
  tablistRef: RefObject<HTMLElement>;
  /**
   * Currently active tab index
   */
  activeTabIndex: number;
  /**
   * Callback when tab should change
   */
  onTabChange: (index: number) => void;
  /**
   * Whether navigation is enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Whether to loop back to start/end
   * @default true
   */
  loop?: boolean;
}

/**
 * Hook for tab navigation with arrow keys
 * Follows ARIA Authoring Practices Guide for tabs
 * - Arrow keys navigate between tabs
 * - Home/End keys jump to first/last tab
 * - Tab key moves focus out of tablist
 *
 * @example
 * const tablistRef = useRef<HTMLDivElement>(null);
 * useTabNavigation({
 *   tablistRef,
 *   activeTabIndex: 0,
 *   onTabChange: (index) => setActiveTab(index),
 * });
 */
export function useTabNavigation(options: UseTabNavigationOptions): void {
  const {
    tablistRef,
    activeTabIndex,
    onTabChange,
    enabled = true,
    loop = true,
  } = options;

  useEffect(() => {
    if (!enabled || !tablistRef.current) return;

    const tablist = tablistRef.current;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Get all tab buttons
      const tabs = Array.from(
        tablist.querySelectorAll<HTMLElement>('[role="tab"]')
      );

      if (tabs.length === 0) return;

      const currentIndex = tabs.findIndex((tab) => tab === event.target);
      if (currentIndex === -1) return;

      let newIndex = currentIndex;

      switch (event.key) {
        case Keys.ARROW_LEFT:
        case Keys.ARROW_UP:
          event.preventDefault();
          newIndex = currentIndex - 1;
          if (newIndex < 0) {
            newIndex = loop ? tabs.length - 1 : 0;
          }
          break;

        case Keys.ARROW_RIGHT:
        case Keys.ARROW_DOWN:
          event.preventDefault();
          newIndex = currentIndex + 1;
          if (newIndex >= tabs.length) {
            newIndex = loop ? 0 : tabs.length - 1;
          }
          break;

        case Keys.HOME:
          event.preventDefault();
          newIndex = 0;
          break;

        case Keys.END:
          event.preventDefault();
          newIndex = tabs.length - 1;
          break;

        default:
          return;
      }

      // Focus the new tab and trigger change
      if (newIndex !== currentIndex) {
        tabs[newIndex].focus();
        onTabChange(newIndex);
      }
    };

    tablist.addEventListener('keydown', handleKeyDown as EventListener);

    return () => {
      tablist.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [tablistRef, activeTabIndex, onTabChange, enabled, loop]);
}

export default useTabNavigation;
