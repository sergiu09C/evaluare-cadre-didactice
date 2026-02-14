import React, { ReactNode } from 'react';

interface LiveRegionProps {
  children: ReactNode;
  /**
   * - 'polite': Announces when current speech finishes (default)
   * - 'assertive': Interrupts current speech immediately
   * - 'off': No announcement
   */
  politeness?: 'polite' | 'assertive' | 'off';
  /**
   * - 'status': For status messages (default, implies polite)
   * - 'alert': For important messages (implies assertive)
   * - 'log': For log-style messages
   */
  role?: 'status' | 'alert' | 'log';
  /**
   * Whether to make the region visible (default: false, screen reader only)
   */
  visible?: boolean;
  className?: string;
}

/**
 * Live Region component for announcing dynamic content changes to screen readers
 * Use for success messages, errors, loading states, etc.
 */
export default function LiveRegion({
  children,
  politeness = 'polite',
  role = 'status',
  visible = false,
  className = '',
}: LiveRegionProps) {
  const baseClass = visible ? '' : 'sr-only';
  const combinedClass = `${baseClass} ${className}`.trim();

  return (
    <div
      role={role}
      aria-live={politeness}
      aria-atomic="true"
      className={combinedClass}
    >
      {children}
    </div>
  );
}

// Convenience components for common use cases

interface NotificationProps {
  message: string;
  visible?: boolean;
  className?: string;
}

export function SuccessNotification({ message, visible, className }: NotificationProps) {
  return (
    <LiveRegion politeness="polite" role="status" visible={visible} className={className}>
      {message}
    </LiveRegion>
  );
}

export function ErrorNotification({ message, visible, className }: NotificationProps) {
  return (
    <LiveRegion politeness="assertive" role="alert" visible={visible} className={className}>
      {message}
    </LiveRegion>
  );
}

export function LoadingAnnouncement({ message, visible, className }: NotificationProps) {
  return (
    <LiveRegion politeness="polite" role="status" visible={visible} className={className}>
      {message}
    </LiveRegion>
  );
}
