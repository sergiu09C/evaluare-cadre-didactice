import React, { useState } from 'react';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import AccessibleModal from '../AccessibleModal';
import ScreenReaderOnly from '../ScreenReaderOnly';

interface KeyboardShortcut {
  keys: string;
  description: string;
  category: 'general' | 'navigation' | 'evaluation' | 'admin';
}

const shortcuts: KeyboardShortcut[] = [
  // General shortcuts
  {
    keys: '?',
    description: 'Afișează lista de comenzi rapide',
    category: 'general',
  },
  {
    keys: 'Esc',
    description: 'Închide dialoguri și meniuri',
    category: 'general',
  },
  {
    keys: 'Alt + H',
    description: 'Mergi la pagina principală',
    category: 'general',
  },
  {
    keys: 'Alt + C',
    description: 'Focalizează conținutul principal',
    category: 'general',
  },

  // Navigation shortcuts
  {
    keys: 'Tab',
    description: 'Navighează la următorul element interactiv',
    category: 'navigation',
  },
  {
    keys: 'Shift + Tab',
    description: 'Navighează la elementul interactiv anterior',
    category: 'navigation',
  },
  {
    keys: '←/→',
    description: 'Navighează între tab-uri și opțiuni orizontale',
    category: 'navigation',
  },
  {
    keys: '↑/↓',
    description: 'Navighează între opțiuni verticale',
    category: 'navigation',
  },
  {
    keys: 'Home',
    description: 'Mergi la primul element dintr-o listă',
    category: 'navigation',
  },
  {
    keys: 'End',
    description: 'Mergi la ultimul element dintr-o listă',
    category: 'navigation',
  },

  // Evaluation form shortcuts
  {
    keys: '1-5',
    description: 'Selectează rapid un nivel pe scala Likert (în formular evaluare)',
    category: 'evaluation',
  },
  {
    keys: 'Space',
    description: 'Activează butoane și checkbox-uri',
    category: 'evaluation',
  },
  {
    keys: 'Enter',
    description: 'Confirmă selecția sau trimite formularul',
    category: 'evaluation',
  },

  // Admin shortcuts
  {
    keys: 'Alt + 1-6',
    description: 'Schimbă rapid între tab-urile din panoul de administrare',
    category: 'admin',
  },
];

const categoryLabels = {
  general: 'Comenzi Generale',
  navigation: 'Navigare',
  evaluation: 'Formular Evaluare',
  admin: 'Panou Administrare',
};

/**
 * KeyboardShortcutsHelp Component
 *
 * Displays a modal with all available keyboard shortcuts organized by category.
 * Opens automatically when user presses '?' key.
 *
 * @example
 * <KeyboardShortcutsHelp />
 */
export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  // Open help modal with '?' key
  useKeyboardShortcut({
    key: '?',
    onShortcut: () => setIsOpen(true),
    skipOnInput: true,
    enabled: true,
  });

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <>
      <AccessibleModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Comenzi Rapide de Tastatură"
        description="Lista completă a comenzilor rapide disponibile în platformă"
        size="lg"
      >
        <div className="space-y-6">
          <ScreenReaderOnly>
            <p>Această fereastră de dialog afișează {shortcuts.length} comenzi rapide organizate în {Object.keys(groupedShortcuts).length} categorii.</p>
          </ScreenReaderOnly>

          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                {categoryLabels[category as keyof typeof categoryLabels]}
              </h3>

              <div className="space-y-2" role="list" aria-label={`${categoryLabels[category as keyof typeof categoryLabels]} - ${categoryShortcuts.length} comenzi`}>
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between gap-4 py-2 px-3 rounded-lg hover:bg-gray-50"
                    role="listitem"
                  >
                    <span className="text-gray-700 flex-1">
                      {shortcut.description}
                    </span>
                    <kbd
                      className="inline-flex items-center px-3 py-1 text-sm font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded-md shadow-sm whitespace-nowrap"
                      aria-label={`Tastă: ${shortcut.keys}`}
                    >
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Notă:</strong> Apasă tasta <kbd className="px-2 py-1 text-xs font-semibold bg-white border border-blue-300 rounded">?</kbd> oricând pentru a afișa din nou această listă.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Închide (Esc)
          </button>
        </div>
      </AccessibleModal>
    </>
  );
}

/**
 * KeyboardShortcutsButton Component
 *
 * A button to manually trigger the keyboard shortcuts help modal.
 * Useful for adding to help menus or toolbars.
 *
 * @example
 * <KeyboardShortcutsButton />
 */
export function KeyboardShortcutsButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Afișează comenzi rapide de tastatură"
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
        <span>Comenzi Tastatură</span>
        <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-300 rounded">
          ?
        </kbd>
      </button>

      <AccessibleModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Comenzi Rapide de Tastatură"
        description="Lista completă a comenzilor rapide disponibile în platformă"
        size="lg"
      >
        <div className="space-y-6">
          {Object.entries(
            shortcuts.reduce((acc, shortcut) => {
              if (!acc[shortcut.category]) {
                acc[shortcut.category] = [];
              }
              acc[shortcut.category].push(shortcut);
              return acc;
            }, {} as Record<string, KeyboardShortcut[]>)
          ).map(([category, categoryShortcuts]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                {categoryLabels[category as keyof typeof categoryLabels]}
              </h3>

              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between gap-4 py-2 px-3 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-gray-700 flex-1">
                      {shortcut.description}
                    </span>
                    <kbd className="inline-flex items-center px-3 py-1 text-sm font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded-md shadow-sm whitespace-nowrap">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Închide
          </button>
        </div>
      </AccessibleModal>
    </>
  );
}
