import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** id del elemento que titula el diálogo (para aria-labelledby) */
  labelledById?: string;
  children: React.ReactNode;
  /** clases del panel (ancho, etc.) */
  panelClassName?: string;
  /** cerrar al hacer click en el fondo (default: true) */
  closeOnBackdrop?: boolean;
  /** z-index del overlay (default: 100) */
  zClassName?: string;
}

/**
 * Modal accesible reutilizable.
 * - role="dialog" + aria-modal y aria-labelledby
 * - cierra con Escape
 * - focus-trap básico (Tab cicla dentro del diálogo)
 * - bloquea el scroll del body mientras está abierto
 * - overscroll-behavior: contain para no arrastrar el fondo
 */
export default function Modal({
  open,
  onClose,
  labelledById,
  children,
  panelClassName = 'max-w-sm',
  closeOnBackdrop = true,
  zClassName = 'z-[100]',
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement;

    // Mover el foco al diálogo
    const SELECTOR =
      'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const focusFirst = () => {
      const focusables = Array.from(
        panelRef.current?.querySelectorAll(SELECTOR) ?? []
      ) as HTMLElement[];
      (focusables[0] ?? panelRef.current)?.focus();
    };
    focusFirst();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = (
          Array.from(panelRef.current.querySelectorAll(SELECTOR)) as HTMLElement[]
        ).filter(el => el.offsetParent !== null);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${zClassName} flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm [overscroll-behavior:contain]`}
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
        tabIndex={-1}
        className={`bg-card rounded-2xl w-full ${panelClassName} overflow-hidden shadow-xl outline-none animate-in fade-in zoom-in-95 duration-200`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
