interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  danger?: boolean;
}

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmText = 'Confirmar', danger = false }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-text-light mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm rounded-lg text-white transition-colors ${
              danger ? 'bg-danger hover:bg-red-600' : 'bg-primary hover:bg-primary-light'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
