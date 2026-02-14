import React from 'react';

interface SkipLinkProps {
  /**
   * Target element ID to skip to (without #)
   */
  href: string;
  /**
   * Text to display in the skip link
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * SkipLink Component
 *
 * Provides a skip navigation link that is only visible when focused.
 * Follows WCAG 2.1 AAA guidelines for bypass blocks.
 *
 * @example
 * <SkipLink href="#main-content">Sari la conținut principal</SkipLink>
 */
export default function SkipLink({ href, children, className = '' }: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // Ensure href starts with #
    const targetId = href.startsWith('#') ? href.substring(1) : href;
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      // Set tabIndex to -1 to allow programmatic focus
      targetElement.setAttribute('tabindex', '-1');
      targetElement.focus();

      // Scroll to element
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Remove tabIndex after focus (to restore natural tab order)
      setTimeout(() => {
        targetElement.removeAttribute('tabindex');
      }, 100);
    }
  };

  return (
    <a
      href={href.startsWith('#') ? href : `#${href}`}
      onClick={handleClick}
      className={`skip-link ${className}`}
    >
      {children}
    </a>
  );
}
