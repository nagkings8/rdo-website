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

  const [appellantName, setAppellantName] = useState('');
  const [appellantAdvocate, setAppellantAdvocate] = useState('');
  const [respondentName, setRespondentName] = useState('');
  const [respondentAdvocate, setRespondentAdvocate] = useState('');

  const [filingDate, setFilingDate] = useState('');
  const [firstHearingDate, setFirstHearingDate] = useState('');
  const [nextHearingDate, setNextHearingDate] = useState('');
  const [stagePurpose, setStagePurpose] = useState('');
  const [status, setStatus] = useState<any>('');
  const [remarks, setRemarks] = useState('');

  // Continuous Hearings & Notices
  const [hearings, setHearings] = useState<CaseHistoryEntry[]>([]);
  const [newBusinessDate, setNewBusinessDate] = useState('');
  const [newHearingDate, setNewHearingDate] = useState('');
  const [newHearingStage, setNewHearingStage] = useState('');
  const [newNoticeFile, setNewNoticeFile] = useState<string | null>(null);
  const [newNoticeName, setNewNoticeName] = useState('');

  const availableVillages = mandal && (MANDAL_VILLAGES as any)[mandal] ? (MANDAL_VILLAGES as any)[mandal] : [];

  useEffect(() => {
    if (!isOpen) return;

    if (caseToEdit) {
      setCaseNo(caseToEdit.caseNo || '');
      setAppealType(caseToEdit.appealType || '');
      setBhuBharatiActSection(caseToEdit.bhuBharatiActSection || '');
      setMandal(caseToEdit.mandal || '');
      setVillage(caseToEdit.village || '');
      setSurveyNo(caseToEdit.surveyNo || '');
      setExtent(caseToEdit.extent || '');
      setAppellantName(caseToEdit.appellantName || '');
      setAppellantAdvocate(caseToEdit.appellantAdvocate || '');
      setRespondentName(caseToEdit.respondentName || '');
      setRespondentAdvocate(caseToEdit.respondentAdvocate || '');
      setFilingDate(caseToEdit.filingDate || '');
      setFirstHearingDate(caseToEdit.firstHearingDate || '');
      setNextHearingDate(caseToEdit.nextHearingDate || '');
      setStagePurpose(caseToEdit.stagePurpose || '');
      setStatus(caseToEdit.status || 'Under Hearing');
      setRemarks(caseToEdit.remarks || '');
      // Ensure it is an array
      setHearings(Array.isArray(caseToEdit.caseHistory) ? [...caseToEdit.caseHistory] : []);
    } else {
      setCaseNo('');
      setAppealType('');
      setBhuBharatiActSection('');
      setMandal('');
      setVillage('');
      setSurveyNo('');
      setExtent('');
      setAppellantName('');
      setAppellantAdvocate('');
      setRespondentName('');
      setRespondentAdvocate('');
      setFilingDate(new Date().toISOString().split('T')[0]);
      setFirstHearingDate('');
      setNextHearingDate('');
      setStagePurpose('');
      setStatus('');
      setRemarks('');
      setHearings([]);
    }

    setNewBusinessDate(new Date().toISOString().split('T')[0]);
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
      onShowToast(`Notice file attached: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleAddHearing = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!newHearingDate) {
      onShowToast('Next Hearing Date select cheyyandi!');
      return;
    }

    const uniqueId = `h_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const entry: CaseHistoryEntry = {
      id: uniqueId,
      businessDate: newBusinessDate || new Date().toISOString().split('T')[0],
      hearingDate: newHearingDate,
      purpose: (newHearingStage || 'NOTICE ISSUED').toUpperCase(),
      judgeOfficer: 'Revenue Divisional Officer & SDM, Huzurnagar',
      proceedings: newHearingStage || 'Notice issued and posted.',
      documentFile: newNoticeFile || undefined,
      documentName: newNoticeName || undefined,
      uploadedAt: new Date().toISOString(),
    };

    // Prepend to list
    setHearings((prev) => [entry, ...prev]);
    setNextHearingDate(newHearingDate);
    if (newHearingStage) setStagePurpose(newHearingStage);

    // Reset inputs
    setNewHearingDate('');
    setNewHearingStage('');
    setNewNoticeFile(null);
    setNewNoticeName('');
    onShowToast('Notice / Hearing entry added successfully!');
  };

  const handleRemoveHearing = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setHearings((prev) => prev.filter((h) => h.id !== id));
    onShowToast('Hearing entry removed.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!caseNo.trim()) {
      onShowToast('Please enter Case Number.');
      return;
    }
    if (!appealType) {
      onShowToast('Please select Appeal Type.');
      return;
    }
    if (!bhuBharatiActSection) {
      onShowToast('Please select Act & Section.');
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
      appealType,
      bhuBharatiActSection,
      mandal,
      village: village || '-',
      surveyNo: surveyNo.trim() || '-',
      extent: extent.trim() || '-',
      appellantName: appellantName.trim(),
      appellantAdvocate: appellantAdvocate.trim() || 'Party in Person',
      respondentName: respondentName.trim() || 'Tahsildar & Others',
      respondentAdvocate: respondentAdvocate.trim() || 'GP for Revenue',
      filingDate: filingDate || new Date().toISOString().split('T')[0],
      firstHearingDate: firstHearingDate || filingDate,
      nextHearingDate: nextHearingDate || (hearings[0]?.hearingDate || ''),
      stagePurpose: stagePurpose || (hearings[0]?.purpose || 'For Hearing'),
      status: status || 'Under Hearing',
      remarks: remarks.trim(),
      caseHistory: [...hearings],
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
              <p className="text-xs text-slate-500">Court of the Revenue Divisional Officer &amp; SDM, Huzurnagar</p>
            </div>
          </div>
          <button
            type="button"
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
                Case / Appeal No <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 125"
                value={caseNo}
                onChange={(e) => setCaseNo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-blue-900 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Appeal Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={appealType}
                onChange={(e) => setAppealType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none font-medium"
                required
              >
                <option value="">-- Select Appeal Type --</option>
                {APPEAL_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Act &amp; Section <span className="text-rose-500">*</span>
              </label>
              <select
                value={bhuBharatiActSection}
                onChange={(e) => setBhuBharatiActSection(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none font-medium"
                required
              >
                <option value="">-- Select Act &amp; Section --</option>
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
                  placeholder="e.g. 102"
                  value={surveyNo}
                  onChange={(e) => setSurveyNo(e.target.value)}
                  className="w-full px-2 py-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Extent</label>
                <input
                  type="text"
                  placeholder="e.g. 1.300"
                  value={extent}
                  onChange={(e) => setExtent(e.target.value)}
                  className="w-full px-2 py-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Multiple Appellants & Respondents */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Appellant Name(s) <span className="text-rose-500">*</span>
                <span className="text-[10px] text-slate-400 font-normal ml-2">(Line by line)</span>
              </label>
              <textarea
                rows={3}
                placeholder="1) Appellant Name"
                value={appellantName}
                onChange={(e) => setAppellantName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none font-medium text-xs"
                required
              />
              <input
                type="text"
                placeholder="Advocate: e.g. Party in Person"
                value={appellantAdvocate}
                onChange={(e) => setAppellantAdvocate(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Respondent Name(s)
                <span className="text-[10px] text-slate-400 font-normal ml-2">(Line by line)</span>
              </label>
              <textarea
                rows={3}
                placeholder="1) Respondent Name&#10;2) Tahsildar"
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none font-medium text-xs"
              />
              <input
                type="text"
                placeholder="Respondent Advocate / GP: e.g. GP for Revenue"
                value={respondentAdvocate}
                onChange={(e) => setRespondentAdvocate(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Dates & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200">
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
              <label className="block font-bold text-slate-700 mb-1">First Hearing Date</label>
              <input
                type="date"
                value={firstHearingDate}
                onChange={(e) => setFirstHearingDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Next Hearing Date</label>
              <input
                type="date"
                value={nextHearingDate}
                onChange={(e) => setNextHearingDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none font-bold text-blue-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Case Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-blue-900 focus:outline-none"
              >
                <option value="">-- Select Status --</option>
                {APPEAL_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Hearings & Notices Tracker */}
          <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-800 flex items-center gap-1.5 text-xs">
                <FileText className="w-4 h-4 text-blue-700" />
                <span>Hearings &amp; Issued Notices Register (Continuous Tracking)</span>
              </span>
              <span className="text-[10.5px] text-slate-500 font-semibold">
                Total Listed: {hearings.length}
              </span>
            </div>

            {/* Input Row to add hearing */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 bg-white p-3 rounded-xl border border-slate-200 items-end">
              <div>
                <label className="block font-bold text-slate-600 mb-1 text-[11px]">Business On Date</label>
                <input
                  type="date"
                  value={newBusinessDate}
                  onChange={(e) => setNewBusinessDate(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1 text-[11px]">
                  Next Hearing Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={newHearingDate}
                  onChange={(e) => setNewHearingDate(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-blue-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1 text-[11px]">Purpose / Stage</label>
                <input
                  type="text"
                  placeholder="e.g. 2ND NOTICE, FOR COUNTER"
                  value={newHearingStage}
                  onChange={(e) => setNewHearingStage(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1 text-[11px]">Upload Notice / Order</label>
                <label className="w-full px-2 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs cursor-pointer flex items-center justify-between truncate">
                  <span className="truncate">{newNoticeName || 'Attach (PDF/Img)'}</span>
                  <Upload className="w-3.5 h-3.5 text-slate-600 shrink-0 ml-1" />
                  <input type="file" accept=".pdf,image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleAddHearing}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer shadow-sm active:scale-95 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Hearing</span>
                </button>
              </div>
            </div>

            {/* Existing Hearings List */}
            {hearings.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {hearings.map((h, idx) => (
                  <div
                    key={h.id || idx}
                    className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-xs hover:border-blue-300 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {hearings.length - idx}
                      </span>
                      <div>
                        <div className="font-bold text-slate-800">
                          Business on: <span className="text-slate-600">{h.businessDate || '-'}</span> → Next Hearing Date:{' '}
                          <span className="text-blue-900 font-black">{h.hearingDate}</span> —{' '}
                          <span className="text-amber-800 uppercase font-bold">{h.purpose}</span>
                        </div>
                        {h.documentFile && (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Attached: {h.documentName || 'Notice Copy'}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleRemoveHearing(h.id, e)}
                      className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg cursor-pointer transition shrink-0"
                      title="Remove Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400 text-xs italic bg-white rounded-lg border border-dashed border-slate-200">
                Inka notices add cheyyaledu. Paina date &amp; purpose enter chesi '+ Add Hearing' click cheyyandi.
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Remarks</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Official remarks..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
            />
          </div>

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