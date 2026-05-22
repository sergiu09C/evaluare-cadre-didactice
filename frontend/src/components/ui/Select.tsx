import { forwardRef, useId, type SelectHTMLAttributes, type ReactNode } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, id, className = '', wrapperClassName = '', children, ...rest },
  ref,
) {
  const autoId = useId();
  const fid = id || autoId;
  return (
    <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={fid} className="text-[13px] font-medium text-neutral-700">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={fid}
        className={[
          'h-11 px-3 pr-8 rounded-md border bg-white text-sm text-neutral-800 cursor-pointer shadow-elev-1',
          'transition-all duration-fast',
          'focus:outline-none focus:ring-[3px]',
          error ? 'border-danger focus:ring-danger/30 focus:border-danger' : 'border-neutral-200 focus:ring-accent-400/30 focus:border-accent-400',
          'appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%235F6878\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_8px_center] bg-[length:18px]',
          className,
        ].join(' ')}
        {...rest}
      >
        {children}
      </select>
      {(error || hint) && (
        <span className={`text-xs ${error ? 'text-danger-fg' : 'text-neutral-500'}`}>
          {error || hint}
        </span>
      )}
    </div>
  );
});
