import React, { useState, useEffect } from 'react';
import { InwardTapal } from '../../types';
import { X } from 'lucide-react';

interface InwardStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  tapal: InwardTapal | null;
  onSave: (updated: InwardTapal) => void;
  onShowToast: (msg: string) => void;
}

export const InwardStatusModal: React.FC<InwardStatusModalProps> = ({
  isOpen,
  onClose,
  tapal,
  onSave,
  onShowToast,
}) => {
  const [status, setStatus] = useState<'Under Scrutiny' | 'Disposed'>('Under Scrutiny');

  useEffect(() => {
    if (tapal && isOpen) {
      setStatus(tapal.status === 'Disposed' ? 'Disposed' : 'Under Scrutiny');
    }
  }, [tapal, isOpen]);

  if (!isOpen || !tapal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...tapal,
      status,
    });
    onClose();
    onShowToast(`Inward Tapal status updated to "${status}"!`);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-3">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-[#061122] text-white px-5 py-3.5 flex justify-between items-center border-b-2 border-amber-500">
          <h3 className="font-bold text-base text-white">🔄 Update Inward Tapal Status</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1 text-slate-700">
            <div>
              <span className="font-bold text-slate-900">Inward / Tapal No:</span> {tapal.inwardNo}
            </div>
            <div>
              <span className="font-bold text-slate-900">Sender:</span> {tapal.sender} •{' '}
              <span className="font-bold text-slate-900">Mandal:</span> {tapal.mandal}
            </div>
            <div>
              <span className="font-bold text-slate-900">Subject:</span> {tapal.subject}
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">New Status *</label>
            <select
              required
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Under Scrutiny' | 'Disposed')}
              className="w-full px-3 py-2 border border-slate-300 rounded-md font-bold focus:border-blue-500 focus:outline-none bg-white"
            >
              <option value="Under Scrutiny">Under Scrutiny</option>
              <option value="Disposed">Disposed</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded-md font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-1.5 rounded-md font-bold transition cursor-pointer shadow-xs"
            >
              Update Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
