import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  details: React.ReactNode;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  title,
  details,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-3">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-rose-600 text-white px-5 py-3.5 flex justify-between items-center">
          <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>Confirm Record Deletion</span>
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3.5 text-xs">
          <p className="text-slate-800 font-semibold">
            Are you sure you want to permanently delete this record? This action cannot be undone.
          </p>

          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-900 leading-relaxed">
            <div className="font-bold text-rose-950 mb-1">{title}</div>
            {details}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3.5 py-1.5 rounded-md font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={onConfirm}
              className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded-md font-bold transition cursor-pointer shadow-xs disabled:opacity-60"
            >
              {isDeleting ? 'Deleting...' : 'Yes, Permanently Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
