import React, { useState, useMemo, useRef } from 'react';
import {
  Scale,
  Search,
  Plus,
  Upload,
  Download,
  Printer,
  FileText,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Edit2,
  Trash2,
  RotateCcw,
  X,
  FileSpreadsheet,
  Gavel,
  Calendar,
  Building,
  MapPin,
  Eye,
  History
} from 'lucide-react';
import { AppealCase, CaseHistoryEntry, MANDAL_LIST, APPEAL_TYPES, APPEAL_STATUSES, StaffUser } from '../types';
import { printTableReport } from '../utils/printReport';
import { AppealCaseModal } from './modals/AppealCaseModal';
import { UploadFinalOrderModal } from './modals/UploadFinalOrderModal';

interface AppealCasesViewProps {
  appealCases: AppealCase[];
  currentUser?: StaffUser | null;
  onSaveCase: (caseData: AppealCase, rawFileString?: string) => Promise<void> | void;
  onUpdateCase: (updatedCase: AppealCase, rawFileString?: string) => Promise<void> | void;
  onDeleteCase: (appealCase: AppealCase) => void;
  onViewFinalOrder: (appealCase: AppealCase) => void;
  onShowToast: (msg: string) => void;
}

export const AppealCasesView: React.FC<AppealCasesViewProps> = ({
  appealCases,
  currentUser,
  onSaveCase,
  onUpdateCase,
  onDeleteCase,
  onViewFinalOrder,
  onShowToast,
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';
  const isViewer = !currentUser || currentUser?.role === 'VIEWER';
  const isOfficial = !isViewer;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMandal, setSelectedMandal] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [caseToEdit, setCaseToEdit] = useState<AppealCase | null>(null);
  const [caseForOrderUpload, setCaseForOrderUpload] = useState<AppealCase | null>(null);
  const [selectedCaseForDetail, setSelectedCaseForDetail] = useState<AppealCase | null>(null);

  const [isAddingHearingToCase, setIsAddingHearingToCase] = useState(false);
  const [quickNoticeDate, setQuickNoticeDate] = useState('');
  const [quickNextHearingDate, setQuickNextHearingDate] = useState('');
  const [quickHearingPurpose, setQuickHearingPurpose] = useState('FOR APPEARANCE & COUNTER');
  const [quickProceedings, setQuickProceedings] = useState('');
  const [stageFileBase64, setStageFileBase64] = useState('');
  const [stageFileName, setStageFileName] = useState('');
  const stageFileInputRef = useRef<HTMLInputElement>(null);
  const existingStageFileInputRef = useRef<HTMLInputElement>(null);
  const [targetStageIdForUpload, setTargetStageIdForUpload] = useState<string | null>(null);

  const excelInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const total = appealCases.length;
    const finalOrders = appealCases.filter((c) =>
      c.status.toLowerCase().includes('final order') || Boolean(c.finalOrderNo)
    ).length;
    const allowed = appealCases.filter((c) =>
      c.status.toLowerCase().includes('allowed')
    ).length;
    const dismissed = appealCases.filter((c) =>
      c.status.toLowerCase().includes('dismissed')
    ).length;
    const remanded = appealCases.filter((c) =>
      c.status.toLowerCase().includes('remanded')
    ).length;
    const pending = appealCases.filter(
      (c) =>
        c.status.toLowerCase().includes('hearing') ||
        c.status.toLowerCase().includes('stay') ||
        c.status.toLowerCase().includes('reserved')
    ).length;

    return { total, finalOrders, allowed, dismissed, remanded, pending };
  }, [appealCases]);

  const filteredCases = useMemo(() => {
    return appealCases.filter((c) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.caseNo.toLowerCase().includes(q) ||
        (c.registrationNo && c.registrationNo.toLowerCase().includes(q)) ||
        (c.bhuBharatiActSection && c.bhuBharatiActSection.toLowerCase().includes(q)) ||
        c.appealType.toLowerCase().includes(q) ||
        c.appellantName.toLowerCase().includes(q) ||
        c.respondentName.toLowerCase().includes(q) ||
        (c.appellantAdvocate && c.appellantAdvocate.toLowerCase().includes(q)) ||
        (c.respondentAdvocate && c.respondentAdvocate.toLowerCase().includes(q)) ||
        c.village.toLowerCase().includes(q) ||
        c.mandal.toLowerCase().includes(q) ||
        (c.surveyNo && c.surveyNo.toLowerCase().includes(q)) ||
        (c.finalOrderNo && c.finalOrderNo.toLowerCase().includes(q)) ||
        (c.finalOrderSummary && c.finalOrderSummary.toLowerCase().includes(q));

      const matchMandal = selectedMandal === 'ALL' || c.mandal === selectedMandal;
      const matchType =
        selectedTypeFilter === 'ALL' ||
        c.appealType === selectedTypeFilter ||
        (selectedTypeFilter === 'Other Revenue Appeal' &&
          (c.appealType === 'Other Revenue Appeal' ||
            c.appealType.startsWith('Other') ||
            !APPEAL_TYPES.includes(c.appealType as any)));

      let matchStatus = true;
      if (selectedStatusFilter === 'FINAL_ORDERS') {
        matchStatus = c.status.toLowerCase().includes('final order') || Boolean(c.finalOrderNo);
      } else if (selectedStatusFilter === 'ALLOWED') {
        matchStatus = c.status.toLowerCase().includes('allowed');
      } else if (selectedStatusFilter === 'DISMISSED_REMANDED') {
        matchStatus =
          c.status.toLowerCase().includes('dismissed') ||
          c.status.toLowerCase().includes('remanded');
      } else if (selectedStatusFilter === 'PENDING_STAY') {
        matchStatus =
          c.status.toLowerCase().includes('hearing') ||
          c.status.toLowerCase().includes('stay') ||
          c.status.toLowerCase().includes('reserved');
      }

      return matchSearch && matchMandal && matchType && matchStatus;
    });
  }, [appealCases, searchTerm, selectedMandal, selectedTypeFilter, selectedStatusFilter]);

  const handlePrintAllCasesRegister = (useAllDatabaseCases = true) => {
    const listToPrint = useAllDatabaseCases ? appealCases : filteredCases;
    if (listToPrint.length === 0) {
      onShowToast('No cases to print.');
      return;
    }

    const ths = `
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: center; width: 3.5%; font-size: 9pt; font-weight: 900;">Sl</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: center; width: 12%; font-size: 9pt; font-weight: 900;">Case No &amp; Statutory Section<br/><span style="font-size: 8pt; font-weight: bold; color: #93c5fd;">Bhu Bharati Act 2025</span></th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: left; width: 10%; font-size: 9pt; font-weight: 900;">Village &amp; Mandal</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: center; width: 8%; font-size: 9pt; font-weight: 900;">Sy.No / Extent</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: left; width: 13%; font-size: 9pt; font-weight: 900;">Appellant &amp; Counsel</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: left; width: 13%; font-size: 9pt; font-weight: 900;">Respondent &amp; Counsel</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: center; width: 8.5%; font-size: 9pt; font-weight: 900;">Impugned Order</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: center; width: 8%; font-size: 9pt; font-weight: 900;">Filing &amp; Hearing Dt</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: center; width: 7%; font-size: 9pt; font-weight: 900;">Status</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: center; width: 8%; font-size: 9pt; font-weight: 900;">Final Order / Dt</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: left; width: 9%; font-size: 9pt; font-weight: 900;">Operative Order</th>
    `;

    const trs = listToPrint
      .map((c, idx) => `
        <tr style="page-break-inside: avoid;">
          <td style="padding: 5px 3px; text-align: center; border: 1.2px solid #334155; font-weight: 900; font-size: 9pt; color: #000000;">${idx + 1}</td>
          <td style="padding: 5px 4px; text-align: center; border: 1.2px solid #334155;">
            <div style="font-weight: 900; color: #0f3b63; font-size: 9.5pt;">${c.caseNo}</div>
            <div style="font-size: 8.5pt; color: #1e3a8a; font-weight: 700;">${c.bhuBharatiActSection || c.appealType}</div>
          </td>
          <td style="padding: 5px 4px; border: 1.2px solid #334155;"><b>${c.village}</b><br/><span>${c.mandal} Mandal</span></td>
          <td style="padding: 5px 4px; text-align: center; border: 1.2px solid #334155;"><span>${c.surveyNo || '-'}</span><br/><span>${c.extent || '-'}</span></td>
          <td style="padding: 5px 4px; border: 1.2px solid #334155;"><b>${c.appellantName}</b></td>
          <td style="padding: 5px 4px; border: 1.2px solid #334155;"><b>${c.respondentName}</b></td>
          <td style="padding: 5px 4px; text-align: center; border: 1.2px solid #334155;">${c.impugnedOrderNo || '-'}</td>
          <td style="padding: 5px 4px; text-align: center; border: 1.2px solid #334155;">F: ${c.filingDate}<br/>H: ${c.hearingDate || '-'}</td>
          <td style="padding: 5px 4px; text-align: center; border: 1.2px solid #334155;"><b>${c.status}</b></td>
          <td style="padding: 5px 4px; text-align: center; border: 1.2px solid #334155;">${c.finalOrderNo || '-'}<br/>${c.finalOrderDate || '-'}</td>
          <td style="padding: 5px 4px; border: 1.2px solid #334155; font-size: 8.5pt;">${c.finalOrderSummary || '-'}</td>
        </tr>
      `).join('');

    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; font-size: 9pt; table-layout: fixed;">
        <thead><tr>${ths}</tr></thead>
        <tbody>${trs}</tbody>
      </table>
    `;

    printTableReport(tableHtml, {
      title: 'Complete Appellate Cases Register',
      subtitle: 'Court of the Revenue Divisional Officer & Sub-Divisional Magistrate, Huzurnagar',
      period: `Total Registered Appeals: ${listToPrint.length} Cases | As on: ${new Date().toLocaleDateString('en-IN')}`,
      landscape: true,
      fileName: 'RDO_Huzurnagar_Complete_Appellate_Register',
      isOfficial,
    });
  };

  const handlePrintDailyCauseList = () => {
    const causeListCases = filteredCases.length > 0 ? filteredCases : appealCases;
    const todayStr = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const ths = `
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: center; width: 4%;">Item No</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: center; width: 14%;">Case No</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: left; width: 12%;">Village &amp; Mandal</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: center; width: 8%;">Sy.No / Extent</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: left; width: 16%;">Appellant(s) &amp; Advocate</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: left; width: 16%;">Respondent(s) &amp; Advocate</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: center; width: 10%;">Purpose / Stage</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: center; width: 8%;">Status / Result</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: left; width: 12%;">Daily Proceedings</th>
    `;

    const trs = causeListCases
      .map((c, idx) => `
        <tr style="page-break-inside: avoid;">
          <td style="padding: 5px 3px; text-align: center; border: 1.2px solid #334155; font-weight: 900;">${idx + 1}</td>
          <td style="padding: 5px 4px; text-align: center; border: 1.2px solid #334155;"><b>${c.caseNo}</b></td>
          <td style="padding: 5px 4px; border: 1.2px solid #334155;"><b>${c.village}</b>, ${c.mandal}</td>
          <td style="padding: 5px 4px; text-align: center; border: 1.2px solid #334155;">${c.surveyNo || '-'} (${c.extent || '-'})</td>
          <td style="padding: 5px 4px; border: 1.2px solid #334155;"><b>${c.appellantName}</b></td>
          <td style="padding: 5px 4px; border: 1.2px solid #334155;"><b>${c.respondentName}</b></td>
          <td style="padding: 5px 4px; text-align: center; border: 1.2px solid #334155;">${c.stagePurpose || 'For Hearing'}</td>
          <td style="padding: 5px 4px; text-align: center; border: 1.2px solid #334155;"><b>${c.status}</b></td>
          <td style="padding: 5px 4px; border: 1.2px solid #334155;">${c.finalOrderSummary || 'Hearing scheduled.'}</td>
        </tr>
      `).join('');

    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; font-size: 9pt; table-layout: fixed;">
        <thead><tr>${ths}</tr></thead>
        <tbody>${trs}</tbody>
      </table>
    `;

    printTableReport(tableHtml, {
      title: 'Daily Bench Cause List',
      subtitle: 'Court of the Revenue Divisional Officer & Sub-Divisional Magistrate, Huzurnagar',
      period: `Cause List: ${todayStr} | Total Listed: ${causeListCases.length} Cases`,
      landscape: true,
      fileName: 'RDO_Huzurnagar_Daily_Cause_List',
      isOfficial,
    });
  };

  const handlePrintSingleCaseSlip = (c: AppealCase) => {
    // Individual case print preview handles isOfficial internally in modal
    const slipHtml = `
      <div style="font-family: sans-serif; font-size: 11px; line-height: 1.5; color: #0f172a;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; border: 1px solid #334155;">
          <tr style="background: #f1f5f9;">
            <th style="padding: 6px; border: 1px solid #94a3b8; width: 25%; text-align: left;">Case Number</th>
            <td style="padding: 6px; border: 1px solid #94a3b8; font-weight: bold;">${c.caseNo}</td>
            <th style="padding: 6px; border: 1px solid #94a3b8; width: 25%; text-align: left;">Filing Date</th>
            <td style="padding: 6px; border: 1px solid #94a3b8;">${c.filingDate}</td>
          </tr>
          <tr>
            <th style="padding: 6px; border: 1px solid #94a3b8; text-align: left;">Appeal Type</th>
            <td style="padding: 6px; border: 1px solid #94a3b8;">${c.appealType}</td>
            <th style="padding: 6px; border: 1px solid #94a3b8; text-align: left;">Statutory Section</th>
            <td style="padding: 6px; border: 1px solid #94a3b8;">${c.bhuBharatiActSection || '-'}</td>
          </tr>
          <tr style="background: #f8fafc;">
            <th style="padding: 6px; border: 1px solid #94a3b8; text-align: left;">Appellant</th>
            <td style="padding: 6px; border: 1px solid #94a3b8; font-weight: bold;">${c.appellantName}</td>
            <th style="padding: 6px; border: 1px solid #94a3b8; text-align: left;">Respondent</th>
            <td style="padding: 6px; border: 1px solid #94a3b8;">${c.respondentName}</td>
          </tr>
          <tr>
            <th style="padding: 6px; border: 1px solid #94a3b8; text-align: left;">Location &amp; Land</th>
            <td colspan="3" style="padding: 6px; border: 1px solid #94a3b8;">
              ${c.village} Village, ${c.mandal} Mandal • Sy.No: ${c.surveyNo || '-'} (Extent: ${c.extent || '-'})
            </td>
          </tr>
          <tr style="background: #fffbeb;">
            <th style="padding: 6px; border: 1px solid #94a3b8; text-align: left;">Current Status</th>
            <td style="padding: 6px; border: 1px solid #94a3b8; font-weight: bold; color: #b45309;">${c.status}</td>
            <th style="padding: 6px; border: 1px solid #94a3b8; text-align: left;">Next Hearing</th>
            <td style="padding: 6px; border: 1px solid #94a3b8; font-weight: bold;">${c.nextHearingDate || '-'}</td>
          </tr>
        </table>
      </div>
    `;

    printTableReport(slipHtml, {
      title: `Case Status Sheet - ${c.caseNo}`,
      subtitle: `Court of the Revenue Divisional Officer, Huzurnagar`,
      period: `Case: ${c.caseNo}`,
      landscape: false,
      fileName: `Case_${c.caseNo.replace(/[^a-zA-Z0-9]/g, '_')}`,
      isOfficial,
    });
  };

  return (
    <div className="space-y-6">
      {/* COURT HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#0c2a47] via-[#134674] to-[#1e5a92] text-white rounded-2xl p-6 shadow-md border-b-4 border-amber-400">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-inner">
              <Scale className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 rounded-md">
                  Revenue Court
                </span>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-500/40 text-blue-100 rounded-md border border-blue-300/30">
                  Telangana Bhu Bharati Act, 2025
                </span>
                <span className="text-xs font-semibold text-blue-200">
                  Huzurnagar Division • Suryapet District
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-wide text-white mt-0.5">
                COURT OF THE REVENUE DIVISIONAL OFFICER &amp; SDM
              </h1>
              <p className="text-xs text-blue-100 font-medium">
                Appellate Court Register, Daily Cause List &amp; Final Judgment Tracker under Telangana Bhu Bharati Act, 2025
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/15">
            <Gavel className="w-5 h-5 text-amber-300" />
            <div>
              <div className="text-[11px] text-blue-200 font-bold uppercase tracking-wide">
                Final Orders Passed
              </div>
              <div className="text-lg font-black text-white leading-none">
                {stats.finalOrders}{' '}
                <span className="text-xs font-medium text-blue-200">
                  / {stats.total} Cases Disposed
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLS & ACTION BUTTONS */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Case No, Appellant, Village, Order No, Survey..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Anyone (Public and Staff) can print Cause List and Cases Register */}
            <button
              onClick={handlePrintDailyCauseList}
              className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-300" />
              <span>Print Cause List</span>
            </button>

            <button
              onClick={() => handlePrintAllCasesRegister(true)}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-sky-300" />
              <span>Print All Cases ({appealCases.length})</span>
            </button>

            {!isViewer && (
              <>
                <button
                  onClick={() => {
                    setCaseToEdit(null);
                    setIsNewModalOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register New Appeal</span>
                </button>

                <input
                  type="file"
                  ref={excelInputRef}
                  accept=".xls,.xlsx,.csv"
                  className="hidden"
                  onChange={handleExcelUpload}
                />
                <button
                  onClick={() => excelInputRef.current?.click()}
                  className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Upload Cases (Excel)</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* APPEAL CASES TABLE */}
      <div className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[580px]">
          <table className="w-full text-xs text-left border-separate border-spacing-0 border-t border-l border-slate-300 bg-white">
            <thead className="sticky top-0 z-30 shadow-md">
              <tr className="sticky top-0 z-40 bg-[#134674]">
                <th
                  colSpan={8}
                  className="sticky top-0 left-0 z-40 bg-[#134674] text-white px-4 py-2.5 border-b-2 border-r border-[#0e3253] text-center"
                >
                  <span className="text-sm font-black text-white tracking-wide">
                    COURT OF THE REVENUE DIVISIONAL OFFICER, HUZURNAGAR — APPEAL CASES REGISTER
                  </span>
                </th>
              </tr>
              <tr className="sticky top-[44px] z-30 bg-[#164875]">
                <th className="py-2.5 px-3 border-b border-r border-slate-400 text-center font-bold text-white w-12">S.No</th>
                <th className="py-2.5 px-3 border-b border-r border-slate-400 text-center font-bold text-white">Case No</th>
                <th className="py-2.5 px-3 border-b border-r border-slate-400 text-center font-bold text-white">Location</th>
                <th className="py-2.5 px-3 border-b border-r border-slate-400 text-left font-bold text-white">Parties</th>
                <th className="py-2.5 px-3 border-b border-r border-slate-400 text-center font-bold text-white">Status</th>
                <th className="py-2.5 px-3 border-b border-r border-slate-400 text-left font-bold text-white">Final Order Details</th>
                <th className="py-2.5 px-3 border-b border-r border-slate-400 text-center font-bold text-white">Order Copy</th>
                <th className="py-2.5 px-3 border-b border-r border-slate-400 text-center font-bold text-white w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCases.map((c, idx) => (
                <tr key={c.id} className="hover:bg-blue-50/60 transition-colors">
                  <td className="py-3 px-3 border-r border-b border-slate-200 text-center font-bold text-slate-600">{idx + 1}</td>
                  <td className="py-3 px-3 border-r border-b border-slate-200 text-center">
                    <div onClick={() => setSelectedCaseForDetail(c)} className="font-black text-blue-900 hover:underline cursor-pointer">{c.caseNo}</div>
                    <div className="text-[10px] text-slate-500">{c.appealType}</div>
                  </td>
                  <td className="py-3 px-3 border-r border-b border-slate-200">
                    <div className="font-bold text-slate-900">{c.village}</div>
                    <div className="text-[10.5px] text-slate-600">{c.mandal} Mandal</div>
                  </td>
                  <td className="py-3 px-3 border-r border-b border-slate-200">
                    <div className="font-bold text-slate-900">App: {c.appellantName}</div>
                    <div className="text-slate-600">Resp: {c.respondentName}</div>
                  </td>
                  <td className="py-3 px-3 border-r border-b border-slate-200 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">{c.status}</span>
                  </td>
                  <td className="py-3 px-3 border-r border-b border-slate-200">
                    <div className="font-bold text-blue-900">{c.finalOrderNo || 'Pending'}</div>
                    <div className="text-[10.5px] text-slate-600 line-clamp-1">{c.finalOrderSummary || '-'}</div>
                  </td>
                  <td className="py-3 px-3 border-r border-b border-slate-200 text-center">
                    {c.finalOrderNo ? (
                      <button onClick={() => onViewFinalOrder(c)} className="bg-blue-600 text-white font-bold px-2 py-1 rounded text-[11px] cursor-pointer">
                        View Order
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">No Order</span>
                    )}
                  </td>
                  <td className="py-3 px-3 border-r border-b border-slate-200 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setSelectedCaseForDetail(c)} className="p-1.5 text-slate-500 hover:text-blue-700 cursor-pointer" title="View Case">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handlePrintSingleCaseSlip(c)} className="p-1.5 text-slate-500 hover:text-amber-700 cursor-pointer" title="Download Slip">
                        <Download className="w-4 h-4 text-amber-600" />
                      </button>
                      {!isViewer && (
                        <button onClick={() => { setCaseToEdit(c); setIsNewModalOpen(true); }} className="p-1.5 text-slate-500 hover:text-blue-700 cursor-pointer" title="Edit Case">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {isAdmin && (
                        <button onClick={() => onDeleteCase(c)} className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer" title="Delete Case">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      <AppealCaseModal
        isOpen={isNewModalOpen}
        onClose={() => { setIsNewModalOpen(false); setCaseToEdit(null); }}
        caseToEdit={caseToEdit}
        onSave={async (record, fileString) => {
          if (caseToEdit) await onUpdateCase(record, fileString);
          else await onSaveCase(record, fileString);
        }}
        onShowToast={onShowToast}
      />

      <UploadFinalOrderModal
        isOpen={Boolean(caseForOrderUpload)}
        onClose={() => setCaseForOrderUpload(null)}
        appealCase={caseForOrderUpload}
        onSaveOrder={async (updatedCase, fileBase64) => {
          await onUpdateCase(updatedCase, fileBase64);
        }}
        onShowToast={onShowToast}
      />
    </div>
  );
};