import { useEffect, useRef } from 'react';
import { Button } from './Button';
import AccessibleModal from '../AccessibleModal';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

/**
 * Confirm dialog reutilizabil. Înlocuiește `window.confirm` nativ.
 *
 * Focus implicit pe butonul Anulează (defensive — evită ștergerea accidentală
 * la Enter). Esc închide modalul (delegat la AccessibleModal).
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmă',
  cancelLabel = 'Anulează',
  tone = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => cancelRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [isOpen]);

  const iconColorClass =
    tone === 'danger' ? 'text-danger-fg' : tone === 'warning' ? 'text-warning-fg' : 'text-info';
  const confirmVariant: 'primary' | 'secondary' = tone === 'info' ? 'primary' : 'primary';

  return (
    <AccessibleModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4 p-1">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon
            className={`w-6 h-6 shrink-0 ${iconColorClass}`}
            aria-hidden="true"
          />
          <p className="text-sm text-neutral-700 whitespace-pre-wrap">{message}</p>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button ref={cancelRef} variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
            className={tone === 'danger' ? '!bg-danger-fg hover:!bg-red-700' : ''}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </AccessibleModal>
  );
}
