import { useRef, KeyboardEvent } from 'react';
import { useArrowNavigation } from '../hooks/useArrowNavigation';
import ScreenReaderOnly from './ScreenReaderOnly';

interface LikertScaleProps {
  questionId: number;
  questionText: string;
  value: number | undefined;
  onChange: (value: number) => void;
  isRequired?: boolean;
  isReadOnly?: boolean;
}

const LIKERT_LABELS = [
  'Dezacord total',
  'Dezacord parțial',
  'Neutru',
  'Acord parțial',
  'Acord total'
];

/**
 * LikertScale Component with Keyboard Navigation
 *
 * Keyboard support:
 * - Arrow Left/Right: Navigate between options
 * - Number keys 1-5: Directly select an option
 * - Home/End: Jump to first/last option
 * - Space/Enter: Activate focused option
 *
 * @example
 * <LikertScale
 *   questionId={1}
 *   questionText="Profesorul explică clar"
 *   value={responses[1]?.likert}
 *   onChange={(value) => handleLikertChange(1, value)}
 * />
 */
export default function LikertScale({
  questionId,
  questionText,
  value,
  onChange,
  isRequired = false,
  isReadOnly = false,
}: LikertScaleProps) {
  const radiogroupRef = useRef<HTMLDivElement>(null);

  // Enable arrow key navigation for horizontal list
  useArrowNavigation({
    containerRef: radiogroupRef,
    direction: 'horizontal',
    itemSelector: 'button[role="radio"]',
    enabled: !isReadOnly,
    loop: false,
    handleHomeEnd: true,
  });

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isReadOnly) return;

    // Handle number keys 1-5 for direct selection
    const key = event.key;
    if (key >= '1' && key <= '5') {
      event.preventDefault();
      const numValue = parseInt(key, 10);
      onChange(numValue);

      // Focus the selected button
      const buttons = radiogroupRef.current?.querySelectorAll<HTMLButtonElement>('button[role="radio"]');
      if (buttons && buttons[numValue - 1]) {
        buttons[numValue - 1].focus();
      }
    }
  };

  const handleButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>, buttonValue: number) => {
    if (isReadOnly) return;

    // Handle Space and Enter to activate the button
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      onChange(buttonValue);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-gray-600 mb-2" aria-hidden="true">
        <span>Dezacord total</span>
        <span>Acord total</span>
      </div>
      <div
        ref={radiogroupRef}
        role="radiogroup"
        aria-labelledby={`question-${questionId}`}
        aria-required={isRequired}
        className="flex gap-2 justify-center"
        onKeyDown={handleKeyDown}
      >
        <ScreenReaderOnly>
          Scală de evaluare de la 1 la 5, unde 1 înseamnă dezacord total și 5 înseamnă acord total.
          Folosește tastele săgeată stânga și dreapta pentru a naviga, sau apasă tastele 1-5 pentru selecție directă.
        </ScreenReaderOnly>
        {[1, 2, 3, 4, 5].map((buttonValue) => {
          const isSelected = value === buttonValue;
          return (
            <button
              key={buttonValue}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Nivel ${buttonValue} din 5: ${LIKERT_LABELS[buttonValue - 1]} pentru întrebarea: ${questionText}`}
              onClick={() => !isReadOnly && onChange(buttonValue)}
              onKeyDown={(e) => handleButtonKeyDown(e, buttonValue)}
              disabled={isReadOnly}
              className={`likert-button w-16 h-16 rounded-lg border-2 font-semibold transition-all ${
                isSelected
                  ? 'bg-primary-600 text-white border-primary-600 scale-110'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
              } ${isReadOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              tabIndex={isSelected || (!value && buttonValue === 3) ? 0 : -1}
            >
              {buttonValue}
            </button>
          );
        })}
      </div>
      <ScreenReaderOnly aria-live="polite" aria-atomic="true">
        {value && `Selecție curentă: ${value} din 5 - ${LIKERT_LABELS[value - 1]}`}
      </ScreenReaderOnly>
    </div>
  );
}
