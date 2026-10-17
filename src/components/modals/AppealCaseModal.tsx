import React, { useState, useEffect } from 'react';
import { X, Scale, Plus, Trash2, FileText, Upload, CheckCircle2 } from 'lucide-react';
import { AppealCase, CaseHistoryEntry, APPEAL_TYPES, APPEAL_STATUSES, MANDAL_LIST, MANDAL_VILLAGES } from '../../types';

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

  // Multiple parties (Multiline support)
  const [appellantName, setAppellantName] = useState('');
  const [respondentName, setRespondentName] = useState('');

  const [filingDate, setFilingDate] = useState('');
  const [nextHearingDate, setNextHearingDate] = useState('');
  const [stagePurpose, setStagePurpose] = useState('');
  const [status, setStatus] = useState<any>('Under Hearing');
  const [remarks, setRemarks] = useState('');

  // Continuous Hearings & Notices using CaseHistoryEntry from types.ts
  const [hearings, setHearings] = useState<CaseHistoryEntry[]>([]);
  const [newHearingDate, setNewHearingDate] = useState('');
  const [newHearingStage, setNewHearingStage] = useState('');
  const [newNoticeFile, setNewNoticeFile] = useState<string | null>(null);
  const [newNoticeName, setNewNoticeName] = useState('');

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
      setNextHearingDate(caseToEdit.nextHearingDate || '');
      setStagePurpose(caseToEdit.stagePurpose || 'For Hearing');
      setStatus(caseToEdit.status || 'Under Hearing');
      setRemarks(caseToEdit.remarks || '');
      setHearings(caseToEdit.caseHistory || []);
    } else {
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
      setNextHearingDate('');
      setStagePurpose('Notice / Summons Issued');
      setStatus('Under Hearing');
      setRemarks('');
      setHearings([]);
    }

    setNewHearingDate('');
    setNewHearingStage('');
    setNewNoticeFile(null);
    setNewNoticeName('');
  }, [isOpen, caseToEdit]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      onShowToast('File size must be under 5MB.');
      return;
    }
    setNewNoticeName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      setNewNoticeFile(evt.target?.result as string);
      onShowToast('Notice Copy attached.');
    };
    reader.readAsDataURL(file);
  };

  const handleAddHearing = () => {
    if (!newHearingDate) {
      onShowToast('Please select hearing / notice date.');
      return;
    }
    const entry: CaseHistoryEntry = {
      id: `h_${Date.now()}`,
      businessDate: new Date().toISOString().split('T')[0],
      hearingDate: newHearingDate,
      purpose: newHearingStage || 'Summons / Notice Issued',
      judgeOfficer: 'Revenue Divisional Officer & SDM, Huzurnagar',
      proceedings: newHearingStage || 'Notice issued to respondents and parties.',
      documentFile: newNoticeFile || undefined,
      documentName: newNoticeName || undefined,
      uploadedAt: new Date().toISOString(),
    };
    setHearings([entry, ...hearings]);
    setNewHearingDate('');
    setNewHearingStage('');
    setNewNoticeFile(null);
    setNewNoticeName('');
    onShowToast('Notice / Hearing record added.');
  };

  const handleRemoveHearing = (id: string) => {
    setHearings(hearings.filter((h) => h.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!caseNo.trim()) {
      onShowToast('Please enter Case Number.');
      return;
    }
    if (!mandal) {
      onShowToast('Please select Mandal.');
      return;
    }
    if (!appellantName.trim()) {
      onShowToast('Please enter Appellant Name(s).');
      return;
    }

    const payload: AppealCase = {
      ...(caseToEdit || {}),
      id: caseToEdit ? caseToEdit.id : Date.now(),
      caseNo: caseNo.trim(),
      appealType: appealType || 'Bhu Bharati Appeal - RoR Rectification (Sec 15(1) r/w Sec 4 & Rule 14)',
      bhuBharatiActSection: bhuBharatiActSection || 'Section 15(1) read with Rule 14 (Statutory RoR Appeal)',
      mandal,
      village: village || '-',
      surveyNo: surveyNo.trim() || '-',
      extent: extent.trim() || '-',
      appellantName: appellantName.trim(),
      respondentName: respondentName.trim() || 'Tahsildar & Others',
      filingDate: filingDate || new Date().toISOString().split('T')[0],
      nextHearingDate,
      stagePurpose,
      status,
      remarks: remarks.trim(),
      caseHistory: hearings,
    };

    await onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 relative border border-slate-300 my-8 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {caseToEdit ? 'Edit Revenue Appeal Case' : 'Register New Revenue Appeal Case'}
              </h2>
              <p className="text-xs text-slate-500">Court of RDO &amp; SDM, Huzurnagar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Case Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Case No <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. ROR/A/15/2026"
                value={caseNo}
                onChange={(e) => setCaseNo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-blue-900 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Appeal Type</label>
              <select
                value={appealType}
                onChange={(e) => setAppealType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
              >
                {APPEAL_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Act &amp; Section</label>
              <select
                value={bhuBharatiActSection}
                onChange={(e) => setBhuBharatiActSection(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
              >
                {BHU_BHARATI_SECTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Mandal <span className="text-rose-500">*</span>
              </label>
              <select
                value={mandal}
                onChange={(e) => {
                  setMandal(e.target.value);
                  setVillage('');
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-blue-900 focus:outline-none"
                required
              >
                <option value="">-- Select Mandal --</option>
                {MANDAL_LIST.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Village</label>
              <select
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                disabled={!mandal}
              >
                <option value="">{mandal ? '-- Select Village --' : 'Select Mandal first'}</option>
                {availableVillages.map((v: string) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Survey No</label>
                <input
                  type="text"
                  placeholder="e.g. 104/A"
                  value={surveyNo}
                  onChange={(e) => setSurveyNo(e.target.value)}
                  className="w-full px-2 py-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Extent</label>
                <input
                  type="text"
                  placeholder="e.g. 2-00"
                  value={extent}
                  onChange={(e) => setExtent(e.target.value)}
                  className="w-full px-2 py-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* MULTIPLE APPELLANTS & RESPONDENTS (TEXTAREA) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">
                  Appellant Name(s) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">Okari kante ekkuva unte line by line type cheyyandi</span>
              </div>
              <textarea
                rows={3}
                placeholder="1. Ramesh S/o Narayana&#10;2. Suresh S/o Narayana&#10;3. & Others"
                value={appellantName}
                onChange={(e) => setAppellantName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none font-medium"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">Respondent Name(s)</label>
                <span className="text-[10px] text-slate-400">Line by line type cheyyandi</span>
              </div>
              <textarea
                rows={3}
                placeholder="1. Tahsildar Huzurnagar&#10;2. Venkat Reddy S/o Malla Reddy&#10;3. & Others"
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Current Status & Hearing Stage */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Filing Date</label>
              <input
                type="date"
                value={filingDate}
                onChange={(e) => setFilingDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Next Hearing Date</label>
              <input
                type="date"
                value={nextHearingDate}
                onChange={(e) => setNextHearingDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Case Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-blue-900 focus:outline-none"
              >
                {APPEAL_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* CONTINUOUS NOTICES & HEARINGS SECTION */}
          <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-800 flex items-center gap-1.5 text-xs">
                <FileText className="w-4 h-4 text-blue-700" />
                <span>Hearings &amp; Issued Notices Register (Continuous Tracking)</span>
              </span>
              <span className="text-[10.5px] text-slate-500 font-semibold">
                Total Notices Issued: {hearings.length}
              </span>
            </div>

            {/* Add new hearing row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-slate-200 items-end">
              <div>
                <label className="block font-bold text-slate-600 mb-1 text-[11px]">Date of Notice / Hearing</label>
                <input
                  type="date"
                  value={newHearingDate}
                  onChange={(e) => setNewHearingDate(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1 text-[11px]">Notice Stage / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. 1st Notice to Tahsildar / Counter"
                  value={newHearingStage}
                  onChange={(e) => setNewHearingStage(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1 text-[11px]">Upload Notice Copy</label>
                <label className="w-full px-2 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs cursor-pointer flex items-center justify-between truncate">
                  <span className="truncate">{newNoticeName || 'Attach Notice (PDF/Img)'}</span>
                  <Upload className="w-3.5 h-3.5 text-slate-600 shrink-0 ml-1" />
                  <input type="file" accept=".pdf,image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleAddHearing}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Notice</span>
                </button>
              </div>
            </div>

            {/* List of existing notices */}
            {hearings.length > 0 ? (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {hearings.map((h, idx) => (
                  <div
                    key={h.id || idx}
                    className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center text-[10px]">
                        {hearings.length - idx}
                      </span>
                      <div>
                        <div className="font-bold text-slate-800">
                          {h.hearingDate} — <span className="text-blue-700">{h.purpose}</span>
                        </div>
                        {h.documentFile && (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Notice Document Attached ({h.documentName || 'File'})
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveHearing(h.id)}
                      className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                      title="Remove Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-3 text-slate-400 text-xs italic">
                Inka notices add cheyyaledu. Date &amp; purpose enter chesi 'Add Notice' click cheyyandi.
              </div>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Remarks</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Case remarks..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
            />
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 sticky bottom-0 bg-white">
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
              <span>{caseToEdit ? 'Update Appeal Case' : 'Register Appeal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};