import { useAccessibility } from '../contexts/AccessibilityContext';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

const THEME_OPTIONS = [
  { value: 'light' as const, label: 'Luminos', Icon: SunIcon },
  { value: 'dark' as const, label: 'Întunecat', Icon: MoonIcon },
  { value: 'system' as const, label: 'Automat', Icon: ComputerDesktopIcon },
] as const;

export default function AccessibilityMenu() {
  const { preferences, updatePreference } = useAccessibility();

  return (
    <div
      className="flex items-center rounded-lg border border-neutral-200 p-0.5 gap-0.5"
      role="group"
      aria-label="Temă de culoare"
    >
      {THEME_OPTIONS.map(({ value, label, Icon }) => {
        const active = preferences.theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => updatePreference('theme', value)}
            aria-pressed={active}
            aria-label={label}
            title={label}
            className={`p-1.5 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 ${
              active
                ? 'bg-accent-600 text-white'
                : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
