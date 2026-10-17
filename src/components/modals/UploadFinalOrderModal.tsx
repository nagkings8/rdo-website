import React, { useState, useEffect } from 'react';
import { X, Gavel, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { AppealCase, CaseHistoryEntry } from '../../types';

interface UploadFinalOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  appealCase: AppealCase | null;
  onSaveOrder: (updatedCase: AppealCase, rawFileString?: string) => Promise<void> | void;
  onShowToast: (msg: string) => void;
}

export const UploadFinalOrderModal: React.FC<UploadFinalOrderModalProps> = ({
  isOpen,
  onClose,
  appealCase,
  onSaveOrder,
  onShowToast,
}) => {
  const [orderNo, setOrderNo] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [orderStatus, setOrderStatus] = useState<
    'Final Order Issued - Allowed' | 'Final Order Issued - Dismissed' | 'Final Order Issued - Remanded'
  >('Final Order Issued - Allowed');
  const [summary, setSummary] = useState('');
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !appealCase) return;

    setOrderNo(appealCase.finalOrderNo || `D/${appealCase.caseNo}/2026`);
    setOrderDate(appealCase.finalOrderDate || new Date().toISOString().split('T')[0]);
    if (appealCase.status?.includes('Dismissed')) {
      setOrderStatus('Final Order Issued - Dismissed');
    } else if (appealCase.status?.includes('Remanded')) {
      setOrderStatus('Final Order Issued - Remanded');
    } else {
      setOrderStatus('Final Order Issued - Allowed');
    }
    setSummary(appealCase.finalOrderSummary || '');
    setFileBase64(null);
    setFileName('');
  }, [isOpen, appealCase]);

  if (!isOpen || !appealCase) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      onShowToast('File size must be under 5MB.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      setFileBase64(evt.target?.result as string);
      onShowToast(`Final order document attached: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderNo.trim()) {
      onShowToast('Please enter Order Number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const todayStr = orderDate || new Date().toISOString().split('T')[0];

      // Final Order automatically registered as the latest entry in Case History
      const finalHistoryEntry: CaseHistoryEntry = {
        id: `order_${Date.now()}`,
        businessDate: todayStr,
        hearingDate: todayStr,
        purpose: 'FINAL ORDER PRONOUNCED',
        judgeOfficer: 'Revenue Divisional Officer & SDM, Huzurnagar',
        proceedings: `Appeal ${orderStatus.replace('Final Order Issued - ', '').toUpperCase()}. Final Order No: ${orderNo.trim()}. ${summary.trim()}`,
        documentFile: fileBase64 || appealCase.finalOrderFile || undefined,
        documentName: fileName || 'Final_Order_Copy.pdf',
        uploadedAt: new Date().toISOString(),
      };

      const existingHistory = (appealCase.caseHistory || []).filter(
        (h) => h.purpose !== 'FINAL ORDER PRONOUNCED'
      );

      const updatedHistory = [finalHistoryEntry, ...existingHistory];

      const updatedPayload: AppealCase = {
        ...appealCase,
        status: orderStatus,
        stagePurpose: 'DISPOSED WITH FINAL ORDER',
        nextHearingDate: 'Case Disposed',
        finalOrderNo: orderNo.trim(),
        finalOrderDate: todayStr,
        finalOrderSummary: summary.trim(),
        finalOrderFileName: fileName || appealCase.finalOrderFileName || 'Final_Order_Copy.pdf',
        caseHistory: updatedHistory,
      };

      await onSaveOrder(updatedPayload, fileBase64 || undefined);
      onShowToast(`Final Order for #${appealCase.caseNo} published and added to Case History!`);
      onClose();
    } catch (err: any) {
      console.error('Order upload error:', err);
      onShowToast(`Error: ${err?.message || 'Failed to save final order'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative border border-slate-300">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Gavel className="w-5 h-5"/>
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">Upload Final Judgment / Order</h3>
              <p className="text-[11px] text-slate-500">Case No: {appealCase.caseNo} ({appealCase.village})</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5"/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Final Order / Proceedings No <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. D/125/2026"
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-blue-900 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Order Date</label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Final Result / Disposal</label>
              <select
                value={orderStatus}
                onChange={(e: any) => setOrderStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-blue-900 focus:outline-none"
              >
                <option value="Final Order Issued - Allowed">Allowed</option>
                <option value="Final Order Issued - Dismissed">Dismissed</option>
                <option value="Final Order Issued - Remanded">Remanded</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Judgment Summary / Gist</label>
            <textarea
              rows={2}
              placeholder="Summary of decision, directives to Tahsildar..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600"/>
              <span>Signed Final Order Document (PDF / Image)</span>
            </span>

            <div className="flex items-center gap-2">
              <label className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-xs">
                <Upload className="w-3.5 h-3.5"/>
                <span>Choose Document</span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <span className="text-slate-600 truncate max-w-[200px]">
                {fileName || (appealCase.hasFinalOrderAttachment ? 'Order copy attached' : 'No file chosen')}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4"/>
              <span>{isSubmitting ? 'Saving...' : 'Publish Final Order'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};