import { ReactNode } from 'react';

interface ScreenReaderOnlyProps extends React.HTMLAttributes<HTMLElement> {
  children: ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Component that renders content visible only to screen readers
 * Uses the sr-only class for proper accessibility
 */
export default function ScreenReaderOnly({
  children,
  as: Component = 'span',
  className,
  ...rest
}: ScreenReaderOnlyProps) {
  return <Component className={`sr-only ${className || ''}`} {...rest}>{children}</Component>;
}
