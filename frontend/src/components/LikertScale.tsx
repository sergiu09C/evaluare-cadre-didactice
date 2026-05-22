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

const LIKERT_OPTIONS = [
  { value: 1, label: 'Total dezacord' },
  { value: 2, label: 'Dezacord' },
  { value: 3, label: 'Neutru' },
  { value: 4, label: 'Acord' },
  { value: 5, label: 'Total acord' },
];

// Size-progressive grayscale (Variant C from design system).
// Visual differentiation via SIZE, neutral grayscale to avoid color-bias.
// Selected option draws accent-violet ring + dot.
const SIZES = [28, 36, 44, 36, 28]; // visual symmetry around neutral

export default function LikertScale({
  questionId,
  questionText,
  value,
  onChange,
  isRequired = false,
  isReadOnly = false,
}: LikertScaleProps) {
  const radiogroupRef = useRef<HTMLDivElement>(null);

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
    const key = event.key;
    if (key >= '1' && key <= '5') {
      event.preventDefault();
      const numValue = parseInt(key, 10);
      onChange(numValue);
      const buttons = radiogroupRef.current?.querySelectorAll<HTMLButtonElement>('button[role="radio"]');
      if (buttons && buttons[numValue - 1]) buttons[numValue - 1].focus();
    }
  };

  const handleButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>, buttonValue: number) => {
    if (isReadOnly) return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      onChange(buttonValue);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div
        ref={radiogroupRef}
        role="radiogroup"
        aria-labelledby={`question-${questionId}`}
        aria-required={isRequired}
        onKeyDown={handleKeyDown}
        className="relative h-16 flex items-center"
      >
        <ScreenReaderOnly>
          Scală de evaluare de la 1 la 5, unde 1 înseamnă dezacord total și 5 înseamnă acord total.
          Folosește tastele săgeată stânga și dreapta pentru a naviga, sau apasă tastele 1-5 pentru selecție directă.
        </ScreenReaderOnly>

        {/* axis line */}
        <div className="absolute left-[10%] right-[10%] top-1/2 h-px bg-neutral-200" aria-hidden="true" />

        <div className="flex justify-between items-center w-full relative">
          {LIKERT_OPTIONS.map((opt, i) => {
            const selected = value === opt.value;
            const sz = SIZES[i];
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`Nivel ${opt.value} din 5: ${opt.label} pentru întrebarea: ${questionText}`}
                tabIndex={selected || (!value && i === 2) ? 0 : -1}
                onClick={() => !isReadOnly && onChange(opt.value)}
                onKeyDown={(e) => handleButtonKeyDown(e, opt.value)}
                disabled={isReadOnly}
                className={`w-14 h-14 p-0 border-none bg-transparent flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-400/50 ${
                  isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <span
                  className={`rounded-full border-[1.5px] flex items-center justify-center text-white font-semibold text-[13px] transition-all duration-fast ease-out-expo ${
                    selected
                      ? 'bg-accent-600 border-accent-600 scale-[1.06] shadow-[0_4px_14px_rgba(124,58,237,0.35)]'
                      : 'bg-white border-neutral-300'
                  }`}
                  style={{ width: sz, height: sz }}
                  aria-hidden="true"
                >
                  {selected ? opt.value : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between items-center text-[11px] text-neutral-400 px-1">
        <span>Total dezacord</span>
        <span className="opacity-50">Neutru</span>
        <span>Total acord</span>
      </div>

      <ScreenReaderOnly aria-live="polite" aria-atomic="true">
        {value && `Selecție curentă: ${value} din 5 - ${LIKERT_OPTIONS[value - 1].label}`}
      </ScreenReaderOnly>
    </div>
  );
}

export { LIKERT_OPTIONS };
