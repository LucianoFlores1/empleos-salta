import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** estilo destructivo (rojo) en el botón de confirmar */
  danger?: boolean;
  /** deshabilita los botones mientras procesa */
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  zClassName?: string;
}

export default function ConfirmDialog({
  open,
  title = 'Confirmar acción',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
  zClassName = 'z-[9999]',
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} labelledById="confirm-dialog-title" zClassName={zClassName}>
      <div className="p-6">
        <h3 id="confirm-dialog-title" className="text-lg font-bold text-ink mb-2 text-balance">
          {title}
        </h3>
        <p className="text-subtle text-pretty">{message}</p>
      </div>
      <div className="px-6 py-4 bg-surface flex justify-end gap-3 border-t border-line">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-ink bg-card border border-line rounded-lg hover:bg-surface font-medium transition-colors disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 ${
            danger ? 'bg-danger hover:brightness-90' : 'bg-brand hover:bg-brand-dark'
          }`}
        >
          {loading ? 'Procesando…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
