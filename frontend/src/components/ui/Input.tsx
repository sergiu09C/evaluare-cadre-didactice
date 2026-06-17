import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, prefix, suffix, error, hint, id, className = '', wrapperClassName = '', ...rest },
  ref,
) {
  const autoId = useId();
  const fid = id || autoId;
  const descId = error || hint ? `${fid}-desc` : undefined;
  return (
    <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={fid} className="text-[13px] font-medium text-neutral-700 dark:text-[#A6BCD3]">
          {label}
        </label>
      )}
      <div
        className={[
          'flex items-center bg-white rounded-md px-3 h-11 shadow-elev-1 border',
          'dark:bg-[#162638] dark:shadow-none',
          'transition-all duration-fast',
          error
            ? 'border-danger focus-within:border-danger'
            : 'border-neutral-200 focus-within:border-accent-400 dark:border-[rgba(124,58,237,0.25)] dark:focus-within:border-[rgba(124,58,237,0.6)]',
          'focus-within:ring-[3px]',
          error ? 'focus-within:ring-danger/30' : 'focus-within:ring-accent-400/30 dark:focus-within:ring-[rgba(124,58,237,0.2)]',
        ].join(' ')}
      >
        {prefix && <span className="w-[18px] h-[18px] text-neutral-400 dark:text-[#5C7896] mr-2 inline-flex shrink-0">{prefix}</span>}
        <input
          ref={ref}
          id={fid}
          aria-invalid={error ? true : undefined}
          aria-describedby={descId}
          className={`flex-1 border-0 outline-none bg-transparent text-sm text-neutral-800 dark:text-[#E8EFF6] placeholder:text-neutral-400 dark:placeholder:text-[#5C7896] min-w-0 ${className}`}
          {...rest}
        />
        {suffix && <span className="w-[18px] h-[18px] text-neutral-400 dark:text-[#5C7896] ml-2 inline-flex shrink-0">{suffix}</span>}
      </div>
      {(error || hint) && (
        <span id={descId} className={`text-xs ${error ? 'text-danger-fg' : 'text-neutral-500'}`}>
          {error || hint}
        </span>
      )}
    </div>
  );
});
