import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  type = 'warning',
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const iconMap = {
    danger: <AlertTriangle className="w-6 h-6 text-red-500" />,
    warning: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
    info: <Info className="w-6 h-6 text-blue-500" />,
  };

  const buttonClassMap = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    info: 'bg-blue-600 hover:bg-blue-700 text-white',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-stc-navy rounded-lg shadow-xl max-w-md w-full p-6 border border-white/10">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 mt-0.5">{iconMap[type]}</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-white/70 whitespace-pre-line">{message}</p>
          </div>
          <button
            onClick={onCancel}
            className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg transition-colors font-medium ${buttonClassMap[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
