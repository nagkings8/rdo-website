import React, { useState, useEffect } from 'react';
import { InwardTapal, OutwardDespatch } from '../../types';
import { getTodayDateString, isFutureDate, stampSingleDocument, setAttachmentInDB } from '../../utils/storage';
import { X, Paperclip, Link as LinkIcon, PlusCircle } from 'lucide-react';

interface OutwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  inwards: InwardTapal[];
  preselectedInwardId?: number | null;
  editingOutward?: OutwardDespatch | null;
  onSave: (outward: OutwardDespatch, shouldDisposeInwardId?: number | null, isEdit?: boolean) => void;
  onShowToast: (msg: string) => void;
}

export const OutwardModal: React.FC<OutwardModalProps> = ({
  isOpen,
  onClose,
  inwards,
  preselectedInwardId = null,
  editingOutward = null,
  onSave,
  onShowToast,
}) => {
  const isEditMode = !!editingOutward;
  const [entryType, setEntryType] = useState<'INWARD_LINKED' | 'FRESH'>('INWARD_LINKED');
  const [selectedInwardId, setSelectedInwardId] = useState<string>('');
  const [markInwardDisposed, setMarkInwardDisposed] = useState<boolean>(true);
  const [outwardNo, setOutwardNo] = useState<string>('');
  const [outwardDate, setOutwardDate] = useState<string>(getTodayDateString());
  const [sentTo, setSentTo] = useState<string>('');
  const [recipientDetails, setRecipientDetails] = useState<string>('');
  const [mode, setMode] = useState<string>('Official Email / e-Office');
  const [priority, setPriority] = useState<string>('Regular');
  const [subject, setSubject] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [base64File, setBase64File] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleReset = () => {
    setEntryType('INWARD_LINKED');
    setSelectedInwardId('');
    setMarkInwardDisposed(true);
    setOutwardNo('');
    setOutwardDate(getTodayDateString());
    setSentTo('');
    setRecipientDetails('');
    setMode('Official Email / e-Office');
    setPriority('Regular');
    setSubject('');
    setRemarks('');
    setBase64File('');
    setFileName('');
  };

  useEffect(() => {
    if (isOpen) {
      if (editingOutward) {
        setEntryType(editingOutward.entryType || 'FRESH');
        setOutwardNo(editingOutward.outwardNo || '');
        setOutwardDate(editingOutward.outwardDate || getTodayDateString());

        const fullSentTo = editingOutward.sentTo || '';
        const match = fullSentTo.match(/^([^(]+?)\s*\(([^)]+)\)$/);
        if (match) {
          setSentTo(match[1].trim());
          setRecipientDetails(match[2].trim());
        } else {
          setSentTo(fullSentTo);
          setRecipientDetails('');
        }

        setMode(editingOutward.mode || 'Official Email / e-Office');
        setPriority(editingOutward.priority || 'Regular');
        setSubject(editingOutward.subject || '');
        setRemarks(editingOutward.remarks || '');
        setBase64File(editingOutward.fileAttachment || '');
        setFileName(editingOutward.hasAttachment ? 'Existing Attached Document' : '');

        if (editingOutward.linkedInwardNo) {
          const linked = inwards.find((i) => i.inwardNo === editingOutward.linkedInwardNo);
          if (linked) {
            setSelectedInwardId(String(linked.id));
          }
        }
      } else {
        handleReset();
        if (preselectedInwardId) {
          setEntryType('INWARD_LINKED');
          setSelectedInwardId(String(preselectedInwardId));
          handleInwardSelect(String(preselectedInwardId));
        }
      }
    }
  }, [isOpen, preselectedInwardId, editingOutward]);

  if (!isOpen) return null;

  const handleInwardSelect = (idStr: string) => {
    setSelectedInwardId(idStr);
    if (!idStr) return;
    const tapal = inwards.find((t) => String(t.id) === idStr);
    if (!tapal) return;

    setSubject(`Submission / Action report regarding: ${tapal.subject} (Ref: ${tapal.inwardNo})`);
    if ((tapal.sender || '').toLowerCase().includes('tahsildar') || (tapal.sender || '').toLowerCase().includes('mro')) {
      setSentTo('Forwarded to Collectorate');
    } else {
      setSentTo('Forwarded to MRO');
    }
    setRecipientDetails(tapal.sender || '');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      onShowToast('File size exceeds 8MB. Please select a smaller file.');
      e.target.value = '';
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setBase64File(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFutureDate(outwardDate)) {
      onShowToast('⚠️ Future dates are not allowed! Please select today or a past date.');
      return;
    }
    if (!sentTo) {
      onShowToast('⚠️ Please select Dispatched / Sent To.');
      return;
    }

    setIsSaving(true);
    let linkedInwardNo: string | null = null;
    let disposeId: number | null = null;

    if (entryType === 'INWARD_LINKED' && selectedInwardId) {
      const tapal = inwards.find((t) => String(t.id) === selectedInwardId);
      if (tapal) {
        linkedInwardNo = tapal.inwardNo;
        if (markInwardDisposed) {
          disposeId = tapal.id;
        }
      }
    }

    const fullSentTo = recipientDetails.trim()
      ? `${sentTo} (${recipientDetails.trim()})`
      : sentTo;

    const outwardId = isEditMode && editingOutward ? editingOutward.id : Date.now();
    const outAttKey = `out_${outwardId}`;
    let stampedFile = base64File;

    // Check if new file was attached
    const isNewFile = base64File && (!isEditMode || base64File !== editingOutward?.fileAttachment);

    if (isNewFile) {
      try {
        const stampText = `OUTWARD DESPATCH: ${outwardNo.trim()} | DATE: ${outwardDate} | TO: ${fullSentTo.substring(
          0,
          32
        )}`;
        stampedFile = await stampSingleDocument(base64File, stampText);
        await setAttachmentInDB(outAttKey, stampedFile);
      } catch (err) {
        console.warn('Error stamping outward doc:', err);
      }
    }

    const newOutward: OutwardDespatch = {
      id: outwardId,
      outwardNo: outwardNo.trim(),
      outwardDate,
      entryType,
      linkedInwardNo: isEditMode && editingOutward ? (editingOutward.linkedInwardNo ?? linkedInwardNo) : linkedInwardNo,
      sentTo: fullSentTo,
      subject: subject.trim(),
      mode,
      priority,
      remarks: remarks.trim(),
      hasAttachment: !!stampedFile || !!(isEditMode && editingOutward?.hasAttachment),
      attachmentKey: stampedFile ? outAttKey : (isEditMode ? (editingOutward?.attachmentKey ?? null) : null),
      fileAttachment: stampedFile || (isEditMode ? editingOutward?.fileAttachment : undefined),
    };

    setIsSaving(false);
    onSave(newOutward, disposeId, isEditMode);
    onClose();
    onShowToast(
      isEditMode
        ? 'Outward despatch record updated successfully!'
        : stampedFile
        ? 'Outward despatch & date-stamped document saved successfully!'
        : 'Outward despatch recorded successfully!'
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden my-6">
        <div className="bg-[#061122] text-white px-5 py-3.5 flex justify-between items-center border-b-2 border-amber-500">
          <div className="flex items-center gap-2">
            {isEditMode && (
              <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded tracking-wider uppercase">
                EDIT
              </span>
            )}
            <h3 className="font-bold text-base text-white">
              {isEditMode ? `Edit Outward Despatch #${outwardNo || ''}` : 'Record Outward Despatch'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          {/* Source option toggle */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
            <label className="font-bold text-slate-800 block">Despatch Source Type:</label>
            <div className="flex gap-4">
              <label className="font-semibold flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="outwardSourceOption"
                  value="INWARD_LINKED"
                  checked={entryType === 'INWARD_LINKED'}
                  onChange={() => setEntryType('INWARD_LINKED')}
                />
                <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Link from Inward Tapal</span>
              </label>
              <label className="font-semibold flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="outwardSourceOption"
                  value="FRESH"
                  checked={entryType === 'FRESH'}
                  onChange={() => setEntryType('FRESH')}
                />
                <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Direct Fresh Entry</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {entryType === 'INWARD_LINKED' && (
              <div className="sm:col-span-2 space-y-1.5">
                <label className="font-bold text-slate-700 block">Select Inward Tapal Correspondence *</label>
                <select
                  value={selectedInwardId}
                  onChange={(e) => handleInwardSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none bg-white font-medium"
                >
                  <option value="">-- Choose Inward Tapal Record --</option>
                  {inwards.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.inwardNo} — {t.sender} ({(t.subject || '').substring(0, 42)}...)
                    </option>
                  ))}
                </select>
                <label className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5 pt-1">
                  <input
                    type="checkbox"
                    checked={markInwardDisposed}
                    onChange={(e) => setMarkInwardDisposed(e.target.checked)}
                  />
                  <span>Mark linked Inward Tapal as "Disposed" upon despatch</span>
                </label>
              </div>
            )}

            <div>
              <label className="font-bold text-slate-700 block mb-1">Outward / Despatch No *</label>
              <input
                type="text"
                required
                placeholder="e.g. D/644/2026"
                value={outwardNo}
                onChange={(e) => setOutwardNo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Despatch Date *</label>
              <input
                type="date"
                required
                max={getTodayDateString()}
                value={outwardDate}
                onChange={(e) => setOutwardDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Dispatched / Sent To *</label>
              <select
                required
                value={sentTo}
                onChange={(e) => setSentTo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none bg-white"
              >
                <option value="">-- Select Dispatched To --</option>
                <option value="Forwarded to MRO">Forwarded to MRO</option>
                <option value="Forwarded to Collectorate">Forwarded to Collectorate</option>
                <option value="Endorsement to Applicant">Endorsement to Applicant</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Recipient Particulars / Office (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Tahsildar Huzurnagar / Citizen Name"
                value={recipientDetails}
                onChange={(e) => setRecipientDetails(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Mode of Despatch *</label>
              <select
                required
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none bg-white"
              >
                <option value="Official Email / e-Office">Official Email / e-Office</option>
                <option value="Special Messenger / By Hand">Special Messenger / By Hand</option>
                <option value="Registered Post / Speed Post">Registered Post / Speed Post</option>
                <option value="Ordinary Post">Ordinary Post</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Despatch Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none bg-white"
              >
                <option value="Regular">Regular</option>
                <option value="Urgent / Time Bound">Urgent / Time Bound</option>
                <option value="Court Case / Notice">Court Case / Notice</option>
              </select>
            </div>

            <div className="sm:col-span-2 border-1.5 border-dashed border-amber-400 bg-amber-50/60 p-3 rounded-lg space-y-1">
              <label className="font-bold text-amber-900 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-amber-600" />
                <span>Attach Outward Despatch Document (PDF / Image)</span>
              </label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-600 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer"
              />
              {fileName && (
                <div className="text-[11px] text-amber-800 font-semibold">Selected: {fileName}</div>
              )}
              <small className="text-amber-800 text-[11px] block">
                💡 An official office date stamp will automatically be imprinted on this document.
              </small>
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Subject / Reference *</label>
              <textarea
                required
                rows={2}
                placeholder="Subject or reference description..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">
                Outward Remarks / Endorsement Notes
              </label>
              <textarea
                rows={2}
                placeholder="Enter outward dispatch remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none"
              />
            </div>
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
              type="submit"
              disabled={isSaving}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-1.5 rounded-md font-bold transition cursor-pointer shadow-xs"
            >
              {isSaving ? 'Saving...' : isEditMode ? 'Update Despatch' : 'Record Despatch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
