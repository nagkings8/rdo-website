import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, CheckCircle2, Scale, Trash2 } from 'lucide-react';
import { AppealCase, APPEAL_STATUSES } from '../../types';

interface UploadFinalOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  appealCase: AppealCase | null;
  onSaveOrder: (
    updatedCase: AppealCase,
    fileBase64?: string
  ) => Promise<void> | void;
  onShowToast: (msg: string) => void;
}

export const UploadFinalOrderModal: React.FC<UploadFinalOrderModalProps> = ({
  isOpen,
  onClose,
  appealCase,
  onSaveOrder,
  onShowToast,
}) => {
  const [finalOrderNo, setFinalOrderNo] = useState('');
  const [finalOrderDate, setFinalOrderDate] = useState('');
  const [status, setStatus] = useState<string>('Final Order Issued - Allowed');
  const [finalOrderSummary, setFinalOrderSummary] = useState('');
  const [remarks, setRemarks] = useState('');
  const [attachedFileBase64, setAttachedFileBase64] = useState<string | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (appealCase) {
      const today = new Date().toISOString().split('T')[0];
      setFinalOrderNo(appealCase.finalOrderNo || '');
      setFinalOrderDate(appealCase.finalOrderDate || today);
      setStatus(
        appealCase.status.includes('Final Order')
          ? appealCase.status
          : 'Final Order Issued - Allowed'
      );
      setFinalOrderSummary(appealCase.finalOrderSummary || '');
      setRemarks(appealCase.remarks || '');
      setAttachedFileName(appealCase.finalOrderFileName || '');
      setAttachedFileBase64(appealCase.finalOrderFile || null);
    }
  }, [appealCase, isOpen]);

  const processFile = (file: File) => {
    if (file.size > 15 * 1024 * 1024) {
      onShowToast('File size exceeds 15MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAttachedFileBase64(result);
      setAttachedFileName(file.name);
      onShowToast(`Final order document selected: ${file.name}`);
    };
    reader.onerror = () => {
      onShowToast('Error reading file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealCase) return;

    if (!finalOrderNo.trim()) {
      onShowToast('Please specify the Final Order / Proceedings Number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated: AppealCase = {
        ...appealCase,
        status,
        finalOrderNo: finalOrderNo.trim(),
        finalOrderDate: finalOrderDate || new Date().toISOString().split('T')[0],
        finalOrderSummary: finalOrderSummary.trim(),
        hasFinalOrderAttachment: Boolean(
          attachedFileBase64 || appealCase.hasFinalOrderAttachment
        ),
        finalOrderFileName:
          attachedFileName ||
          (attachedFileBase64
            ? `${appealCase.caseNo.replace(/\//g, '_')}_Final_Order.pdf`
            : appealCase.finalOrderFileName || ''),
        remarks: remarks.trim(),
      };

      await onSaveOrder(updated, attachedFileBase64 || undefined);
      onShowToast(`Final Order saved successfully for Case ${appealCase.caseNo}!`);
      onClose();
    } catch (err) {
      console.error('Error saving final order:', err);
      onShowToast('Failed to save Final Order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !appealCase) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-fade-in flex flex-col">
        {/* Header */}
        <div className="bg-[#134674] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Scale className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-wide">
                Upload / Update Final Order Copy
              </h3>
              <p className="text-xs text-blue-100 font-medium">
                Case No: <span className="text-amber-300 font-bold">{appealCase.caseNo}</span> • {appealCase.appealType}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Case summary strip */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 text-xs flex flex-wrap justify-between items-center gap-2 text-slate-700">
          <div>
            <span className="font-bold text-slate-900">Appellant: </span>
            {appealCase.appellantName}
          </div>
          <div>
            <span className="font-bold text-slate-900">Location: </span>
            {appealCase.village} ({appealCase.mandal}), Sy: {appealCase.surveyNo || '-'}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Final Order Decision <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-bold text-blue-900"
              >
                {APPEAL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Final Order / Procgs No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Procgs. No. D/ROR/1142/2025"
                value={finalOrderNo}
                onChange={(e) => setFinalOrderNo(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Order Issue Date
              </label>
              <input
                type="date"
                value={finalOrderDate}
                onChange={(e) => setFinalOrderDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 font-bold">
                Final Order Summary / Operative Judgment (Bhu Bharati Act, 2025)
              </label>
              <span className="text-[10px] text-blue-800 font-bold">Bhu Bharati Presets</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              <button
                type="button"
                onClick={() => {
                  setStatus("Final Order Issued - Allowed");
                  setFinalOrderSummary("Appeal ALLOWED under Section 15(1) read with Rule 14 of Telangana Bhu Bharati Rules, 2025. Impugned proceedings of Tahsildar set aside. Tahsildar is hereby directed to rectify the Record of Rights in Bhu Bharati Portal under Rule 5(6), mutate the subject land in favor of the appellant, and issue updated digital Pattadar Pass Book-cum-Title Deed under Rule 5(7) / 10(1) within 15 days.");
                }}
                className="text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded font-bold"
              >
                + Allowed &amp; Rectify RoR (Rule 5(6))
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatus("Final Order Issued - Allowed");
                  setFinalOrderSummary("Appeal ALLOWED. Sadabainama regularisation validated under Section 6 of Telangana Bhu Bharati (Record of Rights in Land) Act, 2025. Tahsildar directed to incorporate alienor/alienee rights in Bhu Bharati Land Records database.");
                }}
                className="text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300 px-2 py-0.5 rounded font-bold"
              >
                + Sadabainama Sec 6 Validation
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatus("Remanded Back to Tahsildar");
                  setFinalOrderSummary("Appeal REMANDED back to Tahsildar under Rule 14(4) of Telangana Bhu Bharati Rules, 2025 for de-novo enquiry and joint spot inspection with prior notice to both parties within 30 days.");
                }}
                className="text-[10px] bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 px-2 py-0.5 rounded font-bold"
              >
                + Remanded
              </button>
            </div>

            <textarea
              rows={3}
              placeholder="Record the judgment passed by the Revenue Divisional Officer..."
              value={finalOrderSummary}
              onChange={(e) => setFinalOrderSummary(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none text-slate-800 font-medium"
            />
          </div>

          {/* Upload File Box */}
          <div>
            <label className="block text-slate-800 font-black mb-1.5 flex items-center justify-between">
              <span>Attach Signed / Scanned Final Order Copy</span>
              {attachedFileName && (
                <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> File Selected
                </span>
              )}
            </label>

            {attachedFileName ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-lg border border-emerald-300 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-emerald-700" />
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">
                      {attachedFileName}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      Ready to attach and view in court register
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAttachedFileBase64(null);
                    setAttachedFileName('');
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    processFile(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-white'
                }`}
                onClick={() => document.getElementById('directOrderUploadInput')?.click()}
              >
                <input
                  id="directOrderUploadInput"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processFile(e.target.files[0]);
                    }
                  }}
                />
                <div className="flex flex-col items-center justify-center gap-1">
                  <Upload className="w-6 h-6 text-blue-600 mb-1" />
                  <span className="font-bold text-slate-700 text-xs">
                    Click to select or drag & drop Final Order Document (PDF/Scan)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Supports PDF, JPG, PNG (Max 15MB)
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Remarks / Compliance Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. Sent to Tahsildar for mutation implementation."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold shadow-md transition cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Final Order</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
