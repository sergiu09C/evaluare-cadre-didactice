import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] rounded-md',
  md: 'h-10 px-4 text-sm rounded-md',
  lg: 'h-12 px-5 text-[15px] rounded-lg',
};

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary-800 text-white shadow-elev-1 hover:bg-primary-700 active:bg-primary-900',
  accent:
    'bg-accent-600 text-white shadow-elev-2 hover:bg-accent-700 active:bg-accent-800',
  secondary:
    'bg-white text-neutral-800 border border-neutral-200 shadow-elev-1 hover:bg-neutral-50 active:bg-neutral-100',
  ghost:
    'bg-transparent text-neutral-800 hover:bg-neutral-100 active:bg-neutral-200',
  destructive:
    'bg-danger text-white hover:bg-red-600 active:bg-red-700',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, iconRight, loading, disabled, children, className = '', ...rest },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap select-none',
        'transition-all duration-fast ease-out-expo',
        'focus:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-400/40 focus-visible:ring-offset-1',
        'hover:-translate-y-px active:translate-y-0',
        isDisabled ? 'opacity-55 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
        sizeClasses[size],
        variantClasses[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <span
          className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
          aria-hidden="true"
        />
      ) : icon ? (
        <span className="inline-flex w-4 h-4 shrink-0" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
      {iconRight && (
        <span className="inline-flex w-4 h-4 shrink-0" aria-hidden="true">
          {iconRight}
        </span>
      )}
    </button>
  );
});
