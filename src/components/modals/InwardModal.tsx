import React, { useState, useEffect } from 'react';
import { InwardTapal, MANDAL_LIST, MANDAL_VILLAGES } from '../../types';
import { getTodayDateString, isFutureDate, stampSingleDocument, setAttachmentInDB } from '../../utils/storage';
import { X, Paperclip, AlertTriangle, RefreshCw, FileText } from 'lucide-react';

interface InwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tapal: InwardTapal) => void;
  onShowToast: (msg: string) => void;
  tapalToEdit?: InwardTapal | null;
  existingInwards?: InwardTapal[];
}

export const InwardModal: React.FC<InwardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onShowToast,
  tapalToEdit,
  existingInwards = [],
}) => {
  const isEditMode = !!tapalToEdit;

  const [inwardNo, setInwardNo] = useState('');
  const [receivedDate, setReceivedDate] = useState(getTodayDateString());
  const [sender, setSender] = useState('');
  const [mandal, setMandal] = useState('GENERAL / DIVISION');
  const [village, setVillage] = useState('General / Division Level');
  const [status, setStatus] = useState('Under Scrutiny');
  const [subject, setSubject] = useState('');
  const [remarks, setRemarks] = useState('');
  const [base64File, setBase64File] = useState('');
  const [fileName, setFileName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Available villages based on mandal
  const availableVillages = mandal && MANDAL_VILLAGES[mandal] ? MANDAL_VILLAGES[mandal] : [];

  const handleReset = () => {
    setInwardNo('');
    setReceivedDate(getTodayDateString());
    setSender('');
    setMandal('GENERAL / DIVISION');
    setVillage('General / Division Level');
    setStatus('Under Scrutiny');
    setSubject('');
    setRemarks('');
    setBase64File('');
    setFileName('');
  };

  useEffect(() => {
    if (isOpen) {
      if (tapalToEdit) {
        setInwardNo(tapalToEdit.inwardNo || '');
        setReceivedDate(tapalToEdit.receivedDate || getTodayDateString());
        setSender(tapalToEdit.sender || '');
        const currentMandal = tapalToEdit.mandal || 'GENERAL / DIVISION';
        setMandal(currentMandal);
        setVillage(tapalToEdit.village || 'General / Division Level');
        setStatus(tapalToEdit.status || 'Under Scrutiny');
        setSubject(tapalToEdit.subject || '');
        setRemarks(tapalToEdit.remarks || '');
        setBase64File('');
        setFileName('');
      } else {
        handleReset();
      }
    }
  }, [isOpen, tapalToEdit]);

  // When mandal changes, update village default
  const handleMandalChange = (newMandal: string) => {
    setMandal(newMandal);
    if (newMandal === 'GENERAL / DIVISION' || !MANDAL_VILLAGES[newMandal]) {
      setVillage('General / Division Level');
    } else {
      const villages = MANDAL_VILLAGES[newMandal];
      setVillage(villages[0] || 'General / Not Specified');
    }
  };

  if (!isOpen) return null;

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

    const cleanInwardNo = inwardNo.trim();
    if (!cleanInwardNo) {
      onShowToast('Inward No is required.');
      return;
    }

    // Duplicate Check: Check if another record has the exact same Inward No
    const duplicate = existingInwards.find(
      (item) =>
        item.inwardNo.trim().toLowerCase() === cleanInwardNo.toLowerCase() &&
        item.id !== tapalToEdit?.id
    );

    if (duplicate) {
      onShowToast(
        `Inward No. "${cleanInwardNo}" already exists in the Register! Single-file rule enforced: please update the existing record instead of adding a duplicate.`
      );
      return;
    }

    if (isFutureDate(receivedDate)) {
      onShowToast('Future dates are not permitted. Please select today or a past date.');
      return;
    }

    setIsSaving(true);
    const activeId = tapalToEdit ? tapalToEdit.id : Date.now();
    const inwAttKey = `inw_${activeId}`;
    let stampedFile = base64File;

    if (base64File) {
      try {
        const stampText = `INWARD NO: ${cleanInwardNo} | RECEIVED: ${receivedDate} | SENDER: ${sender
          .trim()
          .substring(0, 32)}`;
        stampedFile = await stampSingleDocument(base64File, stampText);
        await setAttachmentInDB(inwAttKey, stampedFile);
      } catch (err) {
        console.warn('Error stamping inward doc:', err);
      }
    }

    // If in edit mode, log the return / modification movement history
    const existingHistory = tapalToEdit?.returnHistory || [];
    let updatedHistory = [...existingHistory];

    if (isEditMode) {
      const isReturnedMovement =
        status.includes('Returned') ||
        (tapalToEdit && sender.trim() !== tapalToEdit.sender.trim());

      if (isReturnedMovement || remarks.trim()) {
        updatedHistory.push({
          date: receivedDate,
          from: sender.trim(),
          status: status,
          remarks: remarks.trim() || `Updated / Received from ${sender.trim()}`,
        });
      }
    }

    const savedRecord: InwardTapal = {
      id: activeId,
      inwardNo: cleanInwardNo,
      receivedDate,
      sender: sender.trim(),
      mandal,
      village,
      status,
      subject: subject.trim(),
      remarks: remarks.trim(),
      hasAttachment: stampedFile ? true : tapalToEdit ? tapalToEdit.hasAttachment : false,
      attachmentKey: stampedFile ? inwAttKey : tapalToEdit ? tapalToEdit.attachmentKey : null,
      fileAttachment: stampedFile || (tapalToEdit ? tapalToEdit.fileAttachment : undefined),
      returnHistory: updatedHistory,
    };

    setIsSaving(false);
    onSave(savedRecord);
    handleReset();
    onClose();
    onShowToast(
      isEditMode
        ? `Inward file #${cleanInwardNo} updated successfully!`
        : stampedFile
        ? 'Inward Tapal & date-stamped document saved successfully!'
        : 'Inward Tapal recorded successfully!'
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-xl w-full overflow-hidden my-6">
        {/* Header */}
        <div className="bg-[#061122] text-white px-5 py-3.5 flex justify-between items-center border-b-2 border-amber-500">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
              {isEditMode ? 'EDIT / RETURN' : 'NEW ENTRY'}
            </span>
            <h3 className="font-bold text-base text-white">
              {isEditMode ? 'Edit Inward Tapal & Received Details' : 'New Inward Tapal Entry'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Duplicate Prevention Notice if in edit mode */}
          {isEditMode && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-amber-900 flex items-start gap-2">
              <RefreshCw className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs">Updating Inward Record #{tapalToEdit?.inwardNo}</p>
                <p className="text-[11px] text-amber-800">
                  When a file returns from MRO / Collectorate, update the "Received From / Office", "Received Date", and status here. This maintains one single tracking file without duplicate registers.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Inward / Tapal No *</label>
              <input
                type="text"
                required
                placeholder="e.g. INW/2026/104"
                value={inwardNo}
                onChange={(e) => setInwardNo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Received Date *</label>
              <input
                type="date"
                required
                max={getTodayDateString()}
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">
                Received From / Office *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tahsildar Huzurnagar / Collectorate Suryapet / Citizen"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Mandal *</label>
              <select
                value={mandal}
                onChange={(e) => handleMandalChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none bg-white font-medium"
              >
                <option value="GENERAL / DIVISION">GENERAL / DIVISION</option>
                {MANDAL_LIST.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Revenue Village *</label>
              <select
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none bg-white font-medium"
              >
                {availableVillages.length > 0 ? (
                  <>
                    <option value="General / Not Specified">General / Not Specified</option>
                    {availableVillages.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </>
                ) : (
                  <option value="General / Division Level">General / Division Level</option>
                )}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Current Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none bg-white font-bold text-slate-800"
              >
                <option value="Under Scrutiny">Under Scrutiny (Active in Seat)</option>
                <option value="Sent to Outward">Sent to Outward (Despatched to MRO / Collectorate)</option>
                <option value="Returned from Tahsildar / MRO">Returned from Tahsildar / MRO</option>
                <option value="Returned from Collectorate">Returned from Collectorate</option>
                <option value="Disposed">Disposed (Action Completed)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">
                Subject / Matter Particulars *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Brief subject of the correspondence..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">
                Return Notes / Remarks (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Returned after field inspection report from Tahsildar"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 border-1.5 border-dashed border-blue-400 bg-blue-50/60 p-3 rounded-lg space-y-1">
              <label className="font-bold text-blue-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                  <span>Attach Inward Letter / Representation (PDF / Image)</span>
                </span>
                {fileName && <span className="text-[11px] text-emerald-700 font-bold">{fileName}</span>}
              </label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-600 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
              />
              {tapalToEdit?.hasAttachment && !base64File && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Existing document attached. Select a new file above only if you wish to replace it.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold transition cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSaving ? 'Saving...' : isEditMode ? 'Save Inward Edits' : 'Save Inward Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
