import { Switch as HUISwitch } from '@headlessui/react';

interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { track: 'w-8 h-4', knob: 'w-3 h-3', translate: 'translate-x-4' },
  md: { track: 'w-11 h-6', knob: 'w-5 h-5', translate: 'translate-x-5' },
  lg: { track: 'w-14 h-8', knob: 'w-7 h-7', translate: 'translate-x-6' },
};

export function Switch({ checked, onChange, label, description, disabled, size = 'md' }: SwitchProps) {
  const sz = sizeMap[size];
  const switchEl = (
    <HUISwitch
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className={[
        sz.track,
        'relative inline-flex shrink-0 rounded-full transition-colors',
        'focus:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-400/40',
        checked ? 'bg-accent-600' : 'bg-neutral-300',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      <span
        className={[
          sz.knob,
          'inline-block bg-white rounded-full shadow-elev-1 transform transition-transform duration-fast ease-out-expo',
          'mt-0.5 ml-0.5',
          checked ? sz.translate : 'translate-x-0',
        ].join(' ')}
      />
    </HUISwitch>
  );
  if (!label && !description) return switchEl;
  return (
    <HUISwitch.Group>
      <div className="flex items-center gap-3">
        {switchEl}
        {(label || description) && (
          <HUISwitch.Label className="cursor-pointer">
            {label && <span className="text-sm font-medium text-neutral-800 block">{label}</span>}
            {description && <span className="text-xs text-neutral-500 block">{description}</span>}
          </HUISwitch.Label>
        )}
      </div>
    </HUISwitch.Group>
  );
}
