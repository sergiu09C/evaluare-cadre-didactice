import React from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface FocusTrapProps {
  /**
   * Child elements to render inside the focus trap
   */
  children: React.ReactNode;
  /**
   * Whether the focus trap is enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Optional wrapper element type
   * @default 'div'
   */
  as?: keyof JSX.IntrinsicElements;
}

/**
 * FocusTrap Component
 *
 * Wraps content in a focus trap container that prevents Tab key from
 * escaping the container. Useful for modals, dialogs, and dropdown menus.
 *
 * Features:
 * - Traps Tab and Shift+Tab within the container
 * - Auto-focuses first focusable element on mount
 * - Restores focus to previous element on unmount
 * - Loops focus from last to first element and vice versa
 *
 * @example
 * <FocusTrap enabled={isModalOpen}>
 *   <div role="dialog">
 *     <h2>Modal Title</h2>
 *     <button>Action</button>
 *     <button>Close</button>
 *   </div>
 * </FocusTrap>
 */
export default function FocusTrap({
  children,
  enabled = true,
  className = '',
  as: Component = 'div',
}: FocusTrapProps) {
  const containerRef = useFocusTrap<HTMLElement>(enabled);

  return (
    <Component
      ref={containerRef as React.RefObject<any>}
      className={`${enabled ? 'focus-trap-active' : ''} ${className}`}
    >
      {children}
    </Component>
  );
}
