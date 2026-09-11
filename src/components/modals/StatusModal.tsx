import React, { useState, useEffect } from 'react';
import { BhuFile, FILE_STATUSES } from '../../types';
import {
  getTodayDateString,
  isFutureDate,
  getAttachmentFromDB,
  setAttachmentInDB,
  mergeNewSignedDocToDossier,
} from '../../utils/storage';
import { uploadPdfToCloudinary } from '../../utils/cloudinary';
import { X, Lock, Paperclip, Loader2 } from 'lucide-react';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: BhuFile | null;
  onSaveStatus: (updatedFile: BhuFile) => void;
  currentUser: any;
  onShowToast: (msg: string) => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  isOpen,
  onClose,
  file,
  onSaveStatus,
  currentUser,
  onShowToast,
}) => {
  const [newStatus, setNewStatus] = useState<string>('Pending at RDO');
  const [updateDate, setUpdateDate] = useState<string>(getTodayDateString());
  const [remarks, setRemarks] = useState<string>('');
  const [base64File, setBase64File] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (file && isOpen) {
      setNewStatus(file.status);
      setUpdateDate(getTodayDateString());
      setRemarks('');
      setBase64File('');
      setFileName('');
      setIsProcessing(false);
    }
  }, [file, isOpen]);

  if (!isOpen || !file) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 8 * 1024 * 1024) {
      onShowToast('File size exceeds 8MB. Please select a smaller file.');
      e.target.value = '';
      return;
    }
    setFileName(selected.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setBase64File(reader.result as string);
    };
    reader.readAsDataURL(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFutureDate(updateDate)) {
      onShowToast('⚠️ Future dates are not allowed! Please select today or a past date.');
      return;
    }

    setIsProcessing(true);
    const prevStatus = file.status;
    let hasNewDoc = false;
    const attKey = file.attachmentKey || `bhu_${file.id}`;
    let latestDocUrl = file.fileAttachment || '';

    if (base64File) {
      onShowToast('Fetching existing dossier and appending new pages...');
      const stampText = `DATE: ${updateDate} | STATUS: ${newStatus.toUpperCase()} | RDO HUZURNAGAR`;

      try {
        let existingDocData: string | undefined = file.fileAttachment;

        // 1. Cloudinary URL ఉంటే నేరుగా fetch చేసి Base64 లోకి మార్చడం
        if (
          existingDocData &&
          (existingDocData.startsWith('http://') || existingDocData.startsWith('https://'))
        ) {
          try {
            const resp = await fetch(existingDocData);
            const blob = await resp.blob();
            existingDocData = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
          } catch (fetchErr) {
            console.warn('Could not fetch cloud file directly, fallback to IndexedDB:', fetchErr);
            existingDocData = (await getAttachmentFromDB(attKey)) || undefined;
          }
        } else if (!existingDocData && (file.attachmentKey || file.hasAttachment)) {
          existingDocData = (await getAttachmentFromDB(attKey)) || undefined;
        }

        // 2. పాత ఫైల్ కు కొత్త ఫైల్ ను వెనుక మెర్జ్ చేసి స్టాంప్ వేయడం
        const mergedPdf = await mergeNewSignedDocToDossier(existingDocData, base64File, stampText);

        // 3. మెర్జ్ అయిన పూర్తి Multi-page PDF ని Cloudinary కి అప్‌లోడ్ చేయడం
        onShowToast('Uploading full multi-page dossier to cloud...');
        latestDocUrl = await uploadPdfToCloudinary(mergedPdf);

        // 4. స్థానిక డేటాబేస్‌లో సేవ్ చేయడం
        await setAttachmentInDB(attKey, latestDocUrl);
        hasNewDoc = true;
      } catch (mergeErr) {
        console.error('PDF Merge/Upload error:', mergeErr);
        try {
          latestDocUrl = await uploadPdfToCloudinary(base64File);
          await setAttachmentInDB(attKey, latestDocUrl);
          hasNewDoc = true;
        } catch (uploadErr) {
          await setAttachmentInDB(attKey, base64File);
          latestDocUrl = base64File;
          hasNewDoc = true;
        }
      }
    }

    const fullRemark = `${remarks.trim()}${
      hasNewDoc ? ' (Appended to continuous PDF dossier)' : ''
    }`;

    const newHistory = [
      ...(file.history || []),
      {
        date: updateDate,
        action: `Status Updated to ${newStatus}`,
        from: prevStatus,
        to: newStatus,
        user: currentUser ? currentUser.name : 'D Section Staff',
        remarks: fullRemark,
        hasSignedAttachment: hasNewDoc,
      },
    ];

    const updatedRecord: BhuFile = {
      ...file,
      status: newStatus,
      // మెర్జ్ అయిన తాజా Cloud URL ఇక్కడ భద్రపరచబడుతుంది
      fileAttachment: latestDocUrl || file.fileAttachment,
      hasAttachment: hasNewDoc ? true : file.hasAttachment,
      attachmentKey: attKey,
      history: newHistory,
    };

    setIsProcessing(false);
    onSaveStatus(updatedRecord);
    onClose();
    onShowToast(
      hasNewDoc
        ? `Status updated & page appended to dossier successfully!`
        : `File status updated to "${newStatus}" successfully!`
    );
  };

  const hasExistingDoc =
    file.hasAttachment || (file.fileAttachment && file.fileAttachment.length > 50);

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-xl w-full overflow-hidden my-6">
        <div className="bg-[#061122] text-white px-5 py-3.5 flex justify-between items-center border-b-2 border-amber-500">
          <h3 className="font-bold text-base text-white flex items-center gap-1.5">
            <span>🔄</span>
            <span>Update Bhu Bharati File Movement Status</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Locked Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
            <div className="flex justify-between items-start border-b border-slate-200 pb-2">
              <div>
                <div className="text-[10px] font-extrabold text-amber-600 uppercase flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Locked Application Record</span>
                </div>
                <div className="font-extrabold text-sm text-slate-900">
                  {file.appNumber} • {file.applicantName}
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {file.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div>
                <span className="font-semibold text-slate-900">Mandal &amp; Village:</span>{' '}
                {file.mandal} • {file.village}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Survey No(s):</span>{' '}
                {file.surveyNo}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Module:</span> {file.module}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Received Date:</span>{' '}
                {file.receivedDate}
              </div>
            </div>
          </div>

          <div>
            <label className="font-extrabold text-blue-900 block mb-1">
              Update Status To *
            </label>
            <select
              required
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 border-1.5 border-blue-500 rounded-md font-bold focus:outline-none bg-white text-slate-900"
            >
              {FILE_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Status Movement Date *
            </label>
            <input
              type="date"
              required
              max={getTodayDateString()}
              value={updateDate}
              onChange={(e) => setUpdateDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="border-1.5 border-dashed border-blue-400 bg-blue-50/60 p-3 rounded-lg space-y-1.5">
            <label className="font-bold text-blue-900 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-blue-600" />
              <span>Attach Signed Copy / Endorsement Order (PDF / Image) - Cloud Sync</span>
            </label>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileChange}
              className="w-full text-xs text-slate-600 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
            {fileName && (
              <div className="text-[11px] text-blue-700 font-semibold">
                Selected: {fileName}
              </div>
            )}
            <div className="text-[11px] text-blue-800 font-medium pt-1">
              {hasExistingDoc
                ? '📄 Continuous Dossier Active: Existing files will be preserved. New uploads will automatically append as subsequent pages with an official stamp.'
                : '📄 Primary Document: This uploaded file will become the initial document for this record.'}
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Endorsement Remarks / Notes *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Enter reason for forwarding, query to MRO, or disposal note..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none"
            />
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
              disabled={isProcessing}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-1.5 rounded-md font-bold transition cursor-pointer shadow-xs disabled:opacity-60 flex items-center gap-1.5"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Stamping &amp; Syncing to Cloud...</span>
                </>
              ) : (
                <span>Save Status Update</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};