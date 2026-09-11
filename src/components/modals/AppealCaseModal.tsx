import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Scale, Trash2, Calendar, Clock, Plus, History } from 'lucide-react';
import { AppealCase, CaseHistoryEntry, APPEAL_TYPES, APPEAL_STATUSES, MANDAL_LIST, MANDAL_VILLAGES } from '../../types';

interface AppealCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseToEdit: AppealCase | null;
  onSave: (caseData: AppealCase, rawFileString?: string) => Promise<void> | void;
  onShowToast: (msg: string) => void;
}

const STAGE_OPTIONS = [
  "SUMMONS & NOTICE ISSUED",
  "FOR APPEARANCE & SERVICE OF NOTICE",
  "FOR COUNTER / WRITTEN STATEMENT",
  "FOR TAHSILDAR FIELD REPORT & JOINT INSPECTION",
  "FOR ARGUMENTS OF BOTH PARTIES",
  "RESERVED FOR ORDERS",
  "FINAL ORDER PRONOUNCED / DISPOSED"
];

export const AppealCaseModal: React.FC<AppealCaseModalProps> = ({
  isOpen,
  onClose,
  caseToEdit,
  onSave,
  onShowToast,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [caseNo, setCaseNo] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [registrationDate, setRegistrationDate] = useState('');
  const [cnrNumber, setCnrNumber] = useState('');
  const [appealType, setAppealType] = useState<string>(APPEAL_TYPES[0]);
  const [isManualAppealEntry, setIsManualAppealEntry] = useState(false);
  const [otherSectionDetail, setOtherSectionDetail] = useState('');
  const [bhuBharatiActSection, setBhuBharatiActSection] = useState('Section 15(1) read with Rule 14 of Telangana Bhu Bharati Rules, 2025');
  const [mandal, setMandal] = useState<string>(MANDAL_LIST[0]);
  const [village, setVillage] = useState<string>('');
  const [surveyNo, setSurveyNo] = useState('');
  const [extent, setExtent] = useState('');
  const [appellantName, setAppellantName] = useState('');
  const [appellantAdvocate, setAppellantAdvocate] = useState('');
  const [respondentName, setRespondentName] = useState('');
  const [respondentAdvocate, setRespondentAdvocate] = useState('');
  
  // Date Fields
  const [filingDate, setFilingDate] = useState('');
  const [noticeIssuedDate, setNoticeIssuedDate] = useState('');
  const [noticeServedDate, setNoticeServedDate] = useState('');
  const [firstHearingDate, setFirstHearingDate] = useState('');
  const [hearingDate, setHearingDate] = useState('');
  const [nextHearingDate, setNextHearingDate] = useState('');
  const [stagePurpose, setStagePurpose] = useState('SUMMONS & NOTICE ISSUED');
  const [impugnedOrderNo, setImpugnedOrderNo] = useState('');
  const [impugnedOrderDate, setImpugnedOrderDate] = useState('');
  const [status, setStatus] = useState<string>(APPEAL_STATUSES[4]); // default: Under Hearing
  const [finalOrderNo, setFinalOrderNo] = useState('');
  const [finalOrderDate, setFinalOrderDate] = useState('');
  const [finalOrderSummary, setFinalOrderSummary] = useState('');
  const [remarks, setRemarks] = useState('');

  // Case History Entries (Image 2 style)
  const [caseHistory, setCaseHistory] = useState<CaseHistoryEntry[]>([]);
  const [showAddHistoryRow, setShowAddHistoryRow] = useState(false);
  const [newHistBusinessDate, setNewHistBusinessDate] = useState(todayStr);
  const [newHistHearingDate, setNewHistHearingDate] = useState('');
  const [newHistPurpose, setNewHistPurpose] = useState('SUMMONS & NOTICE ISSUED');
  const [newHistProceedings, setNewHistProceedings] = useState('');

  // File upload state
  const [attachedFileBase64, setAttachedFileBase64] = useState<string | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to add days
  const addDays = (baseDate: string, days: number) => {
    const d = new Date(baseDate || todayStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const handleAppealTypeChange = (val: string) => {
    setAppealType(val);
    if (val === 'Other Revenue Appeal') {
      if (bhuBharatiActSection.includes('Bhu Bharati Rules')) {
        setBhuBharatiActSection('');
      }
    } else if (val.includes('RoR Rectification')) {
      setBhuBharatiActSection('Section 15(1) read with Rule 14 of Telangana Bhu Bharati Rules, 2025');
    } else if (val.includes('Mutation on Transfer')) {
      setBhuBharatiActSection('Section 15(1) read with Section 5 of Telangana Bhu Bharati Act, 2025');
    } else if (val.includes('Succession / Will')) {
      setBhuBharatiActSection('Section 15(1) read with Section 7 of Telangana Bhu Bharati Act, 2025');
    } else if (val.includes('Bhudhaar & Passbook')) {
      setBhuBharatiActSection('Section 15(1) read with Section 9 & 10 of Telangana Bhu Bharati Act, 2025');
    } else if (val.includes('Sadabainama')) {
      setBhuBharatiActSection('Section 6(1) & (5) of Telangana Bhu Bharati Act, 2025');
    } else if (val.includes('Court Decree')) {
      setBhuBharatiActSection('Section 8 of Telangana Bhu Bharati Act, 2025');
    } else if (val.includes('Tenancy Act')) {
      setBhuBharatiActSection('Section 90 of Tenancy & Agricultural Lands Act, 1950');
    } else if (val.includes('Inams Abolition')) {
      setBhuBharatiActSection('Section 24 of Inams Abolition Act, 1955');
    } else if (val.includes('Assigned Lands')) {
      setBhuBharatiActSection('Section 4A / 4B of Assigned Lands (POT) Act 9 of 1977');
    } else if (val.includes('Schedule A')) {
      setBhuBharatiActSection('Schedule A - RoR Correction (Survey No / Extent / NALA)');
    }
  };

  useEffect(() => {
    if (caseToEdit) {
      setCaseNo(caseToEdit.caseNo || '');
      setRegistrationNo(caseToEdit.registrationNo || caseToEdit.caseNo.replace(/[^0-9/]/g, '') || '');
      setRegistrationDate(caseToEdit.registrationDate || caseToEdit.filingDate || '');
      setCnrNumber(caseToEdit.cnrNumber || `TSHZNR04${String(caseToEdit.id).slice(-6)}2026`);
      
      const isKnownType = APPEAL_TYPES.includes(caseToEdit.appealType as any);
      if (!isKnownType) {
        setIsManualAppealEntry(true);
        setAppealType(caseToEdit.appealType || '');
        setOtherSectionDetail(caseToEdit.bhuBharatiActSection || caseToEdit.appealType || '');
      } else {
        setIsManualAppealEntry(false);
        setAppealType(caseToEdit.appealType || APPEAL_TYPES[0]);
        if (caseToEdit.appealType === 'Other Revenue Appeal') {
          setOtherSectionDetail(caseToEdit.bhuBharatiActSection || '');
        } else {
          setOtherSectionDetail('');
        }
      }

      setBhuBharatiActSection(caseToEdit.bhuBharatiActSection || 'Section 15(1) read with Rule 14 of Telangana Bhu Bharati Rules, 2025');
      setMandal(caseToEdit.mandal || MANDAL_LIST[0]);
      setVillage(caseToEdit.village || '');
      setSurveyNo(caseToEdit.surveyNo || '');
      setExtent(caseToEdit.extent || '');
      setAppellantName(caseToEdit.appellantName || '');
      setAppellantAdvocate(caseToEdit.appellantAdvocate || '');
      setRespondentName(caseToEdit.respondentName || '');
      setRespondentAdvocate(caseToEdit.respondentAdvocate || '');
      setFilingDate(caseToEdit.filingDate || '');
      setNoticeIssuedDate(caseToEdit.noticeIssuedDate || '');
      setNoticeServedDate(caseToEdit.noticeServedDate || '');
      setFirstHearingDate(caseToEdit.firstHearingDate || caseToEdit.filingDate || '');
      setHearingDate(caseToEdit.hearingDate || '');
      setNextHearingDate(caseToEdit.nextHearingDate || '');
      setStagePurpose(caseToEdit.stagePurpose ? caseToEdit.stagePurpose.replace(/\s*\([\u0C00-\u0C7F\s\/&,.-]+\)/g, '').trim() : 'SUMMONS & NOTICE ISSUED');
      setImpugnedOrderNo(caseToEdit.impugnedOrderNo || '');
      setImpugnedOrderDate(caseToEdit.impugnedOrderDate || '');
      setStatus(caseToEdit.status || APPEAL_STATUSES[4]);
      setFinalOrderNo(caseToEdit.finalOrderNo || '');
      setFinalOrderDate(caseToEdit.finalOrderDate || '');
      setFinalOrderSummary(caseToEdit.finalOrderSummary || '');
      setRemarks(caseToEdit.remarks || '');
      setAttachedFileName(caseToEdit.finalOrderFileName || '');
      setAttachedFileBase64(caseToEdit.finalOrderFile || null);
      setCaseHistory(caseToEdit.caseHistory || []);
    } else {
      setCaseNo('');
      setRegistrationNo('');
      setRegistrationDate(todayStr);
      setCnrNumber('');
      setAppealType(APPEAL_TYPES[0]);
      setIsManualAppealEntry(false);
      setOtherSectionDetail('');
      setBhuBharatiActSection('');
      setMandal(MANDAL_LIST[0]);
      const vList = MANDAL_VILLAGES[MANDAL_LIST[0]] || [];
      setVillage(vList[0] || '');
      setSurveyNo('');
      setExtent('');
      setAppellantName('');
      setAppellantAdvocate('');
      setRespondentName('');
      setRespondentAdvocate('');
      
      // Default dates
      setFilingDate(todayStr);
      setNoticeIssuedDate('');
      setNoticeServedDate('');
      setFirstHearingDate('');
      setHearingDate('');
      setNextHearingDate('');
      setStagePurpose('SUMMONS & NOTICE ISSUED');
      setImpugnedOrderNo('');
      setImpugnedOrderDate('');
      setStatus("Under Hearing");
      setFinalOrderNo('');
      setFinalOrderDate('');
      setFinalOrderSummary('');
      setRemarks('');
      setAttachedFileBase64(null);
      setAttachedFileName('');

      // Fresh empty case history
      setCaseHistory([]);
    }
  }, [caseToEdit, isOpen]);

  // When mandal changes, update available villages
  const handleMandalChange = (m: string) => {
    setMandal(m);
    const vList = MANDAL_VILLAGES[m] || [];
    setVillage(vList[0] || '');
  };

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
      onShowToast(`Final Order file attached: ${file.name}`);
    };
    reader.onerror = () => {
      onShowToast('Failed to read file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleAddHistoryRow = () => {
    if (!newHistBusinessDate || !newHistHearingDate) {
      onShowToast('Please provide both Business Date and Hearing Date.');
      return;
    }
    if (newHistBusinessDate > todayStr) {
      onShowToast('Business Date cannot be in the future.');
      return;
    }

    const newEntry: CaseHistoryEntry = {
      id: `CH-${Date.now()}`,
      judgeOfficer: 'Revenue Divisional Officer & SDM, Huzurnagar',
      businessDate: newHistBusinessDate,
      hearingDate: newHistHearingDate,
      purpose: newHistPurpose,
      proceedings: newHistProceedings.trim() || `${newHistPurpose} recorded on bench.`
    };

    setCaseHistory((prev) => [...prev, newEntry]);
    setNextHearingDate(newHistHearingDate);
    setHearingDate(newHistHearingDate);
    setStagePurpose(newHistPurpose);

    // Reset row inputs
    setNewHistHearingDate(addDays(newHistHearingDate, 14));
    setNewHistProceedings('');
    setShowAddHistoryRow(false);
    onShowToast('Hearing entry added to Case History successfully.');
  };

  const handleRemoveHistoryRow = (id: string) => {
    setCaseHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseNo.trim()) {
      onShowToast('Please enter Appeal Case Number.');
      return;
    }
    if (!appellantName.trim()) {
      onShowToast('Please enter Appellant Name.');
      return;
    }

    // STRICT FILING DATE VALIDATION: FUTURE DATE NOT ALLOWED
    if (filingDate && filingDate > todayStr) {
      onShowToast('Filing Date cannot be a future date! Enter today or a past date.');
      return;
    }

    if (registrationDate && registrationDate > todayStr) {
      onShowToast('Registration Date cannot be in the future.');
      return;
    }

    if (impugnedOrderDate && impugnedOrderDate > todayStr) {
      onShowToast('Impugned Tahsildar Order Date cannot be in the future.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure history contains at least initial notice and hearing
      let finalHistory = [...caseHistory];
      if (finalHistory.length === 0) {
        finalHistory.push({
          id: `CH-${Date.now()}-1`,
          judgeOfficer: 'Revenue Divisional Officer & SDM, Huzurnagar',
          businessDate: filingDate || todayStr,
          hearingDate: nextHearingDate || firstHearingDate || addDays(todayStr, 14),
          purpose: stagePurpose || 'SUMMONS & NOTICE ISSUED',
          proceedings: noticeIssuedDate 
            ? `Notice issued to respondents on ${noticeIssuedDate}. Posted for hearing.` 
            : 'Statutory notice issued to Tahsildar and Respondents.'
        });
      }

      // If final order is marked and not yet in history, append final order row
      if (status.includes('Final Order') && finalOrderDate) {
        const hasFinalOrderInHistory = finalHistory.some(h => h.purpose.includes('FINAL ORDER') || h.businessDate === finalOrderDate);
        if (!hasFinalOrderInHistory) {
          finalHistory.push({
            id: `CH-${Date.now()}-final`,
            judgeOfficer: 'Revenue Divisional Officer & SDM, Huzurnagar',
            businessDate: finalOrderDate,
            hearingDate: finalOrderDate,
            purpose: 'FINAL ORDER PRONOUNCED',
            proceedings: `Final Order pronounced. ${finalOrderNo ? `Order No: ${finalOrderNo}.` : ''} Result: ${status}.`
          });
        }
      }

      const finalAppealType = isManualAppealEntry
        ? (appealType.trim() || 'Other Revenue Appeal')
        : appealType;

      let finalSection = bhuBharatiActSection.trim();
      if (appealType === 'Other Revenue Appeal' && otherSectionDetail.trim()) {
        finalSection = otherSectionDetail.trim();
      }
      if (!finalSection) {
        finalSection = finalAppealType;
      }

      const record: AppealCase = {
        id: caseToEdit ? caseToEdit.id : Date.now(),
        caseNo: caseNo.trim(),
        registrationNo: registrationNo.trim(),
        registrationDate: registrationDate || filingDate || todayStr,
        cnrNumber: cnrNumber.trim(),
        appealType: finalAppealType,
        bhuBharatiActSection: finalSection,
        mandal,
        village: village || (MANDAL_VILLAGES[mandal]?.[0] || ''),
        surveyNo: surveyNo.trim(),
        extent: extent.trim(),
        appellantName: appellantName.trim(),
        appellantAdvocate: appellantAdvocate.trim(),
        respondentName: respondentName.trim() || 'Tahsildar & Others',
        respondentAdvocate: respondentAdvocate.trim(),
        filingDate: filingDate || todayStr,
        noticeIssuedDate: noticeIssuedDate.trim(),
        noticeServedDate: noticeServedDate.trim(),
        firstHearingDate: firstHearingDate || filingDate || todayStr,
        hearingDate: hearingDate || nextHearingDate || todayStr,
        nextHearingDate: nextHearingDate || (status.includes('Final Order') ? 'Disposed' : addDays(todayStr, 14)),
        stagePurpose: stagePurpose.trim(),
        impugnedOrderNo: impugnedOrderNo.trim(),
        impugnedOrderDate: impugnedOrderDate || filingDate,
        status,
        finalOrderNo: finalOrderNo.trim(),
        finalOrderDate: finalOrderDate || (status.includes('Final Order') ? todayStr : ''),
        finalOrderSummary: finalOrderSummary.trim(),
        hasFinalOrderAttachment: Boolean(attachedFileBase64 || caseToEdit?.hasFinalOrderAttachment),
        finalOrderFileName: attachedFileName || (attachedFileBase64 ? 'Final_Order_Copy.pdf' : (caseToEdit?.finalOrderFileName || '')),
        remarks: remarks.trim(),
        caseHistory: finalHistory
      };

      await onSave(record, attachedFileBase64 || undefined);
      onClose();
    } catch (err) {
      console.error('Error saving appeal case:', err);
      onShowToast('Failed to save appeal case.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-8 overflow-hidden animate-fade-in flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#134674] to-[#1e5a92] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Scale className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 rounded">
                  Revenue Court
                </span>
                <span className="px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider bg-blue-500/40 text-blue-100 rounded border border-blue-300/30">
                  Telangana Bhu Bharati Act, 2025
                </span>
              </div>
              <h3 className="text-base md:text-lg font-black tracking-wide mt-1">
                {caseToEdit ? 'Edit Appeal Case & Hearing Status' : 'Register New Appeal Case & Hearing Schedule'}
              </h3>
              <p className="text-xs text-blue-100 font-medium">
                Court of the Revenue Divisional Officer &amp; Sub-Divisional Magistrate, Huzurnagar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Section 1: Court Case Identification & Filing Dates */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider text-blue-900">
                <FileText className="w-4 h-4 text-blue-700" />
                <span>1. Case Identification &amp; Filing Details</span>
              </h4>
              <span className="text-[10px] font-bold text-slate-500">
                Today: <strong className="text-slate-800">{todayStr}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Appeal Case No <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ROR/BB/14/2026"
                  value={caseNo}
                  onChange={(e) => setCaseNo(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-bold text-blue-950"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Registration Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 14/2026"
                  value={registrationNo}
                  onChange={(e) => setRegistrationNo(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Registration Date
                </label>
                <input
                  type="date"
                  max={todayStr}
                  value={registrationDate}
                  onChange={(e) => {
                    if (e.target.value > todayStr) {
                      onShowToast('Registration Date cannot be in the future.');
                      return;
                    }
                    setRegistrationDate(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  CNR / Portal Identifier
                </label>
                <input
                  type="text"
                  placeholder="e.g. TSHZNR040008622026"
                  value={cnrNumber}
                  onChange={(e) => setCnrNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Row 2: Appeal Under Act & STRICT FILING DATE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-bold text-xs">
                    Appeal Under Act / Subject <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isManualAppealEntry;
                      setIsManualAppealEntry(next);
                      if (next && appealType === 'Other Revenue Appeal') {
                        setAppealType('');
                      }
                    }}
                    className="text-[10.5px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md transition flex items-center gap-1 cursor-pointer"
                    title="Toggle between Dropdown List and Normal Direct Entry"
                  >
                    {isManualAppealEntry ? (
                      <span>📋 Select from List</span>
                    ) : (
                      <span>✍️ Normal Entry / Text Input</span>
                    )}
                  </button>
                </div>

                {isManualAppealEntry ? (
                  <div>
                    <input
                      type="text"
                      list="appeal-types-datalist"
                      placeholder="Type Act / Section / Subject (e.g. Tenancy Act Sec 90, WALTA Sec 19)"
                      value={appealType}
                      onChange={(e) => {
                        setAppealType(e.target.value);
                        setBhuBharatiActSection(e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-white border-2 border-blue-400 rounded-lg focus:border-blue-600 focus:outline-none font-bold text-blue-950 text-xs shadow-xs"
                      autoFocus
                    />
                    <datalist id="appeal-types-datalist">
                      {APPEAL_TYPES.map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Direct text entry enabled. You can enter any custom Act, Section, or appeal subject freely.
                    </p>
                  </div>
                ) : (
                  <select
                    value={appealType}
                    onChange={(e) => handleAppealTypeChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold text-blue-900 text-xs"
                  >
                    {APPEAL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                )}

                {/* Instant Section Entry Card when Other Revenue Appeal is clicked/selected */}
                {!isManualAppealEntry && appealType === 'Other Revenue Appeal' && (
                  <div className="mt-2.5 p-3 bg-amber-50/95 border-2 border-amber-400 rounded-xl space-y-2 animate-in fade-in zoom-in-95 duration-150 shadow-xs">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-amber-700" />
                        <span>Section &amp; Act Details <span className="text-red-600">*</span></span>
                      </label>
                      <span className="text-[9.5px] bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded">
                        Required for Other Appeals
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tenancy Act Sec 90 / Land Acquisition Sec 64 / WALTA Act 2002"
                      value={otherSectionDetail}
                      onChange={(e) => {
                        setOtherSectionDetail(e.target.value);
                        setBhuBharatiActSection(e.target.value);
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-amber-400 rounded-lg focus:border-amber-600 focus:ring-2 focus:ring-amber-200 focus:outline-none font-bold text-xs text-slate-900 shadow-inner"
                      autoFocus
                    />
                    <div>
                      <div className="text-[10px] font-bold text-amber-900 mb-1">
                        Quick Section Presets:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {[
                          'Tenancy Act 1950 Sec 90',
                          'Inams Abolition 1955 Sec 24',
                          'Assigned Lands POT Act 9/1977 Sec 4',
                          'Land Acquisition Act 2013 Sec 64',
                          'AP ROR Act 1971 Sec 5-B',
                          'WALTA Act 2002 Sec 19',
                          'Land Encroachment Act 1905',
                          'Alienation / Mutation Appeal',
                        ].map((preset) => (
                          <button
                            type="button"
                            key={preset}
                            onClick={() => {
                              setOtherSectionDetail(preset);
                              setBhuBharatiActSection(preset);
                            }}
                            className="text-[9.5px] bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded-md font-semibold transition cursor-pointer shadow-2xs hover:border-amber-500"
                          >
                            + {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* STRICT FILING DATE: NO FUTURE DATE ALLOWED */}
              <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-300/80">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-amber-950 font-black flex items-center gap-1">
                    <span>Filing Date</span>
                    <span className="text-red-600">*</span>
                    <span className="text-[10px] text-red-600 font-bold ml-1">
                      (No future dates permitted)
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFilingDate(todayStr)}
                    className="text-[10px] bg-amber-200 hover:bg-amber-300 text-amber-950 px-2 py-0.5 rounded font-bold transition cursor-pointer"
                  >
                    Set Today
                  </button>
                </div>
                <input
                  type="date"
                  required
                  max={todayStr}
                  value={filingDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val > todayStr) {
                      onShowToast('Filing Date cannot be a future date! Enter today or a past date.');
                      return;
                    }
                    setFilingDate(val);
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg focus:border-amber-600 focus:outline-none font-bold text-slate-800"
                />
                <p className="text-[10px] text-amber-900/80 mt-1 font-medium">
                  Date on which the appeal petition was officially presented in court.
                </p>
              </div>
            </div>

            {/* Statutory Provision / Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-blue-50/50 p-2.5 rounded-lg border border-blue-200">
              <div>
                <label className="block text-blue-950 font-bold mb-1">
                  {appealType.includes('Bhu Bharati') || appealType.includes('Sadabainama')
                    ? 'Bhu Bharati Act 2025 Statutory Provision / Section'
                    : 'Revenue Act / Statutory Provision / Section'}
                </label>
                <input
                  type="text"
                  placeholder={
                    appealType.includes('Bhu Bharati')
                      ? 'e.g. Section 15(1) read with Rule 14 & Section 4(5)'
                      : 'e.g. Section 90 / Section 64 / Section 4A & 4B'
                  }
                  value={bhuBharatiActSection}
                  onChange={(e) => {
                    setBhuBharatiActSection(e.target.value);
                    if (appealType === 'Other Revenue Appeal') {
                      setOtherSectionDetail(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-md focus:border-blue-500 focus:outline-none font-semibold text-xs text-blue-900"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(appealType.includes('Bhu Bharati') || appealType.includes('Sadabainama')
                    ? [
                        'Sec 15(1) r/w Rule 14 (RoR Rectification)',
                        'Sec 6(1) & (5) (Sadabainama Regularisation)',
                        'Sec 15(1) r/w Sec 5 (Mutation Appeal)',
                        'Sec 15(1) r/w Sec 9 & 10 (Passbook Issue)',
                      ]
                    : [
                        'Section 90 of Tenancy & Agrl Lands Act, 1950',
                        'Section 24 of Inams Abolition Act, 1955',
                        'Section 4A / 4B of Assigned Lands (POT) Act 9/1977',
                        'Section 64 of RFCTLARR (Land Acquisition) Act, 2013',
                        'Section 19 of WALTA Act, 2002',
                      ]
                  ).map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => {
                        setBhuBharatiActSection(preset);
                        if (appealType === 'Other Revenue Appeal') {
                          setOtherSectionDetail(preset);
                        }
                      }}
                      className="text-[9.5px] bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded transition cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Impugned Tahsildar Order No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. File No. B/ROR/842/2025"
                    value={impugnedOrderNo}
                    onChange={(e) => setImpugnedOrderNo(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Impugned Order Date
                  </label>
                  <input
                    type="date"
                    max={todayStr}
                    value={impugnedOrderDate}
                    onChange={(e) => {
                      if (e.target.value > todayStr) {
                        onShowToast('Impugned Order Date cannot be in the future.');
                        return;
                      }
                      setImpugnedOrderDate(e.target.value);
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Land Location Details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Mandal</label>
                <select
                  value={mandal}
                  onChange={(e) => handleMandalChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-bold"
                >
                  {MANDAL_LIST.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Village</label>
                <select
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold"
                >
                  {(MANDAL_VILLAGES[mandal] || []).map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Survey No</label>
                <input
                  type="text"
                  placeholder="e.g. 284/A/1"
                  value={surveyNo}
                  onChange={(e) => setSurveyNo(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Extent (Ac.Gts)</label>
                <input
                  type="text"
                  placeholder="e.g. 03.20 Ac.Gts"
                  value={extent}
                  onChange={(e) => setExtent(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Parties & Counsels (Image 1 Style) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="font-black text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider text-blue-900">
              <Scale className="w-4 h-4 text-blue-700" />
              <span>2. Petitioner / Appellant &amp; Respondent Details</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-200 space-y-2">
                <span className="font-extrabold text-blue-800 block text-xs">Petitioner / Appellant(s)</span>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Appellant Name(s) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ANANTHU PADMA / Gudipati Venkataiah"
                    value={appellantName}
                    onChange={(e) => setAppellantName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Advocate- / Counsel
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Shaik Saida Hussain, Advocate"
                    value={appellantAdvocate}
                    onChange={(e) => setAppellantAdvocate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-200 space-y-2">
                <span className="font-extrabold text-purple-800 block text-xs">Respondent(s)</span>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Respondent Name(s)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RATHIKINDI JANAKAMMA / Tahsildar Huzurnagar"
                    value={respondentName}
                    onChange={(e) => setRespondentName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Respondent Advocate / GP for Revenue
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GP for Revenue & Sri V. Narasimha Reddy"
                    value={respondentAdvocate}
                    onChange={(e) => setRespondentAdvocate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Case Status, Notices & Next Hearing (Court Status Card - Image 1 & 2) */}
          <div className="bg-amber-50/40 p-4 rounded-xl border-2 border-amber-300/80 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-amber-950 flex items-center gap-2 text-xs uppercase tracking-wider">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>3. Case Status, Notice Tracking &amp; Next Hearing</span>
              </h4>
              <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                Court Status Box
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* First Hearing Date */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  First Hearing Date
                </label>
                <input
                  type="date"
                  value={firstHearingDate}
                  onChange={(e) => setFirstHearingDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold"
                />
              </div>

              {/* Notice Issued Date */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-bold">
                    Notice Issued Date
                  </label>
                  <button
                    type="button"
                    onClick={() => setNoticeIssuedDate(todayStr)}
                    className="text-[9.5px] text-blue-700 hover:underline font-bold"
                  >
                    Today
                  </button>
                </div>
                <input
                  type="date"
                  max={todayStr}
                  value={noticeIssuedDate}
                  onChange={(e) => {
                    if (e.target.value > todayStr) {
                      onShowToast('Notice Issued Date cannot be in the future.');
                      return;
                    }
                    setNoticeIssuedDate(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold"
                />
              </div>

              {/* Notice Served Date */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Notice Served Date
                </label>
                <input
                  type="date"
                  max={todayStr}
                  value={noticeServedDate}
                  onChange={(e) => {
                    if (e.target.value > todayStr) {
                      onShowToast('Notice Served Date cannot be in the future.');
                      return;
                    }
                    setNoticeServedDate(e.target.value);
                  }}
                  placeholder="Optional"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Next Hearing Date & Stage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Next Hearing Date with quick selectors */}
              <div className="bg-white p-3 rounded-lg border-2 border-amber-400 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-amber-950 font-black text-xs flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>Next Hearing Date <span className="text-red-600">*</span></span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-bold">Quick Presets</span>
                </div>
                <input
                  type="date"
                  required
                  value={nextHearingDate}
                  onChange={(e) => setNextHearingDate(e.target.value)}
                  className="w-full px-3 py-2 bg-amber-50/50 border border-amber-300 rounded-lg focus:border-amber-600 focus:outline-none font-black text-sm text-amber-950 mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNextHearingDate(addDays(todayStr, 7))}
                    className="text-[10px] bg-slate-100 hover:bg-amber-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded font-bold transition cursor-pointer"
                  >
                    +7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setNextHearingDate(addDays(todayStr, 14))}
                    className="text-[10px] bg-slate-100 hover:bg-amber-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded font-bold transition cursor-pointer"
                  >
                    +14 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setNextHearingDate(addDays(todayStr, 21))}
                    className="text-[10px] bg-slate-100 hover:bg-amber-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded font-bold transition cursor-pointer"
                  >
                    +21 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setNextHearingDate(addDays(todayStr, 30))}
                    className="text-[10px] bg-slate-100 hover:bg-amber-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded font-bold transition cursor-pointer"
                  >
                    +30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setNextHearingDate('Disposed')}
                    className="text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded font-bold transition cursor-pointer"
                  >
                    Disposed
                  </button>
                </div>
              </div>

              {/* Case Stage */}
              <div className="bg-white p-3 rounded-lg border border-slate-300">
                <label className="block text-slate-800 font-black text-xs mb-1">
                  Case Stage / Purpose of Hearing
                </label>
                <select
                  value={stagePurpose}
                  onChange={(e) => setStagePurpose(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-bold text-slate-900 mb-2"
                >
                  {STAGE_OPTIONS.map((stg) => (
                    <option key={stg} value={stg}>
                      {stg}
                    </option>
                  ))}
                  <option value="EX-PARTE EVIDENCE">EX-PARTE EVIDENCE</option>
                  <option value="FOR TAHSILDAR REPORT">FOR TAHSILDAR REPORT</option>
                  <option value="FINAL ORDER PRONOUNCED">FINAL ORDER PRONOUNCED</option>
                </select>

                <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="font-semibold">Bench:</span>
                  <span className="font-black text-blue-900">Revenue Divisional Officer &amp; SDM, Huzurnagar</span>
                </div>
              </div>
            </div>

            {/* Case History Table (Image 2 style) */}
            <div className="bg-white rounded-xl border border-amber-200 overflow-hidden mt-3">
              <div className="bg-amber-100/70 px-3 py-2 border-b border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-black text-amber-950 text-xs">
                  <History className="w-4 h-4 text-amber-800" />
                  <span>Case History &amp; Proceedings Timeline</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddHistoryRow(!showAddHistoryRow)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10.5px] px-2.5 py-1 rounded flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{showAddHistoryRow ? 'Close Row' : '+ Add Hearing / Notice Entry'}</span>
                </button>
              </div>

              {/* Add Entry Sub-Form */}
              {showAddHistoryRow && (
                <div className="p-3 bg-amber-50/60 border-b border-amber-200 space-y-2">
                  <span className="font-bold text-amber-950 text-[11px] block">
                    Record New Hearing / Notice Proceedings:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-slate-600 font-bold text-[10px] mb-0.5">
                        Business on Date (Max: Today)
                      </label>
                      <input
                        type="date"
                        max={todayStr}
                        value={newHistBusinessDate}
                        onChange={(e) => {
                          if (e.target.value > todayStr) {
                            onShowToast('Business Date cannot be in the future.');
                            return;
                          }
                          setNewHistBusinessDate(e.target.value);
                        }}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold text-[10px] mb-0.5">
                        Hearing Date / Next Date
                      </label>
                      <input
                        type="date"
                        value={newHistHearingDate}
                        onChange={(e) => setNewHistHearingDate(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold text-[10px] mb-0.5">
                        Purpose of Hearing
                      </label>
                      <select
                        value={newHistPurpose}
                        onChange={(e) => setNewHistPurpose(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold"
                      >
                        {STAGE_OPTIONS.map((stg) => (
                          <option key={stg} value={stg}>
                            {stg}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddHistoryRow}
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold px-3 py-1.5 rounded text-xs transition cursor-pointer"
                      >
                        Save to Timeline
                      </button>
                    </div>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Brief bench note / proceedings (e.g. Notice issued to respondents. Counter filed. Reserved for orders.)"
                      value={newHistProceedings}
                      onChange={(e) => setNewHistProceedings(e.target.value)}
                      className="w-full px-3 py-1 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Timeline Table */}
              <div className="overflow-x-auto max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 font-bold text-[10.5px]">Judge / Officer</th>
                      <th className="py-2 px-3 font-bold text-[10.5px]">Business on Date</th>
                      <th className="py-2 px-3 font-bold text-[10.5px]">Hearing Date</th>
                      <th className="py-2 px-3 font-bold text-[10.5px]">Purpose of Hearing</th>
                      <th className="py-2 px-3 font-bold text-[10.5px]">Proceedings / Notes</th>
                      <th className="py-2 px-2 font-bold text-[10.5px] text-center w-10">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {caseHistory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-slate-400 italic">
                          No history rows added yet. Initial hearing timeline will be generated automatically on save.
                        </td>
                      </tr>
                    ) : (
                      caseHistory.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-amber-50/40">
                          <td className="py-2 px-3 font-semibold text-slate-800 text-[11px]">
                            {item.judgeOfficer || 'Revenue Divisional Officer & SDM, Huzurnagar'}
                          </td>
                          <td className="py-2 px-3 font-bold text-blue-900 text-[11px]">
                            {item.businessDate}
                          </td>
                          <td className="py-2 px-3 font-black text-amber-900 text-[11px]">
                            {item.hearingDate}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-700 text-[11px]">
                            {item.purpose}
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[10.5px] max-w-xs truncate" title={item.proceedings}>
                            {item.proceedings || '-'}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveHistoryRow(item.id)}
                              className="text-slate-400 hover:text-red-600 p-1 transition cursor-pointer"
                              title="Delete entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 4: Final Order & Judgment Details (If Case is Disposed) */}
          <div className="bg-blue-50/60 p-4 rounded-xl border-2 border-blue-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-blue-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                <FileText className="w-4 h-4 text-blue-700" />
                <span>4. Final Order / Judgment Details &amp; File Upload</span>
              </h4>
              <span className="text-[11px] font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                Final Order Copies
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Case Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStatus(val);
                    if (val.includes('Final Order') && !finalOrderDate) {
                      setFinalOrderDate(todayStr);
                      setNextHearingDate('Disposed');
                      setStagePurpose('FINAL ORDER PRONOUNCED / DISPOSED');
                    }
                  }}
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
                  Final Order / Procgs No
                </label>
                <input
                  type="text"
                  placeholder="e.g. Procgs. No. D/ROR/BB/1142/2026"
                  value={finalOrderNo}
                  onChange={(e) => setFinalOrderNo(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Final Order Date
                </label>
                <input
                  type="date"
                  max={todayStr}
                  value={finalOrderDate}
                  onChange={(e) => {
                    if (e.target.value > todayStr) {
                      onShowToast('Final Order Date cannot be in the future.');
                      return;
                    }
                    setFinalOrderDate(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-bold">
                  Final Order Operative Portion / Directives to Tahsildar (Bhu Bharati Act 2025)
                </label>
                <span className="text-[10px] text-blue-800 font-bold">Quick Templates</span>
              </div>
              
              <div className="flex flex-wrap gap-1.5 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setStatus("Final Order Issued - Allowed");
                    setStagePurpose('FINAL ORDER PRONOUNCED / DISPOSED');
                    setNextHearingDate('Disposed');
                    if (!finalOrderDate) setFinalOrderDate(todayStr);
                    setFinalOrderSummary("Appeal ALLOWED under Section 15(1) read with Rule 14 of Telangana Bhu Bharati Rules, 2025. The impugned proceedings of Tahsildar are set aside. Tahsildar is hereby directed to rectify the Record of Rights in Bhu Bharati Portal under Rule 5(6), mutate the subject land in favor of the appellant, and issue updated digital Pattadar Pass Book-cum-Title Deed under Rule 5(7) / 10(1) within 15 days.");
                  }}
                  className="text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded font-bold cursor-pointer transition"
                >
                  + Allowed &amp; Rectify RoR (Rule 5(6))
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatus("Final Order Issued - Allowed");
                    setStagePurpose('FINAL ORDER PRONOUNCED / DISPOSED');
                    setNextHearingDate('Disposed');
                    if (!finalOrderDate) setFinalOrderDate(todayStr);
                    setFinalOrderSummary("Appeal ALLOWED. Sadabainama regularisation validated under Section 6 of Telangana Bhu Bharati (Record of Rights in Land) Act, 2025. Tahsildar directed to incorporate alienor/alienee rights in Bhu Bharati Land Records database and issue Pattadar Pass Book.");
                  }}
                  className="text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300 px-2 py-0.5 rounded font-bold cursor-pointer transition"
                >
                  + Sadabainama Sec 6 Validation
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatus("Final Order Issued - Remanded");
                    setStagePurpose('FINAL ORDER PRONOUNCED / DISPOSED');
                    setNextHearingDate('Disposed');
                    if (!finalOrderDate) setFinalOrderDate(todayStr);
                    setFinalOrderSummary("Appeal REMANDED back to Tahsildar under Rule 14(4) of Telangana Bhu Bharati Rules, 2025 for de-novo enquiry. Mandal Surveyor and Tahsildar shall conduct joint spot inspection with prior notice to both parties and pass a speaking order within 30 days.");
                  }}
                  className="text-[10px] bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 px-2 py-0.5 rounded font-bold cursor-pointer transition"
                >
                  + Remanded for Joint Inspection
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatus("Final Order Issued - Dismissed");
                    setStagePurpose('FINAL ORDER PRONOUNCED / DISPOSED');
                    setNextHearingDate('Disposed');
                    if (!finalOrderDate) setFinalOrderDate(todayStr);
                    setFinalOrderSummary("Appeal DISMISSED under Section 15(1) of Telangana Bhu Bharati Act, 2025. The appellant failed to produce prima-facie title or registered conveyance deed. The impugned orders of Tahsildar are confirmed.");
                  }}
                  className="text-[10px] bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 px-2 py-0.5 rounded font-bold cursor-pointer transition"
                >
                  + Appeal Dismissed
                </button>
              </div>

              <textarea
                rows={3}
                placeholder="Brief summary of the final order passed by the Revenue Divisional Officer (e.g. Appeal allowed; Tahsildar directed to rectify Khata entry and restore 03.20 Ac.Gts in favor of appellant...)"
                value={finalOrderSummary}
                onChange={(e) => setFinalOrderSummary(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none text-slate-800 font-medium"
              />
            </div>

            {/* Drag and Drop File Upload Area */}
            <div>
              <label className="block text-slate-800 font-black mb-1.5 flex items-center justify-between">
                <span>Upload Signed Final Order Document / Scan (PDF, Image)</span>
                {attachedFileName && (
                  <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Attached
                  </span>
                )}
              </label>

              {attachedFileName ? (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-emerald-300 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">
                        {attachedFileName}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        Ready to save with case record
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachedFileBase64(null);
                      setAttachedFileName('');
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition cursor-pointer"
                    title="Remove attachment"
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
                  onDrop={handleFileDrop}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50'
                  }`}
                  onClick={() => document.getElementById('appealFinalOrderFileInput')?.click()}
                >
                  <input
                    id="appealFinalOrderFileInput"
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
                      Click to choose or drag &amp; drop Final Order copy
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
                Office Directions / Remarks
              </label>
              <input
                type="text"
                placeholder="e.g. Order copy served to Tahsildar for compliance within 30 days."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
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
                  <span>{caseToEdit ? 'Update Appeal Case' : 'Register Appeal Case'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
