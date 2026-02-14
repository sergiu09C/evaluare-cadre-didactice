import React, { Fragment } from 'react';
import { Menu, Transition, Switch } from '@headlessui/react';
import { useAccessibility } from '../contexts/AccessibilityContext';

export default function AccessibilityMenu() {
  const { preferences, updatePreference } = useAccessibility();

  const fontSizeOptions = [
    { value: 'small', label: 'Mic (87.5%)' },
    { value: 'normal', label: 'Normal (100%)' },
    { value: 'large', label: 'Mare (112.5%)' },
    { value: 'extra-large', label: 'Extra Mare (125%)' },
  ] as const;

  const themeOptions = [
    { value: 'light', label: 'Luminos' },
    { value: 'dark', label: 'Întunecat' },
    { value: 'system', label: 'Sistem' },
  ] as const;

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
        aria-label="Meniu accesibilitate"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
        <span>Accesibilitate</span>
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-80 origin-top-right bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Setări Accesibilitate
            </h3>

            {/* Font Size */}
            <div>
              <label className="label" htmlFor="font-size-select">
                Dimensiune Text
              </label>
              <select
                id="font-size-select"
                className="input"
                value={preferences.fontSize}
                onChange={(e) =>
                  updatePreference('fontSize', e.target.value as any)
                }
              >
                {fontSizeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Theme */}
            <div>
              <label className="label" htmlFor="theme-select">
                Temă
              </label>
              <select
                id="theme-select"
                className="input"
                value={preferences.theme}
                onChange={(e) =>
                  updatePreference('theme', e.target.value as any)
                }
              >
                {themeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* High Contrast Toggle */}
            <SwitchField
              label="Contrast Ridicat"
              description="Mărește contrastul culorilor pentru vizibilitate îmbunătățită"
              checked={preferences.highContrast}
              onChange={(checked) => updatePreference('highContrast', checked)}
            />

            {/* Reduce Motion Toggle */}
            <SwitchField
              label="Reducere Animații"
              description="Dezactivează animațiile și tranzițiile"
              checked={preferences.reduceMotion}
              onChange={(checked) => updatePreference('reduceMotion', checked)}
            />

            {/* Dyslexia Font Toggle */}
            <SwitchField
              label="Font pentru Dislexie"
              description="Folosește un font special pentru persoane cu dislexie"
              checked={preferences.dyslexiaFont}
              onChange={(checked) => updatePreference('dyslexiaFont', checked)}
            />
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

// Helper component for Switch fields
function SwitchField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start">
      <div className="flex-1 min-w-0">
        <label className="label mb-0">{label}</label>
        <p className="text-xs text-gray-500 mt-0.5">
          {description}
        </p>
      </div>
      <Switch
        checked={checked}
        onChange={onChange}
        className={`${
          checked ? 'bg-primary-600' : 'bg-gray-300'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ml-3`}
        aria-label={label}
      >
        <span
          className={`${
            checked ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
      </Switch>
    </div>
  );
}
