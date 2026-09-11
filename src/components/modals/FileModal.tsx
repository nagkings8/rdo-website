import React, { useState, useEffect } from 'react';
import { BhuFile, MANDAL_VILLAGES, MANDAL_LIST, REVENUE_MODULES, FILE_STATUSES } from '../../types';
import { getTodayDateString, isFutureDate, stampSingleDocument, setAttachmentInDB } from '../../utils/storage';
import { X, AlertTriangle, Paperclip } from 'lucide-react';

interface FileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (savedFile: BhuFile) => void;
  onSwitchToStatus: (fileId: number) => void;
  files: BhuFile[];
  currentUser: any;
  onShowToast: (msg: string) => void;
}

export const FileModal: React.FC<FileModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSwitchToStatus,
  files,
  currentUser,
  onShowToast,
}) => {
  const [appNumber, setAppNumber] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [mandal, setMandal] = useState('');
  const [village, setVillage] = useState('');
  const [surveyNo, setSurveyNo] = useState('');
  const [module, setModule] = useState('');
  const [receivedDate, setReceivedDate] = useState(getTodayDateString());
  const [status, setStatus] = useState<string>('Received from MRO');
  const [remarks, setRemarks] = useState('');
  const [base64File, setBase64File] = useState('');
  const [fileName, setFileName] = useState('');
  const [duplicateFile, setDuplicateFile] = useState<BhuFile | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleReset = () => {
    setAppNumber('');
    setApplicantName('');
    setMandal('');
    setVillage('');
    setSurveyNo('');
    setModule('');
    setReceivedDate(getTodayDateString());
    setStatus('Received from MRO');
    setRemarks('');
    setBase64File('');
    setFileName('');
    setDuplicateFile(null);
  };

  useEffect(() => {
    if (isOpen) {
      handleReset();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAppNumberChange = (val: string) => {
    setAppNumber(val);
    const clean = val.trim().toLowerCase();
    if (!clean) {
      setDuplicateFile(null);
      return;
    }
    const found = files.find(
      (f) => f.appNumber && f.appNumber.trim().toLowerCase() === clean
    );
    setDuplicateFile(found || null);
  };

  const handleMandalChange = (val: string) => {
    setMandal(val);
    setVillage('');
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
    if (isFutureDate(receivedDate)) {
      onShowToast('⚠️ Future dates are not allowed! Please select today or a past date.');
      return;
    }
    if (!module) {
      onShowToast('Please select a module.');
      return;
    }
    if (duplicateFile) {
      onShowToast(`⚠️ Application No. "${appNumber}" already exists! Duplicate blocked.`);
      return;
    }

    setIsSaving(true);
    const newId = Date.now();
    const attKey = `bhu_${newId}`;
    let stampedFile = base64File;

    if (base64File) {
      try {
        const initialStamp = `RECEIPT DATE: ${receivedDate} | APP: ${appNumber} | INITIAL MRO RECEIPT`;
        stampedFile = await stampSingleDocument(base64File, initialStamp);
        await setAttachmentInDB(attKey, stampedFile);
      } catch (err) {
        console.warn('Initial stamp error:', err);
      }
    }

    const newRecord: BhuFile = {
      id: newId,
      appNumber: appNumber.trim(),
      applicantName: applicantName.trim(),
      mandal,
      village,
      surveyNo: surveyNo.trim(),
      module,
      receivedDate,
      status,
      remarks: remarks.trim(),
      hasAttachment: !!stampedFile,
      attachmentKey: stampedFile ? attKey : null,
      hasInitialAttachment: !!stampedFile,
      history: [
        {
          date: receivedDate,
          action: 'File Received from MRO',
          from: `MRO ${mandal}`,
          to: 'D Section, RDO Office',
          user: currentUser ? currentUser.name : 'D Section Staff',
          remarks: remarks.trim() || 'Initial Receipt',
          hasSignedAttachment: false,
        },
      ],
    };

    setIsSaving(false);
    onSave(newRecord);
    handleReset();
    onClose();
    onShowToast('Bhu Bharati file record saved successfully!');
  };

  const villageList = mandal ? MANDAL_VILLAGES[mandal] || [] : [];

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-[#061122] text-white px-5 py-3.5 flex justify-between items-center border-b-2 border-amber-500">
          <h3 className="font-bold text-base text-white">New Bhu Bharati File Entry</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* Duplicate Warning */}
          {duplicateFile && (
            <div className="bg-rose-50 border-1.5 border-rose-400 rounded-lg p-3.5 flex flex-col gap-2 text-rose-900">
              <div className="flex items-center gap-1.5 font-bold text-rose-700">
                <AlertTriangle className="w-4 h-4" />
                <span>⚠️ Application Already Exists in Records!</span>
              </div>
              <div className="text-[11px] text-slate-800 leading-relaxed">
                Applicant: <strong>{duplicateFile.applicantName}</strong> • Mandal:{' '}
                <strong>{duplicateFile.mandal}</strong> ({duplicateFile.village})<br />
                Survey: <strong>{duplicateFile.surveyNo}</strong> • Module:{' '}
                <strong>{duplicateFile.module}</strong> • Status:{' '}
                <span className="font-bold text-amber-700">{duplicateFile.status}</span>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchToStatus(duplicateFile.id);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded text-xs transition cursor-pointer"
                >
                  🔄 Update Status for this Existing File →
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">
                Application Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 2600123123 or EX2600..."
                value={appNumber}
                onChange={(e) => handleAppNumberChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Applicant Name *</label>
              <input
                type="text"
                required
                placeholder="Enter applicant name"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Mandal *</label>
              <select
                required
                value={mandal}
                onChange={(e) => handleMandalChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none bg-white"
              >
                <option value="">-- Select Mandal --</option>
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
                required
                disabled={!mandal}
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none bg-white disabled:bg-slate-100"
              >
                <option value="">{mandal ? '-- Select Village --' : '-- Select Mandal First --'}</option>
                {villageList.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Survey Number(s) *</label>
              <input
                type="text"
                required
                placeholder="e.g. 124/A, 125"
                value={surveyNo}
                onChange={(e) => setSurveyNo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Module *</label>
              <select
                required
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none bg-white"
              >
                <option value="">-- Select Module --</option>
                {REVENUE_MODULES.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Received From MRO Date *
              </label>
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
              <label className="font-bold text-slate-700 block mb-1">Current Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none bg-white font-medium"
              >
                {FILE_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 border-1.5 border-dashed border-blue-400 bg-blue-50/60 p-3 rounded-lg">
              <label className="font-bold text-blue-900 flex items-center gap-1.5 mb-1.5">
                <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                <span>Attach Application Document (PDF / Image)</span>
              </label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-600 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
              />
              {fileName && (
                <div className="mt-1 text-[11px] text-blue-700 font-semibold">
                  Selected: {fileName}
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">
                Remarks / Endorsement Notes
              </label>
              <textarea
                rows={2}
                placeholder="Enter endorsement remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md font-bold transition cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded-md font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md font-bold transition cursor-pointer shadow-xs"
            >
              {isSaving ? 'Saving...' : 'Save Bhu Bharati Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
