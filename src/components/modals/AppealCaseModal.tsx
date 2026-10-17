import React, { useState, useEffect } from 'react';
import { X, Upload, Scale, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { AppealCase, APPEAL_TYPES, APPEAL_STATUSES, MANDAL_LIST, MANDAL_VILLAGES } from '../../types';

interface AppealCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseToEdit: AppealCase | null;
  onSave: (caseData: AppealCase, rawFileString?: string) => Promise<void> | void;
  onShowToast: (msg: string) => void;
}

const BHU_BHARATI_SECTIONS = [
  'Section 15(1) read with Rule 14 (Statutory RoR Appeal)',
  'Section 5 (Mutation on Transfer / Sale)',
  'Section 6 (Sadabainama Regularisation Appeal)',
  'Section 7 (Succession / Will Appeal)',
  'Section 16 (Revision before District Collector)',
  'Other Statutory Revenue Section',
];

export const AppealCaseModal: React.FC<AppealCaseModalProps> = ({
  isOpen,
  onClose,
  caseToEdit,
  onSave,
  onShowToast,
}) => {
  const [caseNo, setCaseNo] = useState('');
  const [appealType, setAppealType] = useState('');
  const [bhuBharatiActSection, setBhuBharatiActSection] = useState('');
  const [mandal, setMandal] = useState('');
  const [village, setVillage] = useState('');
  const [surveyNo, setSurveyNo] = useState('');
  const [extent, setExtent] = useState('');
  const [appellantName, setAppellantName] = useState('');
  const [respondentName, setRespondentName] = useState('');
  const [filingDate, setFilingDate] = useState('');
  const [noticeIssuedDate, setNoticeIssuedDate] = useState('');
  const [nextHearingDate, setNextHearingDate] = useState('');
  const [status, setStatus] = useState('Under Hearing');
  const [remarks, setRemarks] = useState('');

  // Notice document upload state
  const [noticeFileBase64, setNoticeFileBase64] = useState<string | null>(null);
  const [noticeFileName, setNoticeFileName] = useState('');

  // Final Order file upload state (optional)
  const [orderFileBase64, setOrderFileBase64] = useState<string | null>(null);

  // Available villages based on selected mandal
  const availableVillages = mandal && (MANDAL_VILLAGES as any)[mandal] ? (MANDAL_VILLAGES as any)[mandal] : [];

  useEffect(() => {
    if (!isOpen) return;

    if (caseToEdit) {
      setCaseNo(caseToEdit.caseNo || '');
      setAppealType(caseToEdit.appealType || APPEAL_TYPES[0]);
      setBhuBharatiActSection(caseToEdit.bhuBharatiActSection || BHU_BHARATI_SECTIONS[0]);
      setMandal(caseToEdit.mandal || '');
      setVillage(caseToEdit.village || '');
      setSurveyNo(caseToEdit.surveyNo || '');
      setExtent(caseToEdit.extent || '');
      setAppellantName(caseToEdit.appellantName || '');
      setRespondentName(caseToEdit.respondentName || '');
      setFilingDate(caseToEdit.filingDate || '');
      setNoticeIssuedDate(caseToEdit.noticeIssuedDate || '');
      setNextHearingDate(caseToEdit.nextHearingDate || '');
      setStatus(caseToEdit.status || 'Under Hearing');
      setRemarks(caseToEdit.remarks || '');
      setNoticeFileBase64((caseToEdit as any).noticeFile || null);
      setNoticeFileName('');
    } else {
      // CLEAN NEW ENTRY - NO PRE-FILLED DUMMY DATA
      setCaseNo('');
      setAppealType(APPEAL_TYPES[0]);
      setBhuBharatiActSection(BHU_BHARATI_SECTIONS[0]);
      setMandal('');
      setVillage('');
      setSurveyNo('');
      setExtent('');
      setAppellantName('');
      setRespondentName('');
      setFilingDate(new Date().toISOString().split('T')[0]);
      setNoticeIssuedDate('');
      setNextHearingDate('');
      setStatus('Under Hearing');
      setRemarks('');
      setNoticeFileBase64(null);
      setNoticeFileName('');
      setOrderFileBase64(null);
    }
  }, [isOpen, caseToEdit]);

  if (!isOpen) return null;

  const handleNoticeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      onShowToast('File size must be under 5MB.');
      return;
    }

    setNoticeFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      setNoticeFileBase64(evt.target?.result as string);
      onShowToast('Notice / Summons copy attached.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!caseNo.trim()) {
      onShowToast('Please enter Case / Appeal Number.');
      return;
    }
    if (!mandal) {
      onShowToast('Please select Mandal.');
      return;
    }
    if (!appellantName.trim()) {
      onShowToast('Please enter Appellant Name.');
      return;
    }

    const payload: AppealCase = {
      ...(caseToEdit || {}),
      id: caseToEdit ? caseToEdit.id : Date.now(),
      caseNo: caseNo.trim(),
      appealType: appealType || 'Bhu Bharati Appeal (Sec 15(1) r/w Rule 14)',
      bhuBharatiActSection: bhuBharatiActSection || 'Section 15(1) read with Rule 14 (Statutory RoR Appeal)',
      mandal,
      village: village || '-',
      surveyNo: surveyNo.trim() || '-',
      extent: extent.trim() || '-',
      appellantName: appellantName.trim(),
      respondentName: respondentName.trim() || 'Tahsildar & Others',
      filingDate: filingDate || new Date().toISOString().split('T')[0],
      noticeIssuedDate,
      nextHearingDate,
      status: (status as any) || 'Under Hearing',
      remarks: remarks.trim(),
      ...({ noticeFile: noticeFileBase64 } as any),
    };

    await onSave(payload, orderFileBase64 || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 relative border border-slate-300 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {caseToEdit ? 'Edit Appeal Case' : 'Register New Revenue Appeal Case'}
              </h2>
              <p className="text-xs text-slate-500">Court of the Revenue Divisional Officer, Huzurnagar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* Case Number */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Case / Appeal No <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. ROR/A/12/2026"
                value={caseNo}
                onChange={(e) => setCaseNo(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-bold"
                required
              />
            </div>

            {/* Appeal Type */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Appeal Type</label>
              <select
                value={appealType}
                onChange={(e) => setAppealType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                {APPEAL_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Act & Section */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Act &amp; Section</label>
              <select
                value={bhuBharatiActSection}
                onChange={(e) => setBhuBharatiActSection(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                {BHU_BHARATI_SECTIONS.map((sec) => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>

            {/* Mandal */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Mandal <span className="text-rose-500">*</span>
              </label>
              <select
                value={mandal}
                onChange={(e) => {
                  setMandal(e.target.value);
                  setVillage(''); // reset village when mandal changes
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-bold text-blue-900"
                required
              >
                <option value="">-- Select Mandal --</option>
                {MANDAL_LIST.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Village */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Village</label>
              <select
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                disabled={!mandal}
              >
                <option value="">{mandal ? '-- Select Village --' : 'Select Mandal first'}</option>
                {availableVillages.map((v: string) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Survey No & Extent */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Survey No</label>
                <input
                  type="text"
                  placeholder="e.g. 104/A"
                  value={surveyNo}
                  onChange={(e) => setSurveyNo(e.target.value)}
                  className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Extent (Ac.Gts)</label>
                <input
                  type="text"
                  placeholder="e.g. 1-20"
                  value={extent}
                  onChange={(e) => setExtent(e.target.value)}
                  className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Parties Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Appellant Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Appellant Name / Advocate"
                value={appellantName}
                onChange={(e) => setAppellantName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Respondent Name</label>
              <input
                type="text"
                placeholder="Respondent Name / Tahsildar"
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Dates & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Filing Date</label>
              <input
                type="date"
                value={filingDate}
                onChange={(e) => setFilingDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Notice Issued Date</label>
              <input
                type="date"
                value={noticeIssuedDate}
                onChange={(e) => setNoticeIssuedDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Current Case Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-bold"
              >
                {APPEAL_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* NOTICE / SUMMONS FILE UPLOAD */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Notice / Summons Document Upload (PDF / Image)</span>
              </span>
              {noticeFileBase64 && (
                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Attached
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <label className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-xs">
                <Upload className="w-3.5 h-3.5" />
                <span>Select Notice File</span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleNoticeUpload}
                  className="hidden"
                />
              </label>
              <span className="text-slate-600 text-[11px] truncate max-w-xs">
                {noticeFileName || (noticeFileBase64 ? 'Existing Notice File Attached' : 'No file chosen (Optional)')}
              </span>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Remarks / Directives</label>
            <textarea
              rows={2}
              placeholder="e.g. Call for Tahsildar report, summons issued to respondents..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Submit Buttons */}
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Scale className="w-4 h-4" />
              <span>{caseToEdit ? 'Update Appeal Case' : 'Save Appeal Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};