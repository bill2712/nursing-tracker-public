import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerAction?: React.ReactNode;
  closeLabel: string;
}

/** Bottom sheet on phones, centered dialog on larger screens. */
export const Modal: React.FC<ModalProps> = ({ title, onClose, children, footer, headerAction, closeLabel }) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  // Callers pass a new onClose on every render; keep the latest in a ref so the
  // effect below runs once and does not pull focus away while someone types.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
      // Keep Tab inside the dialog.
      if (event.key === 'Tab' && panelRef.current) {
        const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
          .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  return createPortal(
    <div className="nt-modal-backdrop" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="nt-modal"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--nt-line)] px-5 py-3.5">
          <h2 id={titleId} className="text-base font-black">{title}</h2>
          <div className="flex items-center gap-1">
            {headerAction}
            <button type="button" onClick={onClose} className="nt-icon-btn" aria-label={closeLabel}>
              <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="border-t border-[var(--nt-line)] px-5 py-4 safe-area-pb">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};
